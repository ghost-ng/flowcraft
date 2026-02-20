import React, { useEffect, useRef } from 'react';
import { useMenuPosition } from './menuUtils';
import {
  Plus,
  ClipboardPaste,
  SquareMousePointer,
  Maximize,
  Rows3,
} from 'lucide-react';

import { useStyleStore } from '../../store/styleStore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CanvasContextMenuProps {
  /** Pixel position of the menu (screen coords) */
  x: number;
  y: number;
  /** Close callback */
  onClose: () => void;
  /** Add a new node at the right-click position */
  onAddNode: () => void;
  /** Paste from clipboard (only shown if clipboard has content) */
  onPaste?: () => void;
  /** Select all nodes */
  onSelectAll: () => void;
  /** Fit the viewport to all nodes */
  onFitView: () => void;
  /** Open the swimlane creation dialog */
  onInsertSwimlanes: () => void;
  /** Whether paste should be enabled */
  canPaste?: boolean;
}

// ---------------------------------------------------------------------------
// Menu item
// ---------------------------------------------------------------------------

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  darkMode: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, onClick, disabled, darkMode }) => (
  <button
    onClick={(e) => {
      e.stopPropagation();
      if (!disabled) onClick();
    }}
    disabled={disabled}
    className={`
      flex items-center gap-2.5 w-full px-3 py-1.5 text-left text-sm rounded
      transition-colors duration-75 cursor-pointer
      disabled:opacity-40 disabled:cursor-not-allowed
      ${darkMode
        ? 'hover:bg-dk-hover text-dk-text'
        : 'hover:bg-slate-100 text-slate-700'
      }
    `}
  >
    <span className="shrink-0 w-4 h-4 flex items-center justify-center text-slate-400">
      {icon}
    </span>
    {label}
  </button>
);

const MenuDivider: React.FC<{ darkMode: boolean }> = ({ darkMode }) => (
  <div className={`my-1 h-px ${darkMode ? 'bg-dk-hover' : 'bg-slate-200'}`} />
);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const CanvasContextMenu: React.FC<CanvasContextMenuProps> = ({
  x,
  y,
  onClose,
  onAddNode,
  onPaste,
  onSelectAll,
  onFitView,
  onInsertSwimlanes,
  canPaste = false,
}) => {
  const darkMode = useStyleStore((s) => s.darkMode);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click-outside or Escape
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  const menuStyle = useMenuPosition(x, y, menuRef);

  return (
    <div
      ref={menuRef}
      style={menuStyle}
      className={`
        min-w-[180px] rounded-lg shadow-xl border p-1
        ${darkMode
          ? 'bg-dk-panel border-dk-border'
          : 'bg-white border-slate-200'
        }
      `}
    >
      <MenuItem
        icon={<Plus size={14} />}
        label="Add Node Here"
        onClick={() => { onAddNode(); onClose(); }}
        darkMode={darkMode}
      />
      <MenuItem
        icon={<ClipboardPaste size={14} />}
        label="Paste"
        onClick={() => { onPaste?.(); onClose(); }}
        disabled={!canPaste}
        darkMode={darkMode}
      />
      <MenuItem
        icon={<SquareMousePointer size={14} />}
        label="Select All"
        onClick={() => { onSelectAll(); onClose(); }}
        darkMode={darkMode}
      />
      <MenuItem
        icon={<Maximize size={14} />}
        label="Fit View"
        onClick={() => { onFitView(); onClose(); }}
        darkMode={darkMode}
      />

      <MenuDivider darkMode={darkMode} />

      <MenuItem
        icon={<Rows3 size={14} />}
        label="Insert Swimlanes"
        onClick={() => { onInsertSwimlanes(); onClose(); }}
        darkMode={darkMode}
      />
    </div>
  );
};

export default React.memo(CanvasContextMenu);
