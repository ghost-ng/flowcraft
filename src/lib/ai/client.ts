// ---------------------------------------------------------------------------
// Unified AI Client — builds requests and delegates to the correct SSE parser
// ---------------------------------------------------------------------------

import type { AIMessage } from '@/store/aiStore';
import type { AIProvider } from '@/lib/ai/providers';
import { getProviderConfig, detectProviderFromUrl } from '@/lib/ai/providers';
import type { APIFormat } from '@/lib/ai/providers';
import { type StreamEvent, parseAnthropicStream, parseOpenAIStream } from '@/lib/ai/stream';

// Re-export StreamEvent so consumers can import from client.ts
export type { StreamEvent };

// ---------------------------------------------------------------------------
// Tool definition (neutral format — translated per provider)
// ---------------------------------------------------------------------------

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

// ---------------------------------------------------------------------------
// Options for sendMessage
// ---------------------------------------------------------------------------

export interface SendMessageOptions {
  provider: AIProvider;
  apiKey: string;
  endpoint: string;
  model: string;
  messages: AIMessage[];
  systemPrompt: string;
  tools: ToolDefinition[];
  signal?: AbortSignal;
}

// ---------------------------------------------------------------------------
// Message format translation — Anthropic
// ---------------------------------------------------------------------------

interface AnthropicTextContent {
  type: 'text';
  text: string;
}

interface AnthropicToolUseContent {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

interface AnthropicImageContent {
  type: 'image';
  source: { type: 'base64'; media_type: string; data: string };
}

interface AnthropicToolResultContent {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
}

type AnthropicContent =
  | AnthropicTextContent
  | AnthropicImageContent
  | AnthropicToolUseContent
  | AnthropicToolResultContent;

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string | AnthropicContent[];
}

