import React, { useEffect, useRef, useState } from 'react';
import {
  Pencil,
  Trash2,
  Palette,
  Spline,
  MoveHorizontal,
  Type,
} from 'lucide-react';

import { useStyleStore } from '../../store/styleStore';
import { useFlowStore } from '../../store/flowStore';
import { useMenuPosition, SubMenu } from './menuUtils';

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
  onStraighten: () => void;
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
        ? 'hover:bg-dk-hover text-dk-text'
        : 'hover:bg-slate-100 text-slate-700'
      }
    `}
  >
    <span className="shrink-0 w-4 h-4 flex items-center justify-center text-slate-400 dark:text-dk-faint">
      {icon}
    </span>
    <span className="flex-1">{label}</span>
    {hasSubmenu && (
      <span className="text-slate-400 dark:text-dk-faint text-xs ml-2">&rsaquo;</span>
    )}
  </button>
);

const MenuDivider: React.FC<{ darkMode: boolean }> = ({ darkMode }) => (
  <div className={`my-1 h-px ${darkMode ? 'bg-dk-hover' : 'bg-slate-200'}`} />
);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const EdgeContextMenu: React.FC<EdgeContextMenuProps> = ({
  x, y, edgeId, onClose, onChangeType, onChangeColor, onEditLabel, onStraighten, onDelete,
}) => {
  const darkMode = useStyleStore((s) => s.darkMode);
  const menuRef = useRef<HTMLDivElement>(null);
  const [submenu, setSubmenu] = useState<'type' | 'color' | 'fontSize' | null>(null);
  const menuStyle = useMenuPosition(x, y, menuRef);
  const updateEdgeData = useFlowStore((s) => s.updateEdgeData);

  // Get current label font size
  const edge = useFlowStore.getState().edges.find(e => e.id === edgeId);
  const currentFontSize = (edge?.data as Record<string, unknown>)?.labelFontSize as number || 11;

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

  return (
    <div ref={menuRef} style={menuStyle} className="relative">
      {/* Main menu */}
      <div
        className={`
          min-w-[180px] rounded-lg shadow-xl border p-1
          ${darkMode ? 'bg-dk-panel border-dk-border' : 'bg-white border-slate-200'}
        `}
      >
        <div className="relative" onMouseLeave={() => setSubmenu(null)}>
          <MenuItem
            icon={<Spline size={14} />}
            label="Connector Type"
            onClick={() => setSubmenu(submenu === 'type' ? null : 'type')}
            darkMode={darkMode}
            hasSubmenu
            onMouseEnter={() => setSubmenu('type')}
          />
          {submenu === 'type' && (
            <SubMenu darkMode={darkMode} className="p-1 min-w-[150px]">
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
                      ? 'hover:bg-dk-hover text-dk-text'
                      : 'hover:bg-slate-100 text-slate-700'
                    }
                  `}
                >
                  {opt.label}
                </button>
              ))}
            </SubMenu>
          )}
        </div>

        <div className="relative" onMouseLeave={() => setSubmenu(null)}>
          <MenuItem
            icon={<Palette size={14} />}
            label="Connector Color"
            onClick={() => setSubmenu(submenu === 'color' ? null : 'color')}
            darkMode={darkMode}
            hasSubmenu
            onMouseEnter={() => setSubmenu('color')}
          />
          {submenu === 'color' && (
            <SubMenu darkMode={darkMode} className="p-3" style={{ minWidth: 170 }}>
              <div className="grid grid-cols-5 gap-2">
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
            </SubMenu>
          )}
        </div>

        <MenuDivider darkMode={darkMode} />

        <MenuItem
          icon={<Pencil size={14} />}
          label="Edit Label"
          onClick={() => { onEditLabel(); onClose(); }}
          darkMode={darkMode}
          onMouseEnter={() => setSubmenu(null)}
        />

        <div className="relative" onMouseLeave={() => setSubmenu(null)}>
          <MenuItem
            icon={<Type size={14} />}
            label="Label Font Size"
            onClick={() => setSubmenu(submenu === 'fontSize' ? null : 'fontSize')}
            darkMode={darkMode}
            hasSubmenu
            onMouseEnter={() => setSubmenu('fontSize')}
          />
          {submenu === 'fontSize' && (
            <SubMenu darkMode={darkMode} className="p-1 min-w-[120px] max-h-[300px] overflow-y-auto">
              {[8, 9, 10, 11, 12, 14, 16, 18, 20, 24].map((size) => (
                <button
                  key={size}
                  onClick={(e) => {
                    e.stopPropagation();
                    updateEdgeData(edgeId, { labelFontSize: size });
                    onClose();
                  }}
                  className={`
                    flex items-center gap-2 w-full px-3 py-1.5 text-left text-sm rounded
                    transition-colors duration-75 cursor-pointer
                    ${size === currentFontSize
                      ? 'bg-primary/10 text-primary font-medium'
                      : darkMode ? 'hover:bg-dk-hover text-dk-text' : 'hover:bg-slate-100 text-slate-700'
                    }
                  `}
                >
                  <span>{size}px</span>
                  {size === currentFontSize && <span className="ml-auto text-primary text-[10px]">&#10003;</span>}
                </button>
              ))}
            </SubMenu>
          )}
        </div>

        <MenuItem
          icon={<MoveHorizontal size={14} />}
          label="Straighten"
          onClick={() => { onStraighten(); onClose(); }}
          darkMode={darkMode}
          onMouseEnter={() => setSubmenu(null)}
        />

        <MenuDivider darkMode={darkMode} />

        <MenuItem
          icon={<Trash2 size={14} />}
          label="Delete"
          onClick={() => { onDelete(); onClose(); }}
          darkMode={darkMode}
          onMouseEnter={() => setSubmenu(null)}
        />
      </div>
    </div>
  );
};

export default React.memo(EdgeContextMenu);
