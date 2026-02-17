import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Pencil,
  Trash2,
  Palette,
  Spline,
} from 'lucide-react';

import { useStyleStore } from '../../store/styleStore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EdgeContextMenuProps {
  x: number;
  y: number;
  edgeId: string;
  onClose: () => void;
  onChangeType: (type: string) => void;
  onChangeColor: (color: string) => void;
  onEditLabel: () => void;
  onDelete: () => void;
}

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

const edgeTypeOptions = [
  { value: 'smoothstep', label: 'Smooth Step' },
  { value: 'bezier', label: 'Bezier' },
  { value: 'step', label: 'Step' },
  { value: 'straight', label: 'Straight' },
];

const quickColors = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#6b7280', // gray
  '#f97316', // orange
  '#14b8a6', // teal
];

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  darkMode: boolean;
  hasSubmenu?: boolean;
  onMouseEnter?: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon, label, onClick, darkMode, hasSubmenu, onMouseEnter,
}) => (
  <button
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    onMouseEnter={onMouseEnter}
    className={`
      flex items-center gap-2.5 w-full px-3 py-1.5 text-left text-sm rounded
      transition-colors duration-75 cursor-pointer
      ${darkMode
        ? 'hover:bg-slate-700 text-slate-200'
        : 'hover:bg-slate-100 text-slate-700'
      }
    `}
  >
    <span className="shrink-0 w-4 h-4 flex items-center justify-center text-slate-400">
      {icon}
    </span>
    <span className="flex-1">{label}</span>
    {hasSubmenu && (
      <span className="text-slate-400 text-xs ml-2">&rsaquo;</span>
    )}
  </button>
);

const MenuDivider: React.FC<{ darkMode: boolean }> = ({ darkMode }) => (
  <div className={`my-1 h-px ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`} />
);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const EdgeContextMenu: React.FC<EdgeContextMenuProps> = ({
  x, y, onClose, onChangeType, onChangeColor, onEditLabel, onDelete,
}) => {
  const darkMode = useStyleStore((s) => s.darkMode);
  const menuRef = useRef<HTMLDivElement>(null);
  const [submenu, setSubmenu] = useState<'type' | 'color' | null>(null);

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

  const adjustedStyle = useCallback((): React.CSSProperties => {
    const menuW = 200;
    const menuH = 200;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    return {
      position: 'fixed',
      top: y + menuH > vh ? vh - menuH - 8 : y,
      left: x + menuW > vw ? vw - menuW - 8 : x,
      zIndex: 9999,
    };
  }, [x, y]);

  return (
    <div ref={menuRef} style={adjustedStyle()} className="relative">
      {/* Main menu */}
      <div
        className={`
          min-w-[180px] rounded-lg shadow-xl border p-1
          ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}
        `}
      >
        <MenuItem
          icon={<Spline size={14} />}
          label="Connector Type"
          onClick={() => setSubmenu(submenu === 'type' ? null : 'type')}
          darkMode={darkMode}
          hasSubmenu
          onMouseEnter={() => setSubmenu('type')}
        />
        <MenuItem
          icon={<Palette size={14} />}
          label="Connector Color"
          onClick={() => setSubmenu(submenu === 'color' ? null : 'color')}
          darkMode={darkMode}
          hasSubmenu
          onMouseEnter={() => setSubmenu('color')}
        />

        <MenuDivider darkMode={darkMode} />

        <MenuItem
          icon={<Pencil size={14} />}
          label="Edit Label"
          onClick={() => { onEditLabel(); onClose(); }}
          darkMode={darkMode}
        />

        <MenuDivider darkMode={darkMode} />

        <MenuItem
          icon={<Trash2 size={14} />}
          label="Delete"
          onClick={() => { onDelete(); onClose(); }}
          darkMode={darkMode}
        />
      </div>

      {/* Type submenu */}
      {submenu === 'type' && (
        <div
          className={`
            absolute top-0 left-full ml-1 min-w-[150px] rounded-lg shadow-xl border p-1
            ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}
          `}
        >
          {edgeTypeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={(e) => {
                e.stopPropagation();
                onChangeType(opt.value);
                onClose();
              }}
              className={`
                flex items-center gap-2 w-full px-3 py-1.5 text-left text-sm rounded
                transition-colors duration-75 cursor-pointer
                ${darkMode
                  ? 'hover:bg-slate-700 text-slate-200'
                  : 'hover:bg-slate-100 text-slate-700'
                }
              `}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Color submenu */}
      {submenu === 'color' && (
        <div
          className={`
            absolute top-0 left-full ml-1 rounded-lg shadow-xl border p-3
            ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}
          `}
        >
          <div className="grid grid-cols-5 gap-1.5">
            {quickColors.map((color) => (
              <button
                key={color}
                onClick={(e) => {
                  e.stopPropagation();
                  onChangeColor(color);
                  onClose();
                }}
                className="w-7 h-7 rounded-md border-2 border-transparent hover:border-white hover:scale-110 transition-all cursor-pointer"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(EdgeContextMenu);