function formatMessagesForAnthropic(messages: AIMessage[]): AnthropicMessage[] {
  const result: AnthropicMessage[] = [];

  for (const msg of messages) {
    if (msg.role === 'user') {
      if (msg.images?.length) {
        // Build multipart content with images + text
        const blocks: AnthropicContent[] = [];
        for (const img of msg.images) {
          blocks.push({
            type: 'image',
            source: { type: 'base64', media_type: img.mimeType, data: img.base64 },
          });
        }
        if (msg.content) {
          blocks.push({ type: 'text', text: msg.content });
        }
        result.push({ role: 'user', content: blocks });
      } else {
        result.push({ role: 'user', content: msg.content });
      }
    } else if (msg.role === 'assistant') {
      if (msg.toolCalls && msg.toolCalls.length > 0) {
        const contentBlocks: AnthropicContent[] = [];
        // Add text block only if non-empty
        if (msg.content) {
          contentBlocks.push({ type: 'text', text: msg.content });
        }
        for (const tc of msg.toolCalls) {
          contentBlocks.push({
            type: 'tool_use',
            id: tc.id,
            name: tc.name,
            input: tc.args,
          });
        }
        result.push({ role: 'assistant', content: contentBlocks });
      } else {
        result.push({ role: 'assistant', content: msg.content });
      }
    } else if (msg.role === 'tool') {
      // Tool results are sent as a user message with tool_result content blocks
      if (msg.toolResults && msg.toolResults.length > 0) {
        const contentBlocks: AnthropicToolResultContent[] = msg.toolResults.map(
          (tr) => ({
            type: 'tool_result' as const,
            tool_use_id: tr.toolCallId,
            content: tr.result,
          }),
        );
        result.push({ role: 'user', content: contentBlocks });
      }
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Message format translation — OpenAI
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface OpenAIMessageBase {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null | Array<Record<string, any>>;
}

interface OpenAIAssistantMessage extends OpenAIMessageBase {
  role: 'assistant';
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: { name: string; arguments: string };
  }>;
}

interface OpenAIToolMessage extends OpenAIMessageBase {
  role: 'tool';
  tool_call_id: string;
}

type OpenAIMessage = OpenAIMessageBase | OpenAIAssistantMessage | OpenAIToolMessage;

function formatMessagesForOpenAI(messages: AIMessage[]): OpenAIMessage[] {
  const result: OpenAIMessage[] = [];

  for (const msg of messages) {
    if (msg.role === 'user') {
      if (msg.images?.length) {
        // Build multipart content with image_url entries + text
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const parts: Array<Record<string, any>> = [];
        for (const img of msg.images) {
          parts.push({
            type: 'image_url',
            image_url: { url: `data:${img.mimeType};base64,${img.base64}` },
          });
        }
        if (msg.content) {
          parts.push({ type: 'text', text: msg.content });
        }
        result.push({ role: 'user', content: parts });
      } else {
        result.push({ role: 'user', content: msg.content });
      }
    } else if (msg.role === 'assistant') {
      if (msg.toolCalls && msg.toolCalls.length > 0) {
        const assistantMsg: OpenAIAssistantMessage = {
          role: 'assistant',
          content: msg.content || null,
          tool_calls: msg.toolCalls.map((tc) => ({
            id: tc.id,
            type: 'function' as const,
            function: {
              name: tc.name,
              arguments: JSON.stringify(tc.args),
            },
          })),
        };
        result.push(assistantMsg);
      } else {
        result.push({ role: 'assistant', content: msg.content });
      }
    } else if (msg.role === 'tool') {
      // OpenAI expects one message per tool result
      if (msg.toolResults) {
        for (const tr of msg.toolResults) {
          const toolMsg: OpenAIToolMessage = {
            role: 'tool',
            tool_call_id: tr.toolCallId,
            content: tr.result,
          };
          result.push(toolMsg);
        }
      }
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Tool format translation
// ---------------------------------------------------------------------------

function formatToolsForAnthropic(
  tools: ToolDefinition[],
): Array<{ name: string; description: string; input_schema: ToolDefinition['inputSchema'] }> {
  return tools.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.inputSchema,
  }));
}

function formatToolsForOpenAI(
  tools: ToolDefinition[],
): Array<{
  type: 'function';
  function: { name: string; description: string; parameters: ToolDefinition['inputSchema'] };
}> {
  return tools.map((t) => ({
    type: 'function' as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.inputSchema,
    },
  }));
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Send a message to an AI provider and yield streaming events.
 *
 * Automatically detects the wire format (Anthropic vs OpenAI) from the
 * provider config, builds the appropriate request body, and delegates to
 * the matching SSE parser.
 */
export async function* sendMessage(
  options: SendMessageOptions,
): AsyncGenerator<StreamEvent> {
  const { provider, apiKey, endpoint, model, messages, systemPrompt, tools, signal } =
    options;

  // Determine API format
  const config = getProviderConfig(provider);
  const format: APIFormat =
    provider === 'custom' ? detectProviderFromUrl(endpoint) : config.format;

  // Build headers
  const headers: Record<string, string> = {
    ...config.authHeader(apiKey),
    ...(config.extraHeaders ?? {}),
  };

  // Build request body
  let body: Record<string, unknown>;

  if (format === 'anthropic') {
    body = {
      model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: formatMessagesForAnthropic(messages),
      stream: true,
    };
    // Only include tools if there are any
    if (tools.length > 0) {
      body.tools = formatToolsForAnthropic(tools);
    }
  } else {
    // OpenAI format
    const openaiMessages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt },
      ...formatMessagesForOpenAI(messages),
    ];
    body = {
      model,
      messages: openaiMessages,
      stream: true,
    };
    // Only include tools if there are any
    if (tools.length > 0) {
      body.tools = formatToolsForOpenAI(tools);
    }
  }

  // Make the request
  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal,
    });
  } catch (err: unknown) {
    // Network error or abort
    if (err instanceof DOMException && err.name === 'AbortError') {
      yield { type: 'done', stopReason: 'abort' };
      return;
    }
    const message =
      err instanceof Error ? err.message : 'Network request failed';
    yield { type: 'error', message };
    return;
  }

  // Handle HTTP errors
  if (!response.ok) {
    let errorMessage: string;
    try {
      const errorBody = await response.text();
      errorMessage = `HTTP ${response.status}: ${errorBody}`;
    } catch {
      errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    }
    yield { type: 'error', message: errorMessage };
    return;
  }

  // Delegate to the correct parser
  const parser =
    format === 'anthropic' ? parseAnthropicStream : parseOpenAIStream;

  try {
    yield* parser(response);
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      yield { type: 'done', stopReason: 'abort' };
      return;
    }
    const message =
      err instanceof Error ? err.message : 'Stream parsing error';
    yield { type: 'error', message };
  }
}
