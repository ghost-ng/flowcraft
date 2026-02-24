import React from 'react';
import { Check, X, Wrench } from 'lucide-react';
import type { AIMessage } from '@/store/aiStore';

// ---------------------------------------------------------------------------
// Minimal inline markdown
// ---------------------------------------------------------------------------

function renderInlineMarkdown(text: string): React.ReactNode[] {
  // Process **bold**, `code`, and \n → <br> in a single pass
  const parts: React.ReactNode[] = [];
  // Split on bold and code patterns
  const regex = /(\*\*(.+?)\*\*|`([^`]+)`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    // Push text before the match (with line breaks)
    if (match.index > lastIndex) {
      parts.push(...textWithBreaks(text.slice(lastIndex, match.index), key));
      key += 10;
    }

    if (match[2]) {
      // **bold**
      parts.push(<strong key={`b${key++}`}>{match[2]}</strong>);
    } else if (match[3]) {
      // `code`
      parts.push(
        <code
          key={`c${key++}`}
          className="px-1 py-0.5 rounded text-[0.85em] bg-black/10 dark:bg-white/10 font-mono"
        >
          {match[3]}
        </code>,
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Push remaining text
  if (lastIndex < text.length) {
    parts.push(...textWithBreaks(text.slice(lastIndex), key));
  }

  return parts;
}

function textWithBreaks(text: string, startKey: number): React.ReactNode[] {
  const lines = text.split('\n');
  const result: React.ReactNode[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (i > 0) {
      result.push(<br key={`br${startKey + i}`} />);
    }
    if (lines[i]) {
      result.push(lines[i]);
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// ChatMessage component
// ---------------------------------------------------------------------------

interface ChatMessageProps {
  message: AIMessage;
  darkMode: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, darkMode }) => {
  // -- Tool messages: compact action chips -----------------------------------
  if (message.role === 'tool') {
    if (!message.toolResults || message.toolResults.length === 0) return null;

    return (
      <div className="flex flex-col gap-1 px-3 py-1">
        {message.toolResults.map((tr) => (
          <div
            key={tr.toolCallId}
            className={`
              flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs
              ${darkMode
                ? 'bg-gray-800/60 text-gray-400'
                : 'bg-gray-100 text-gray-500'
              }
            `}
          >
            <Wrench size={12} className="shrink-0 opacity-60" />
            <span className="font-medium truncate">{tr.toolCallId.slice(0, 20)}</span>
            {tr.success ? (
              <Check size={13} className="shrink-0 text-emerald-500" />
            ) : (
              <X size={13} className="shrink-0 text-red-500" />
            )}
          </div>
        ))}
      </div>
    );
  }

  // -- User messages: right-aligned blue bubble ------------------------------
  if (message.role === 'user') {
    return (
      <div className="flex justify-end px-3 py-1">
        <div className="max-w-[85%] px-3.5 py-2 rounded-2xl rounded-br-sm bg-blue-500 text-white text-sm leading-relaxed">
          {renderInlineMarkdown(message.content)}
        </div>
      </div>
    );
  }

  // -- Assistant messages: left-aligned gray bubble --------------------------
  const isStreaming = message.content === '' && !message.toolCalls?.length;

  return (
    <div className="flex justify-start px-3 py-1">
      <div
        className={`
          max-w-[85%] px-3.5 py-2 rounded-2xl rounded-bl-sm text-sm leading-relaxed
          ${darkMode
            ? 'bg-gray-800 text-gray-100'
            : 'bg-gray-100 text-gray-900'
          }
        `}
      >
        {message.content ? (
          renderInlineMarkdown(message.content)
        ) : isStreaming ? (
          <span className="inline-block w-2 h-4 bg-current opacity-40 animate-pulse rounded-sm" />
        ) : null}

        {/* Show tool call names as small chips under the message text */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {message.toolCalls.map((tc) => (
              <span
                key={tc.id}
                className={`
                  inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium
                  ${darkMode
                    ? 'bg-blue-500/20 text-blue-300'
                    : 'bg-blue-50 text-blue-600'
                  }
                `}
              >
                <Wrench size={10} />
                {tc.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
