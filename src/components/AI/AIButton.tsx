import React from 'react';
import { Sparkles } from 'lucide-react';
import { useAIStore } from '@/store/aiStore';
import { useStyleStore } from '@/store/styleStore';

// ---------------------------------------------------------------------------
// AIButton — Toolbar sparkle button that toggles the AI chat panel
// ---------------------------------------------------------------------------

const AIButton: React.FC = () => {
  const isPanelOpen = useAIStore((s) => s.isPanelOpen);
  const isStreaming = useAIStore((s) => s.isStreaming);
  // Subscribe to darkMode so the button re-renders when the theme changes
  useStyleStore((s) => s.darkMode);

  return (
    <button
      data-tooltip="AI Assistant (Ctrl+Shift+A)"
      onClick={() => useAIStore.getState().togglePanel()}
      className={`
        relative flex items-center gap-1 px-1.5 py-1 rounded text-xs
        transition-colors duration-100 cursor-pointer
        ${isPanelOpen
          ? 'bg-primary/10 text-primary'
          : 'text-text-muted hover:bg-slate-100 hover:text-text'
        }
      `}
    >
      <Sparkles size={16} className={isStreaming ? 'animate-pulse' : ''} />
      <span className="hidden xl:inline text-[11px]">AI</span>
    </button>
  );
};

export default AIButton;
