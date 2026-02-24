import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Settings, Minus, X, Send, Square, Sparkles, GripVertical } from 'lucide-react';
import { useAIStore } from '@/store/aiStore';
import type { AIToolCall, AIToolResult } from '@/store/aiStore';
import { useStyleStore } from '@/store/styleStore';
import { sendMessage } from '@/lib/ai/client';
import { TOOL_DEFINITIONS } from '@/lib/ai/tools';
import { getFullSystemPrompt } from '@/lib/ai/prompts';
import { executeTool } from '@/lib/ai/toolExecutor';
import ChatMessage from './ChatMessage';
import AISettingsDialog from './AISettingsDialog';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_TOOL_ROUNDS = 10;
const DEFAULT_WIDTH = 400;
const DEFAULT_HEIGHT = 500;
const MIN_WIDTH = 320;
const MIN_HEIGHT = 350;

// ---------------------------------------------------------------------------
// AIChatPanel
// ---------------------------------------------------------------------------

const AIChatPanel: React.FC = () => {
  const darkMode = useStyleStore((s) => s.darkMode);
  const isPanelOpen = useAIStore((s) => s.isPanelOpen);
  const isStreaming = useAIStore((s) => s.isStreaming);
  const messages = useAIStore((s) => s.messages);
  const error = useAIStore((s) => s.error);
  const apiKey = useAIStore((s) => s.apiKey);
  const isSettingsOpen = useAIStore((s) => s.isSettingsOpen);

  // Input state
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Streaming state
  const abortControllerRef = useRef<AbortController | null>(null);
  const roundRef = useRef(0);

  // Position & size
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT });
  const [initialized, setInitialized] = useState(false);

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Resizing state
  const [isResizing, setIsResizing] = useState(false);
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });

  // Initialize position to bottom-right on first open
  useEffect(() => {
    if (isPanelOpen && !initialized) {
      setPosition({
        x: window.innerWidth - DEFAULT_WIDTH - 16,
        y: window.innerHeight - DEFAULT_HEIGHT - 16,
      });
      setInitialized(true);
    }
  }, [isPanelOpen, initialized]);

  // Load API key on mount
  useEffect(() => {
    useAIStore.getState().loadApiKey();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const maxHeight = 4 * 24; // ~4 rows
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  }, [input]);

  // Cleanup: abort on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // -------------------------------------------------------------------------
  // Dragging
  // -------------------------------------------------------------------------

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    // Only left button, and not on interactive elements
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('textarea')) return;

    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    e.preventDefault();
  }, [position]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      let newX = e.clientX - dragOffset.current.x;
      let newY = e.clientY - dragOffset.current.y;

      // Clamp to viewport
      newX = Math.max(0, Math.min(newX, window.innerWidth - size.width));
      newY = Math.max(0, Math.min(newY, window.innerHeight - size.height));

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, size]);

  // -------------------------------------------------------------------------
  // Resizing
  // -------------------------------------------------------------------------

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsResizing(true);
    resizeStart.current = {
      x: e.clientX,
      y: e.clientY,
      w: size.width,
      h: size.height,
    };
    e.preventDefault();
    e.stopPropagation();
  }, [size]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - resizeStart.current.x;
      const dy = e.clientY - resizeStart.current.y;

      const newWidth = Math.max(MIN_WIDTH, resizeStart.current.w + dx);
      const newHeight = Math.max(MIN_HEIGHT, resizeStart.current.h + dy);

      // Don't exceed viewport
      const maxWidth = window.innerWidth - position.x;
      const maxHeight = window.innerHeight - position.y;

      setSize({
        width: Math.min(newWidth, maxWidth),
        height: Math.min(newHeight, maxHeight),
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, position]);

  // -------------------------------------------------------------------------
  // Core message loop
  // -------------------------------------------------------------------------

  const processStream = useCallback(async (signal: AbortSignal) => {
    const state = useAIStore.getState();
    const systemPrompt = getFullSystemPrompt();

    const stream = sendMessage({
      provider: state.provider,
      apiKey: state.apiKey,
      endpoint: state.endpoint,
      model: state.model,
      messages: state.messages.slice(0, -1), // Exclude placeholder assistant message
      systemPrompt,
      tools: TOOL_DEFINITIONS,
      signal,
    });

    const pendingToolCalls = new Map<string, { name: string; argsJson: string }>();
    for await (const event of stream) {
      switch (event.type) {
        case 'text':
          useAIStore.getState().appendToLastMessage(event.text);
          break;
        case 'tool_call_start':
          pendingToolCalls.set(event.id, { name: event.name, argsJson: '' });
          break;
        case 'tool_call_delta': {
          const tc = pendingToolCalls.get(event.id);
          if (tc) tc.argsJson += event.argsChunk;
          break;
        }
        case 'tool_call_end':
          break; // Args fully accumulated
        case 'done':
          break;
        case 'error':
          useAIStore.getState().setError(event.message);
          return;
      }
    }

    // If tool calls were made, execute them
    if (pendingToolCalls.size > 0) {
      const toolCalls: AIToolCall[] = [];
      const toolResults: AIToolResult[] = [];

      for (const [id, { name, argsJson }] of pendingToolCalls) {
        let args: Record<string, unknown>;
        try {
          args = JSON.parse(argsJson);
        } catch {
          toolResults.push({ toolCallId: id, result: 'Error: Invalid JSON in tool arguments', success: false });
          toolCalls.push({ id, name, args: {} });
          continue;
        }
        toolCalls.push({ id, name, args });
        const result = executeTool(name, args);
        toolResults.push({ toolCallId: id, result: result.result, success: result.success });
      }

      // Update assistant message with tool calls
      useAIStore.getState().updateLastMessage({ toolCalls });

      // Add tool result message
      useAIStore.getState().addMessage({
        role: 'tool',
        content: toolResults.map((r) => r.result).join('\n'),
        toolResults,
      });

      // Add new placeholder for continuation
      useAIStore.getState().addMessage({ role: 'assistant', content: '' });

      // Recursively continue (with MAX_ROUNDS limit)
      roundRef.current++;
      if (roundRef.current < MAX_TOOL_ROUNDS) {
        await processStream(signal);
      } else {
        useAIStore.getState().appendToLastMessage('(Reached maximum tool call rounds)');
      }
    }
    // If no tool calls, the response is complete (text already streamed)
  }, []);

  const handleSend = useCallback(async (userText: string) => {
    const trimmed = userText.trim();
    if (!trimmed) return;

    const store = useAIStore.getState();
    if (!store.apiKey) {
      useAIStore.getState().setSettingsOpen(true);
      return;
    }

    // 1. Add user message
    store.addMessage({ role: 'user', content: trimmed });
    store.setStreaming(true);
    store.setError(null);

    // 2. Add placeholder assistant message
    store.addMessage({ role: 'assistant', content: '' });

    // Create AbortController
    const controller = new AbortController();
    abortControllerRef.current = controller;
    roundRef.current = 0;

    try {
      await processStream(controller.signal);
    } catch (err) {
      // Abort errors are not real errors
      if (err instanceof DOMException && err.name === 'AbortError') {
        // Streaming was stopped by user
      } else {
        useAIStore.getState().setError(err instanceof Error ? err.message : 'Unknown error');
      }
    } finally {
      useAIStore.getState().setStreaming(false);
      abortControllerRef.current = null;
    }
  }, [processStream]);

  const handleStop = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming && input.trim()) {
        const text = input;
        setInput('');
        handleSend(text);
      }
    }
  }, [isStreaming, input, handleSend]);

  const handleSubmit = useCallback(() => {
    if (!isStreaming && input.trim()) {
      const text = input;
      setInput('');
      handleSend(text);
    }
  }, [isStreaming, input, handleSend]);

  // Don't render when closed
  if (!isPanelOpen) return null;

  const hasMessages = messages.length > 0;

  return (
    <>
      {/* Settings dialog */}
      <AISettingsDialog
        open={isSettingsOpen}
        onClose={() => useAIStore.getState().setSettingsOpen(false)}
      />

      {/* Chat panel */}
      <div
        className={`
          fixed z-50 flex flex-col rounded-xl shadow-2xl border overflow-hidden
          ${darkMode
            ? 'bg-[#1e293b] border-gray-700'
            : 'bg-white border-gray-200'
          }
          ${isDragging || isResizing ? 'select-none' : ''}
        `}
        style={{
          left: position.x,
          top: position.y,
          width: size.width,
          height: size.height,
        }}
      >
        {/* Header — draggable */}
        <div
          className={`
            flex items-center justify-between px-3 py-2 border-b shrink-0
            ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}
            ${darkMode ? 'border-gray-700 bg-[#1e293b]' : 'border-gray-200 bg-gray-50'}
          `}
          onMouseDown={handleDragStart}
        >
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-blue-500" />
            <span className={`text-sm font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
              AI Assistant
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => useAIStore.getState().setSettingsOpen(true)}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'}`}
              data-tooltip="Settings"
            >
              <Settings size={15} />
            </button>
            <button
              onClick={() => useAIStore.getState().setPanelOpen(false)}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'}`}
              data-tooltip="Minimize"
            >
              <Minus size={15} />
            </button>
            <button
              onClick={() => useAIStore.getState().setPanelOpen(false)}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'}`}
              data-tooltip="Close"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto min-h-0 py-2 panel-scroll">
          {!hasMessages ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center h-full px-6 text-center">
              <Sparkles size={32} className={`mb-3 ${darkMode ? 'text-blue-400' : 'text-blue-500'}`} />
              <h3 className={`text-base font-semibold mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                Chart Hero AI
              </h3>
              <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                How can I help with your diagram?
              </p>
              <div className={`text-xs text-left space-y-1.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                <p className="font-medium mb-1">Try:</p>
                <p>&bull; "Create a flowchart for user login"</p>
                <p>&bull; "Make the nodes blue"</p>
                <p>&bull; "Add swimlanes for 3 departments"</p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} darkMode={darkMode} />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Error banner */}
        {error && (
          <div className={`px-3 py-2 text-xs border-t shrink-0 ${darkMode ? 'bg-red-900/30 border-red-800/40 text-red-300' : 'bg-red-50 border-red-100 text-red-600'}`}>
            {error}
          </div>
        )}

        {/* Input area */}
        <div className={`flex items-end gap-2 px-3 py-2.5 border-t shrink-0 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={apiKey ? 'Type a message...' : 'Set API key in settings to start...'}
            disabled={!apiKey}
            rows={1}
            className={`
              flex-1 resize-none rounded-lg px-3 py-2 text-sm outline-none transition-colors
              ${darkMode
                ? 'bg-gray-800 text-gray-100 placeholder-gray-500 border border-gray-600 focus:border-blue-500'
                : 'bg-gray-50 text-gray-900 placeholder-gray-400 border border-gray-200 focus:border-blue-500'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          />
          {isStreaming ? (
            <button
              onClick={handleStop}
              className="shrink-0 p-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors cursor-pointer"
              data-tooltip="Stop"
            >
              <Square size={16} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || !apiKey}
              className={`
                shrink-0 p-2 rounded-lg transition-colors cursor-pointer
                ${input.trim() && apiKey
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : darkMode
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }
              `}
              data-tooltip="Send"
            >
              <Send size={16} />
            </button>
          )}
        </div>

        {/* Resize handle */}
        <div
          className={`
            absolute bottom-0 right-0 w-5 h-5 cursor-se-resize
            flex items-center justify-center
            ${darkMode ? 'text-gray-600' : 'text-gray-300'}
          `}
          onMouseDown={handleResizeStart}
        >
          <GripVertical size={12} className="rotate-[-45deg]" />
        </div>
      </div>
    </>
  );
};

export default AIChatPanel;
