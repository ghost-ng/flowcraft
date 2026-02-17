// ---------------------------------------------------------------------------
// ImportJsonDialog.tsx -- Modal for pasting and importing JSON diagrams
// ---------------------------------------------------------------------------

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ClipboardPaste, X } from 'lucide-react';
import { useStyleStore } from '../../store/styleStore';
import { importFromJson } from '../../utils/exportUtils';
import { useUIStore } from '../../store/uiStore';
import { log } from '../../utils/logger';

interface ImportJsonDialogProps {
  open: boolean;
  onClose: () => void;
}

const ImportJsonDialog: React.FC<ImportJsonDialogProps> = ({ open, onClose }) => {
  const darkMode = useStyleStore((s) => s.darkMode);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea on open
  useEffect(() => {
    if (open) {
      setText('');
      setError('');
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [open]);

  // Escape key closes
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  const handleImport = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) {
      setError('Please paste JSON content first.');
      return;
    }
    try {
      const result = importFromJson(trimmed);
      const msg = `Imported ${result.nodeCount} nodes and ${result.edgeCount} edges`;
      if (result.warnings.length > 0) {
        log.warn('Import warnings', result.warnings);
        useUIStore.getState().showToast(`${msg} (${result.warnings.length} warnings)`, 'warning');
      } else {
        useUIStore.getState().showToast(msg, 'success');
      }
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid JSON';
      setError(msg);
      log.error('Import JSON failed', err);
    }
  }, [text, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div
        className={`
          relative w-[560px] max-h-[80vh] rounded-xl shadow-2xl border overflow-hidden flex flex-col
          ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}
        `}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-3 border-b ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
          <div className="flex items-center gap-2">
            <ClipboardPaste size={18} className="text-primary" />
            <h2 className={`text-base font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              Import JSON
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-md transition-colors cursor-pointer ${darkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-4 flex-1 flex flex-col gap-3">
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Paste a FlowCraft JSON diagram below, then click Import.
          </p>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => { setText(e.target.value); setError(''); }}
            placeholder='{"nodes": [...], "edges": [...]}'
            spellCheck={false}
            className={`
              w-full h-56 rounded-lg border px-3 py-2 text-sm font-mono resize-none
              focus:outline-none focus:ring-2 focus:ring-primary/40
              ${darkMode
                ? 'bg-slate-900 border-slate-600 text-slate-200 placeholder:text-slate-600'
                : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400'
              }
            `}
          />
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className={`flex justify-end gap-2 px-5 py-3 border-t ${darkMode ? 'border-slate-700 bg-slate-900/50' : 'border-slate-200 bg-slate-50'}`}>
          <button
            onClick={onClose}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer
              ${darkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-200'}
            `}
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!text.trim()}
            className="px-4 py-1.5 rounded-md text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Import
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportJsonDialog;
