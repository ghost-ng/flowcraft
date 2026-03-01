import React from 'react';
import { X, Keyboard } from 'lucide-react';
import { useStyleStore } from '../../store/styleStore';

interface ShortcutEntry {
  keys: string;
  description: string;
}

interface ShortcutSection {
  title: string;
  shortcuts: ShortcutEntry[];
}

const SHORTCUT_SECTIONS: ShortcutSection[] = [
  {
    title: 'General',
    shortcuts: [
      { keys: 'Ctrl+Z', description: 'Undo' },
      { keys: 'Ctrl+Shift+Z', description: 'Redo' },
      { keys: 'Ctrl+S', description: 'Save to file' },
      { keys: 'Ctrl+Shift+E', description: 'Export dialog' },
      { keys: 'Ctrl+A', description: 'Select all' },
      { keys: 'Delete', description: 'Delete selected' },
      { keys: 'Backspace', description: 'Delete selected' },
      { keys: 'Escape', description: 'Cancel / deselect' },
      { keys: 'Drag', description: 'Rectangle select' },
      { keys: 'Shift+Drag', description: 'Add to selection' },
      { keys: 'Ctrl+Drag', description: 'Pan canvas' },
      { keys: 'Ctrl+Shift+K', description: 'Toggle dark mode' },
      { keys: 'Ctrl+Shift+A', description: 'Toggle AI Assistant' },
    ],
  },
  {
    title: 'Nodes',
    shortcuts: [
      { keys: 'N', description: 'Add new node' },
      { keys: 'F2', description: 'Edit selected node label' },
      { keys: 'Ctrl+D', description: 'Duplicate selected' },
      { keys: '1-9', description: 'Apply palette color' },
      { keys: '↑↓←→', description: 'Nudge selected (1px)' },
      { keys: 'Shift+↑↓←→', description: 'Nudge selected (10px)' },
      { keys: 'Shift+Drag', description: 'Snap to alignment guide' },
      { keys: 'Ctrl+Scroll', description: 'Border thickness' },
    ],
  },
  {
    title: 'Order & Layout',
    shortcuts: [
      { keys: 'Ctrl+]', description: 'Bring forward' },
      { keys: 'Ctrl+[', description: 'Send backward' },
      { keys: 'Ctrl+Shift+]', description: 'Bring to front' },
      { keys: 'Ctrl+Shift+[', description: 'Send to back' },
      { keys: 'Ctrl+Shift+L', description: 'Auto layout' },
      { keys: 'Ctrl+G', description: 'Group in region' },
      { keys: 'Ctrl+Shift+G', description: 'Link group' },
      { keys: 'Ctrl+Shift+H', description: 'Flip horizontal' },
      { keys: 'Ctrl+Alt+V', description: 'Flip vertical' },
      { keys: 'Ctrl+Alt+S', description: 'Straighten all edges' },
    ],
  },
  {
    title: 'Style',
    shortcuts: [
      { keys: 'Ctrl+Alt+C', description: 'Copy style' },
      { keys: 'Ctrl+Shift+V', description: 'Paste style' },
      { keys: 'Ctrl+C', description: 'Copy selected' },
      { keys: 'Ctrl+V', description: 'Paste' },
      { keys: 'Ctrl+/', description: 'Show shortcuts' },
    ],
  },
];

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onClose: () => void;
}

const ShortcutKey: React.FC<{ text: string }> = ({ text }) => {
  const parts = text.split('+');
  return (
    <span className="flex items-center gap-0.5">
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="text-slate-400 text-[10px]">+</span>}
          <kbd className="inline-flex items-center justify-center min-w-[24px] h-[22px] px-1.5 text-[11px] font-mono font-medium rounded border border-slate-300 bg-slate-100 text-slate-600 dark:border-dk-border dark:bg-dk-hover dark:text-dk-muted shadow-sm">
            {part}
          </kbd>
        </React.Fragment>
      ))}
    </span>
  );
};

const KeyboardShortcutsDialog: React.FC<KeyboardShortcutsDialogProps> = ({ open, onClose }) => {
  const darkMode = useStyleStore((s) => s.darkMode);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Dialog */}
      <div
        className={`
          relative w-[720px] max-h-[80vh] rounded-xl shadow-2xl border overflow-hidden
          ${darkMode ? 'bg-dk-panel border-dk-border' : 'bg-white border-slate-200'}
        `}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-3 border-b ${darkMode ? 'border-dk-border' : 'border-slate-200'}`}>
          <div className="flex items-center gap-2">
            <Keyboard size={18} className="text-primary" />
            <h2 className={`text-base font-semibold ${darkMode ? 'text-dk-text' : 'text-slate-800'}`}>
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-md transition-colors cursor-pointer ${darkMode ? 'hover:bg-dk-hover text-dk-muted' : 'hover:bg-slate-100 text-slate-500'}`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(80vh-60px)] p-5 panel-scroll">
          <div className="grid grid-cols-2 gap-6">
            {SHORTCUT_SECTIONS.map((section) => (
              <div key={section.title}>
                <h3 className={`text-[11px] font-semibold uppercase tracking-wider mb-2 ${darkMode ? 'text-dk-muted' : 'text-slate-500'}`}>
                  {section.title}
                </h3>
                <div className="flex flex-col gap-1">
                  {section.shortcuts.map((shortcut) => (
                    <div
                      key={shortcut.keys}
                      className={`flex items-center justify-between py-1.5 px-2 rounded ${darkMode ? 'hover:bg-dk-hover/50' : 'hover:bg-slate-50'}`}
                    >
                      <span className={`text-sm ${darkMode ? 'text-dk-muted' : 'text-slate-600'}`}>
                        {shortcut.description}
                      </span>
                      <ShortcutKey text={shortcut.keys} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsDialog;
