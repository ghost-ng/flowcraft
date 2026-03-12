import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Pencil,
  Trash2,
  Spline,
  MoveHorizontal,
  AArrowDown,
  RotateCcw,
  ArrowRight,
  Eraser,
  Minus,
} from 'lucide-react';

import { useStyleStore } from '../../store/styleStore';
import { useFlowStore } from '../../store/flowStore';
import { useMenuPosition, SubMenu, EdgeColorSidebar } from './menuUtils';
import { colorPalettes, defaultPaletteId } from '../../styles/palettes';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EdgeContextMenuProps {
  x: number;
  y: number;
  edgeId: string;
  /** All edge IDs that should be affected (right-clicked + selected) */
  selectedEdgeIds?: string[];
  /** Which end of the edge the right-click was closest to */
  closestEnd: 'source' | 'target';
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
  { value: 'step', label: 'Straight Step' },
  { value: 'straight', label: 'Straight' },
];

const arrowheadOptions = [
  { value: 'none', label: 'None' },
  { value: 'arrow', label: 'Arrow' },
  { value: 'rounded', label: 'Rounded' },
  { value: 'diamond', label: 'Diamond' },
  { value: 'circle', label: 'Circle' },
  { value: 'open', label: 'Open Arrow' },
];

const arrowheadToMarker = (type: string): string => {
  switch (type) {
    case 'arrow': return 'url(#charthero-filledTriangle)';
    case 'rounded': return 'url(#charthero-thinArrow)';
    case 'diamond': return 'url(#charthero-filledDiamond)';
    case 'circle': return 'url(#charthero-filledCircle)';
    case 'open': return 'url(#charthero-openTriangle)';
    default: return '';
  }
};

const markerToArrowhead = (marker?: string): string => {
  if (!marker) return 'none';
  if (marker.includes('thinArrow')) return 'rounded';
  if (marker.includes('filledTriangle')) return 'arrow';
  if (marker.includes('filledDiamond')) return 'diamond';
  if (marker.includes('filledCircle')) return 'circle';
  if (marker.includes('openTriangle')) return 'open';
  return 'none';
};

