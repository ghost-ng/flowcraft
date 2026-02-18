// ---------------------------------------------------------------------------
// Keyboard Shortcuts Hook
// ---------------------------------------------------------------------------

import { useEffect, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Inline types
// ---------------------------------------------------------------------------

export interface KeyboardShortcutCallbacks {
  /** Delete selected nodes/edges */
  onDelete?: () => void;
  /** Ctrl+Z - undo */
  onUndo?: () => void;
  /** Ctrl+Shift+Z - redo */
  onRedo?: () => void;
  /** Ctrl+D - duplicate selected */
  onDuplicate?: () => void;
  /** Ctrl+A - select all */
  onSelectAll?: () => void;
  /** Ctrl+G - group selected */
  onGroup?: () => void;
  /** N - add node at canvas center */
  onAddNode?: () => void;
  /** Ctrl+S - save */
  onSave?: () => void;
  /** Ctrl+E - open export dialog */
  onExport?: () => void;
  /** Ctrl+L - auto layout */
  onAutoLayout?: () => void;
  /** F2 - edit label of selected node */
  onEditLabel?: () => void;
  /** Arrow keys - nudge selected nodes (dx, dy in px) */
  onNudge?: (dx: number, dy: number) => void;
  /** Ctrl+C - copy selected nodes/pucks */
  onCopy?: () => void;
  /** Ctrl+V - paste copied nodes/pucks */
  onPaste?: () => void;
  /** Ctrl+Shift+C - copy style */
  onCopyStyle?: () => void;
  /** Ctrl+Shift+V - paste style */
  onPasteStyle?: () => void;
  /** Ctrl+Shift+D - toggle dark mode */
  onToggleDarkMode?: () => void;
  /** Ctrl+Shift+G - link group selected */
  onLinkGroup?: () => void;
  /** Ctrl+Shift+H - mirror horizontal */
  onMirrorHorizontal?: () => void;
  /** Ctrl+Shift+F - mirror vertical (flip) */
  onMirrorVertical?: () => void;
  /** Ctrl+] - bring forward one step */
  onBringForward?: () => void;
  /** Ctrl+[ - send backward one step */
  onSendBackward?: () => void;
  /** Ctrl+Shift+] - bring to front */
  onBringToFront?: () => void;
  /** Ctrl+Shift+[ - send to back */
  onSendToBack?: () => void;
  /** 1-9 - apply palette colour by index */
  onApplyPaletteColor?: (index: number) => void;
  /** Ctrl+/ - show keyboard shortcuts dialog */
  onShowShortcuts?: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Register global keyboard shortcuts for the diagramming canvas.
 *
 * The hook attaches a single `keydown` listener to `window` and dispatches
 * to the appropriate callback.  All browser defaults for the registered
 * combos are suppressed via `preventDefault()`.
 *
 * @param callbacks - Object mapping shortcut actions to handler functions
 * @param enabled   - Pass `false` to temporarily disable all shortcuts
 *                    (e.g. while an input field is focused)
 */
export function useKeyboardShortcuts(
  callbacks: KeyboardShortcutCallbacks,
  enabled: boolean = true,
): void {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // Ignore events originating from text inputs / editable elements
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        // Allow F2 and Escape even when inside an input
        if (e.key !== 'F2' && e.key !== 'Escape') return;
      }

      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;

      // ----- Ctrl+Shift combos -----
      if (ctrl && shift) {
        switch (e.key) {
          case 'Z':
          case 'z':
            e.preventDefault();
            callbacks.onRedo?.();
            return;
          case 'C':
          case 'c':
            e.preventDefault();
            callbacks.onCopyStyle?.();
            return;
          case 'V':
          case 'v':
            e.preventDefault();
            callbacks.onPasteStyle?.();
            return;
          case 'D':
          case 'd':
            e.preventDefault();
            callbacks.onToggleDarkMode?.();
            return;
          case 'G':
          case 'g':
            e.preventDefault();
            callbacks.onLinkGroup?.();
            return;
          case 'H':
          case 'h':
            e.preventDefault();
            callbacks.onMirrorHorizontal?.();
            return;
          case 'F':
          case 'f':
            e.preventDefault();
            callbacks.onMirrorVertical?.();
            return;
          case ']':
          case '}':
            e.preventDefault();
            callbacks.onBringToFront?.();
            return;
          case '[':
          case '{':
            e.preventDefault();
            callbacks.onSendToBack?.();
            return;
        }
        // Also check e.code for bracket keys (some layouts produce { and } for Shift+[ and Shift+])
        if (e.code === 'BracketRight') {
          e.preventDefault();
          callbacks.onBringToFront?.();
          return;
        }
        if (e.code === 'BracketLeft') {
          e.preventDefault();
          callbacks.onSendToBack?.();
          return;
        }
      }

      // ----- Ctrl combos (without shift) -----
      if (ctrl && !shift) {
        switch (e.key) {
          case 'c':
          case 'C':
            e.preventDefault();
            callbacks.onCopy?.();
            return;
          case 'v':
          case 'V':
            e.preventDefault();
            callbacks.onPaste?.();
            return;
          case 'z':
          case 'Z':
            e.preventDefault();
            callbacks.onUndo?.();
            return;
          case 'd':
          case 'D':
            e.preventDefault();
            callbacks.onDuplicate?.();
            return;
          case 'a':
          case 'A':
            e.preventDefault();
            callbacks.onSelectAll?.();
            return;
          case 'g':
          case 'G':
            e.preventDefault();
            callbacks.onGroup?.();
            return;
          case 's':
          case 'S':
            e.preventDefault();
            callbacks.onSave?.();
            return;
          case 'e':
          case 'E':
            e.preventDefault();
            callbacks.onExport?.();
            return;
          case 'l':
          case 'L':
            e.preventDefault();
            callbacks.onAutoLayout?.();
            return;
          case ']':
            e.preventDefault();
            callbacks.onBringForward?.();
            return;
          case '[':
            e.preventDefault();
            callbacks.onSendBackward?.();
            return;
          case '/':
          case '?':
            e.preventDefault();
            callbacks.onShowShortcuts?.();
            return;
        }
      }

      // ----- Non-modifier keys -----
      if (!ctrl) {
        switch (e.key) {
          case 'Delete':
          case 'Backspace':
            e.preventDefault();
            callbacks.onDelete?.();
            return;

          case 'F2':
            e.preventDefault();
            callbacks.onEditLabel?.();
            return;

          case 'n':
          case 'N':
            if (!shift) {
              e.preventDefault();
              callbacks.onAddNode?.();
            }
            return;

          case 'ArrowUp':
            e.preventDefault();
            callbacks.onNudge?.(0, shift ? -10 : -1);
            return;
          case 'ArrowDown':
            e.preventDefault();
            callbacks.onNudge?.(0, shift ? 10 : 1);
            return;
          case 'ArrowLeft':
            e.preventDefault();
            callbacks.onNudge?.(shift ? -10 : -1, 0);
            return;
          case 'ArrowRight':
            e.preventDefault();
            callbacks.onNudge?.(shift ? 10 : 1, 0);
            return;
        }

        // 1-9 palette colour shortcuts
        if (e.key >= '1' && e.key <= '9') {
          e.preventDefault();
          callbacks.onApplyPaletteColor?.(parseInt(e.key, 10) - 1);
          return;
        }
      }
    },
    [callbacks, enabled],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
