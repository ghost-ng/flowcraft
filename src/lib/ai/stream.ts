// ---------------------------------------------------------------------------
// SSE Stream Parsers — Anthropic and OpenAI wire formats
// ---------------------------------------------------------------------------

/** Discriminated union of events emitted while parsing an SSE stream. */
export type StreamEvent =
  | { type: 'text'; text: string }
  | { type: 'tool_call_start'; id: string; name: string }
  | { type: 'tool_call_delta'; id: string; argsChunk: string }
  | { type: 'tool_call_end'; id: string }
  | { type: 'done'; stopReason: string }
  | { type: 'error'; message: string };

// ---------------------------------------------------------------------------
// Shared SSE line iterator
// ---------------------------------------------------------------------------

/**
 * Reads a `Response` body as a series of SSE frames. Each yielded frame
 * contains the accumulated `event` and `data` fields from one SSE block
 * (delimited by a blank line).
 *
 * Handles:
 * - Partial UTF-8 chunks via streaming TextDecoder
 * - Lines split across chunk boundaries via an internal buffer
 * - `:` comment lines (ignored)
 */
async function* sseFrames(
  response: Response,
): AsyncGenerator<{ event: string; data: string }> {
  const body = response.body;
  if (!body) {
    return;
  }

  const reader = body.getReader();
  const decoder = new TextDecoder('utf-8');

  let lineBuffer = '';
  let currentEvent = '';
  let currentData = '';

  try {
    for (;;) {
      const { done, value } = await reader.read();

      // Decode the chunk (may be partial UTF-8)
      const text = done ? decoder.decode() : decoder.decode(value, { stream: true });
      if (done && text.length === 0) {
        // Flush any pending frame before exiting
        if (currentData) {
          yield { event: currentEvent, data: currentData };
        }
        break;
      }

      lineBuffer += text;

      // Process all complete lines in the buffer
      const lines = lineBuffer.split('\n');
      // The last element is either '' (if the chunk ended with \n) or a partial line
      lineBuffer = lines.pop() ?? '';

      for (const rawLine of lines) {
        const line = rawLine.replace(/\r$/, ''); // strip trailing \r from \r\n

        if (line === '') {
          // Blank line = end of SSE frame
          if (currentData) {
            yield { event: currentEvent, data: currentData };
          }
          currentEvent = '';
          currentData = '';
          continue;
        }

        // Skip SSE comments
        if (line.startsWith(':')) {
          continue;
        }

        if (line.startsWith('event:')) {
          currentEvent = line.slice('event:'.length).trim();
        } else if (line.startsWith('data:')) {
          const payload = line.slice('data:'.length).trimStart();
          // Multiple `data:` lines in one frame are joined by newlines per spec
          currentData = currentData ? `${currentData}\n${payload}` : payload;
        }
        // id: and retry: fields are ignored — not needed for our use case
      }

      if (done) {
        // Flush any remaining partial frame
        if (currentData) {
          yield { event: currentEvent, data: currentData };
        }
        break;
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// ---------------------------------------------------------------------------
// Safe JSON parse helper
// ---------------------------------------------------------------------------

function tryParseJSON(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Anthropic SSE parser
// ---------------------------------------------------------------------------

/**
 * Parses an Anthropic Messages API SSE stream into StreamEvents.
 *
 * Anthropic SSE uses both `event:` and `data:` lines. Key event types:
 * - message_start, content_block_start, content_block_delta,
 *   content_block_stop, message_delta, message_stop
 */
export async function* parseAnthropicStream(
  response: Response,
): AsyncGenerator<StreamEvent> {
  let currentBlockType: 'text' | 'tool_use' | null = null;
  let currentToolId = '';
  let stopReason = 'end_turn';

  for await (const frame of sseFrames(response)) {
    const { event, data } = frame;

    // Parse the JSON payload
    const parsed = tryParseJSON(data);
    if (!parsed || typeof parsed !== 'object') {
      continue;
    }

    const payload = parsed as Record<string, unknown>;

    switch (event) {
      case 'message_start': {
        // Could extract message.id here if needed; nothing to emit
        break;
      }

      case 'content_block_start': {
        const block = payload.content_block as
          | { type: string; id?: string; name?: string }
          | undefined;
        if (!block) break;

        if (block.type === 'text') {
          currentBlockType = 'text';
        } else if (block.type === 'tool_use') {
          currentBlockType = 'tool_use';
          currentToolId = (block.id as string) ?? '';
          yield {
            type: 'tool_call_start',
            id: currentToolId,
            name: (block.name as string) ?? '',
          };
        }
        break;
      }

      case 'content_block_delta': {
        const delta = payload.delta as
          | { type: string; text?: string; partial_json?: string }
          | undefined;
        if (!delta) break;

        if (delta.type === 'text_delta' && typeof delta.text === 'string') {
          yield { type: 'text', text: delta.text };
        } else if (
          delta.type === 'input_json_delta' &&
          typeof delta.partial_json === 'string'
        ) {
          yield {
            type: 'tool_call_delta',
            id: currentToolId,
            argsChunk: delta.partial_json,
          };
        }
        break;
      }

      case 'content_block_stop': {
        if (currentBlockType === 'tool_use' && currentToolId) {
          yield { type: 'tool_call_end', id: currentToolId };
        }
        currentBlockType = null;
        currentToolId = '';
        break;
      }

      case 'message_delta': {
        const delta = payload.delta as
          | { stop_reason?: string }
          | undefined;
        if (delta?.stop_reason) {
          stopReason = delta.stop_reason;
        }
        break;
      }

      case 'message_stop': {
        yield { type: 'done', stopReason };
        break;
      }

      case 'error': {
        const errorObj = payload.error as
          | { message?: string }
          | undefined;
        const message =
          errorObj?.message ??
          (typeof payload.message === 'string' ? payload.message : 'Unknown Anthropic stream error');
        yield { type: 'error', message };
        break;
      }

      default:
        // ping, other unknown events — silently ignore
        break;
    }
  }
}

// ---------------------------------------------------------------------------
// OpenAI SSE parser
// ---------------------------------------------------------------------------

/**
 * Parses an OpenAI Chat Completions SSE stream into StreamEvents.
 *
 * OpenAI SSE only uses `data:` lines (no `event:` prefix). The sentinel
 * `data: [DONE]` signals the end of the stream.
 *
 * Tool calls are correlated by the `index` field on each tool_call delta;
 * the `id` is only present on the first delta for each index.
 */
export async function* parseOpenAIStream(
  response: Response,
): AsyncGenerator<StreamEvent> {
  // Map from tool_call index to tool call id
  const toolIdByIndex = new Map<number, string>();
  let finishReason = 'stop';

  for await (const frame of sseFrames(response)) {
    const { data } = frame;

    // Check for the [DONE] sentinel
    if (data === '[DONE]') {
      yield { type: 'done', stopReason: finishReason };
      return;
    }

    const parsed = tryParseJSON(data);
    if (!parsed || typeof parsed !== 'object') {
      continue;
    }

    const payload = parsed as Record<string, unknown>;

    // Navigate into choices[0]
    const choices = payload.choices as
      | Array<{
          delta?: {
            content?: string | null;
            tool_calls?: Array<{
              index: number;
              id?: string;
              type?: string;
              function?: { name?: string; arguments?: string };
            }>;
          };
          finish_reason?: string | null;
        }>
      | undefined;

    if (!choices || choices.length === 0) continue;
    const choice = choices[0];
    const delta = choice.delta;

    // Capture finish_reason (may appear before [DONE])
    if (choice.finish_reason) {
      finishReason = choice.finish_reason;

      // When finish_reason is 'tool_calls', emit tool_call_end for all tracked tools
      if (finishReason === 'tool_calls') {
        for (const [, toolId] of toolIdByIndex) {
          yield { type: 'tool_call_end', id: toolId };
        }
      }
    }

    if (!delta) continue;

    // Text content
    if (typeof delta.content === 'string' && delta.content.length > 0) {
      yield { type: 'text', text: delta.content };
    }

    // Tool calls
    if (Array.isArray(delta.tool_calls)) {
      for (const tc of delta.tool_calls) {
        const idx = tc.index;

        // First appearance of a tool_call at this index — has id + name
        if (tc.id && tc.function?.name !== undefined) {
          toolIdByIndex.set(idx, tc.id);
          yield {
            type: 'tool_call_start',
            id: tc.id,
            name: tc.function.name,
          };
        }

        // Argument chunks
        if (tc.function?.arguments) {
          const toolId = toolIdByIndex.get(idx) ?? '';
          yield {
            type: 'tool_call_delta',
            id: toolId,
            argsChunk: tc.function.arguments,
          };
        }
      }
    }
  }

  // If we exit without seeing [DONE], still emit done
  yield { type: 'done', stopReason: finishReason };
}