// Fallback colors when no palette is selected
const defaultQuickColors = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#6b7280', '#f97316', '#14b8a6',
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
      flex items-center gap-2 w-full px-2.5 py-1 text-left text-xs rounded
      transition-colors duration-75 cursor-pointer
      ${darkMode
        ? 'hover:bg-dk-hover text-dk-text'
        : 'hover:bg-slate-100 text-slate-700'
      }
    `}
  >
    <span className="shrink-0 w-3.5 h-3.5 flex items-center justify-center text-slate-400 dark:text-dk-faint">
      {icon}
    </span>
    <span className="flex-1">{label}</span>
    {hasSubmenu && (
      <span className="text-slate-400 dark:text-dk-faint text-[10px] ml-1.5">&rsaquo;</span>
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
  x, y, edgeId, selectedEdgeIds, closestEnd, onClose, onChangeType, onChangeColor, onEditLabel, onStraighten, onDelete,
}) => {
  // All edge IDs to affect: right-clicked + selected
  const targetIds = React.useMemo(() => {
    const ids = new Set(selectedEdgeIds ?? []);
    ids.add(edgeId);
    return Array.from(ids);
  }, [edgeId, selectedEdgeIds]);
  const darkMode = useStyleStore((s) => s.darkMode);
  const activeStyleId = useStyleStore((s) => s.activeStyleId);
  const activePaletteId = useStyleStore((s) => s.activePaletteId);
  const quickColors = (activePaletteId && colorPalettes[activePaletteId]?.colors) || colorPalettes[defaultPaletteId]?.colors || defaultQuickColors;
  const menuRef = useRef<HTMLDivElement>(null);
  const [submenu, setSubmenu] = useState<'type' | 'fontSize' | 'arrowEnd' | 'thickness' | null>(null);
  const menuStyle = useMenuPosition(x, y, menuRef);
  const updateEdgeData = useFlowStore((s) => s.updateEdgeData);
  const updateEdge = useFlowStore((s) => s.updateEdge);

  // Get current edge data reactively so sliders update live
  const currentFontSize = useFlowStore((s) => {
    const e = s.edges.find(ed => ed.id === edgeId);
    return (e?.data as Record<string, unknown>)?.labelFontSize as number || 11;
  });
  const currentThickness = useFlowStore((s) => {
    const e = s.edges.find(ed => ed.id === edgeId);
    return (e?.data as Record<string, unknown>)?.thickness as number || 2;
  });
  const currentArrowType = useFlowStore((s) => {
    const e = s.edges.find(ed => ed.id === edgeId);
    const marker = closestEnd === 'source'
      ? (typeof e?.markerStart === 'string' ? e.markerStart : undefined)
      : (typeof e?.markerEnd === 'string' ? e.markerEnd : undefined);
    return markerToArrowhead(marker);
  });

  // Close on click-outside or Escape (but not when clicking the color sidebar)
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest?.('[data-color-sidebar]')) return;
      if (menuRef.current && !menuRef.current.contains(target)) {
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

  const handleResetConnector = useCallback(() => {
    for (const eid of targetIds) {
      updateEdgeData(eid, {
        waypoints: undefined,
        color: undefined,
        thickness: undefined,
        opacity: undefined,
        strokeDasharray: undefined,
        label: undefined,
        labelColor: undefined,
        labelBgColor: undefined,
        labelFontSize: undefined,
        dependencyType: undefined,
      } as Record<string, unknown>);
      updateEdge(eid, {
        markerStart: undefined,
        markerEnd: 'url(#charthero-filledTriangle)',
      });
    }
    onClose();
  }, [targetIds, updateEdgeData, updateEdge, onClose]);

  const handleResetToTheme = useCallback(() => {
    const store = useFlowStore.getState();
    for (const eid of targetIds) {
      store.updateEdgeData(eid, {
        color: undefined,
        thickness: undefined,
        opacity: undefined,
        strokeDasharray: undefined,
        animated: undefined,
        labelColor: undefined,
        labelFontSize: undefined,
        labelBgColor: undefined,
        styleOverrides: undefined,
      } as Record<string, unknown>);
      store.updateEdge(eid, {
        markerStart: undefined,
        markerEnd: undefined,
      });
    }
    onClose();
  }, [targetIds, onClose]);

  return (
    <div ref={menuRef} style={menuStyle} className="relative">
      {/* Main menu */}
      <div
        className={`
          min-w-[180px] rounded-lg shadow-xl border p-1
          ${darkMode ? 'bg-dk-panel border-dk-border' : 'bg-white border-slate-200'}
        `}
      >
        {/* Quick actions row: Edit Label, Straighten, Reset Connector, Reset to Theme */}
        <div className="flex items-center gap-0.5 px-1 py-0.5" onMouseEnter={() => setSubmenu(null)}>
          {[
            { icon: <Pencil size={13} />, tooltip: 'Edit Label', onClick: () => { onEditLabel(); onClose(); } },
            { icon: <MoveHorizontal size={13} />, tooltip: 'Straighten', onClick: () => { onStraighten(); onClose(); } },
            { icon: <Eraser size={13} />, tooltip: 'Reset Connector', onClick: handleResetConnector },
            ...(activeStyleId ? [{ icon: <RotateCcw size={13} />, tooltip: 'Reset to Theme', onClick: handleResetToTheme }] : []),
          ].map(({ icon, tooltip, onClick }) => (
            <button
              key={tooltip}
              data-tooltip={tooltip}
              onClick={(e) => { e.stopPropagation(); onClick(); }}
              className={`
                flex items-center justify-center w-7 h-7 rounded cursor-pointer
                transition-colors duration-75
                ${darkMode ? 'hover:bg-dk-hover text-dk-faint hover:text-dk-text' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-700'}
              `}
            >
              {icon}
            </button>
          ))}
        </div>

        <MenuDivider darkMode={darkMode} />

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
                    flex items-center gap-2 w-full px-2.5 py-1 text-left text-xs rounded
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
            icon={<ArrowRight size={14} />}
            label={closestEnd === 'source' ? 'Arrow Start' : 'Arrow End'}
            onClick={() => setSubmenu(submenu === 'arrowEnd' ? null : 'arrowEnd')}
            darkMode={darkMode}
            hasSubmenu
            onMouseEnter={() => setSubmenu('arrowEnd')}
          />
          {submenu === 'arrowEnd' && (
            <SubMenu darkMode={darkMode} className="p-1 min-w-[140px]">
              {arrowheadOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={(e) => {
                    e.stopPropagation();
                    const markerValue = arrowheadToMarker(opt.value) || undefined;
                    for (const eid of targetIds) {
                      if (closestEnd === 'source') {
                        updateEdge(eid, { markerStart: markerValue });
                      } else {
                        updateEdge(eid, { markerEnd: markerValue });
                      }
                    }
                    onClose();
                  }}
                  className={`
                    flex items-center gap-2 w-full px-2.5 py-1 text-left text-xs rounded
                    transition-colors duration-75 cursor-pointer
                    ${opt.value === currentArrowType
                      ? 'bg-primary/10 text-primary font-medium'
                      : darkMode ? 'hover:bg-dk-hover text-dk-text' : 'hover:bg-slate-100 text-slate-700'
                    }
                  `}
                >
                  <span>{opt.label}</span>
                  {opt.value === currentArrowType && <span className="ml-auto text-primary text-[10px]">&#10003;</span>}
                </button>
              ))}
            </SubMenu>
          )}
        </div>

        <div className="relative" onMouseLeave={() => setSubmenu(null)}>
          <MenuItem
            icon={<AArrowDown size={14} />}
            label="Label Font Size"
            onClick={() => setSubmenu(submenu === 'fontSize' ? null : 'fontSize')}
            darkMode={darkMode}
            hasSubmenu
            onMouseEnter={() => setSubmenu('fontSize')}
          />
          {submenu === 'fontSize' && (
            <SubMenu darkMode={darkMode} className="p-2 min-w-[160px]">
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={6}
                  max={32}
                  value={currentFontSize}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    for (const eid of targetIds) {
                      updateEdgeData(eid, { labelFontSize: val });
                    }
                  }}
                  className="flex-1 h-3 cursor-pointer accent-primary"
                />
                <span className={`text-xs w-8 text-right tabular-nums ${darkMode ? 'text-dk-muted' : 'text-slate-500'}`}>
                  {currentFontSize}px
                </span>
              </div>
            </SubMenu>
          )}
        </div>

        {/* Edge Thickness submenu */}
        <div className="relative" onMouseLeave={() => setSubmenu(null)}>
          <MenuItem
            icon={<Minus size={14} />}
            label="Edge Thickness"
            onClick={() => setSubmenu(submenu === 'thickness' ? null : 'thickness')}
            darkMode={darkMode}
            hasSubmenu
            onMouseEnter={() => setSubmenu('thickness')}
          />
          {submenu === 'thickness' && (
            <SubMenu darkMode={darkMode} className="p-2 min-w-[160px]">
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={currentThickness}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    for (const eid of targetIds) {
                      updateEdgeData(eid, { thickness: val });
                    }
                  }}
                  className="flex-1 h-3 cursor-pointer accent-primary"
                />
                <span className={`text-xs w-8 text-right tabular-nums ${darkMode ? 'text-dk-muted' : 'text-slate-500'}`}>
                  {currentThickness}px
                </span>
              </div>
            </SubMenu>
          )}
        </div>

        <MenuDivider darkMode={darkMode} />

        <MenuItem
          icon={<Trash2 size={14} />}
          label="Delete"
          onClick={() => { onDelete(); onClose(); }}
          darkMode={darkMode}
          onMouseEnter={() => setSubmenu(null)}
        />
      </div>

      {/* Color swatches sidebar */}
      <EdgeColorSidebar
        darkMode={darkMode}
        menuRef={menuRef}
        colors={quickColors}
        onSelectColor={(color) => { onChangeColor(color); }}
      />
    </div>
  );
};

export default React.memo(EdgeContextMenu);
