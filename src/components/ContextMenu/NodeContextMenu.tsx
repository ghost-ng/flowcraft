import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Pencil,
  Copy,
  CopyPlus,
  Trash2,
  ArrowDownToLine,
  ArrowUpToLine,
  ChevronDown,
  ChevronUp,
  Layers,
  Shapes,
  Palette,
  Ungroup,
  Circle,
  MousePointerClick,
  Link,
  AlignLeft,
  AlignCenterHorizontal,
  AlignRight,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
} from 'lucide-react';

import { useStyleStore } from '../../store/styleStore';
import type { NodeShape, StatusIndicator } from '../../store/flowStore';
import { useFlowStore, newPuckId } from '../../store/flowStore';
import * as alignment from '../../utils/alignmentUtils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NodeContextMenuProps {
  /** Pixel position of the menu (screen coords) */
  x: number;
  y: number;
  /** ID of the right-clicked node */
  nodeId: string;
  /** Close callback */
  onClose: () => void;
  /** Start inline editing of the node label */
  onEditLabel: () => void;
  /** Duplicate the node */
  onDuplicate: () => void;
  /** Copy the node to clipboard */
  onCopy: () => void;
  /** Delete the node */
  onDelete: () => void;
  /** Change the node shape */
  onChangeShape: (shape: NodeShape) => void;
  /** Change the node color */
  onChangeColor: (color: string) => void;
  /** Send the node to back (lowest z-index) */
  onSendToBack: () => void;
  /** Bring the node to front (highest z-index) */
  onBringToFront: () => void;
  /** Send the node backward one step */
  onSendBackward: () => void;
  /** Bring the node forward one step */
  onBringForward: () => void;
  /** Whether the right-clicked node is a group node */
  isGroupNode?: boolean;
  /** Ungroup a group node (release children) */
  onUngroup?: () => void;
  /** Align selected nodes using an alignment function */
  onAlign?: (fn: (nodes: any[]) => Map<string, {x: number; y: number}>) => void;
  /** Whether multiple nodes are currently selected */
  hasMultipleSelected?: boolean;
  /** Whether the node is part of a link group */
  isInLinkGroup?: boolean;
  /** Open the link group editor for this node's group */
  onEditLinkGroup?: () => void;
}

// ---------------------------------------------------------------------------
// Shape options
// ---------------------------------------------------------------------------

const shapeOptions: { value: NodeShape; label: string }[] = [
  { value: 'rectangle', label: 'Rectangle' },
  { value: 'roundedRectangle', label: 'Rounded Rect' },
  { value: 'diamond', label: 'Diamond' },
  { value: 'circle', label: 'Circle' },
  { value: 'parallelogram', label: 'Parallelogram' },
  { value: 'hexagon', label: 'Hexagon' },
  { value: 'document', label: 'Document' },
  { value: 'cloud', label: 'Cloud' },
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

const statusOptions: { value: StatusIndicator['status']; label: string; color: string }[] = [
  { value: 'none', label: 'None', color: 'transparent' },
  { value: 'not-started', label: 'Not Started', color: '#94a3b8' },
  { value: 'in-progress', label: 'In Progress', color: '#3b82f6' },
  { value: 'completed', label: 'Completed', color: '#10b981' },
  { value: 'blocked', label: 'Blocked', color: '#ef4444' },
  { value: 'review', label: 'Review', color: '#f59e0b' },
];

// ---------------------------------------------------------------------------
// Shared components
// ---------------------------------------------------------------------------

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  darkMode: boolean;
  hasSubmenu?: boolean;
  shortcut?: string;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  label,
  onClick,
  disabled,
  darkMode,
  hasSubmenu,
  shortcut,
  onMouseEnter,
  onMouseLeave,
}) => (
  <button
    onClick={(e) => {
      e.stopPropagation();
      if (!disabled) onClick();
    }}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
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
    <span className="flex-1">{label}</span>
    {shortcut && (
      <span className="text-[10px] text-slate-400 ml-auto font-mono">{shortcut}</span>
    )}
    {hasSubmenu && (
      <span className="text-slate-400 text-xs ml-2">&rsaquo;</span>
    )}
  </button>
);

const MenuDivider: React.FC<{ darkMode: boolean }> = ({ darkMode }) => (
  <div className={`my-1 h-px ${darkMode ? 'bg-dk-hover' : 'bg-slate-200'}`} />
);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const NodeContextMenu: React.FC<NodeContextMenuProps> = ({
  x,
  y,
  nodeId,
  onClose,
  onEditLabel,
  onDuplicate,
  onCopy,
  onDelete,
  onChangeShape,
  onChangeColor,
  onSendToBack,
  onBringToFront,
  onSendBackward,
  onBringForward,
  isGroupNode,
  onUngroup,
  onAlign,
  hasMultipleSelected,
  isInLinkGroup,
  onEditLinkGroup,
}) => {
  const darkMode = useStyleStore((s) => s.darkMode);
  const menuRef = useRef<HTMLDivElement>(null);
  const [submenu, setSubmenu] = useState<'shape' | 'status' | 'align' | 'select' | 'order' | null>(null);

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

  // Compute menu position + whether submenus should flip left
  const menuW = 200;
  const subW = 210;
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1920;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 1080;
  const menuLeft = x + menuW > vw ? vw - menuW - 8 : x;
  const flipSub = menuLeft + menuW + subW > vw; // flip submenus left if no room on right

  const adjustedStyle = useCallback((): React.CSSProperties => {
    const menuH = 400;
    return {
      position: 'fixed',
      top: y + menuH > vh ? vh - menuH - 8 : y,
      left: menuLeft,
      zIndex: 9999,
    };
  }, [y, vh, menuLeft]);

  const subPos = flipSub ? 'right-full mr-1' : 'left-full ml-1';

  const updateNodeData = useFlowStore((s) => s.updateNodeData);
  const handleSetStatus = useCallback((status: StatusIndicator['status']) => {
    if (status === 'none') {
      // Remove all pucks
      updateNodeData(nodeId, { statusIndicators: [], statusIndicator: undefined });
    } else {
      const defaultColors: Record<string, string> = {
        'not-started': '#94a3b8',
        'in-progress': '#3b82f6',
        'completed': '#10b981',
        'blocked': '#ef4444',
        'review': '#f59e0b',
      };
      // Import newPuckId from flowStore
      const { addStatusPuck } = useFlowStore.getState();
      addStatusPuck(nodeId, {
        id: newPuckId(),
        status,
        color: defaultColors[status],
        size: 12,
        position: 'top-right',
      });
    }
    onClose();
  }, [nodeId, onClose]);

  return (
    <div ref={menuRef} style={adjustedStyle()} className="relative">
      {/* Main menu */}
      <div
        className={`
          min-w-[180px] rounded-lg shadow-xl border p-1
          ${darkMode ? 'bg-dk-panel border-dk-border' : 'bg-white border-slate-200'}
        `}
      >
        <MenuItem
          icon={<Pencil size={14} />}
          label="Edit Label"
          onClick={() => { onEditLabel(); onClose(); }}
          darkMode={darkMode}
          shortcut="F2"
          onMouseEnter={() => setSubmenu(null)}
        />
        <MenuItem
          icon={<CopyPlus size={14} />}
          label="Duplicate"
          onClick={() => { onDuplicate(); onClose(); }}
          darkMode={darkMode}
          shortcut="Ctrl+D"
          onMouseEnter={() => setSubmenu(null)}
        />
        <MenuItem
          icon={<Copy size={14} />}
          label="Copy"
          onClick={() => { onCopy(); onClose(); }}
          darkMode={darkMode}
          onMouseEnter={() => setSubmenu(null)}
        />
        <MenuItem
          icon={<Trash2 size={14} />}
          label="Delete"
          onClick={() => { onDelete(); onClose(); }}
          darkMode={darkMode}
          shortcut="Del"
          onMouseEnter={() => setSubmenu(null)}
        />

        <MenuDivider darkMode={darkMode} />

        <div className="relative" onMouseLeave={() => setSubmenu(null)}>
          <MenuItem
            icon={<Shapes size={14} />}
            label="Change Shape"
            onClick={() => setSubmenu(submenu === 'shape' ? null : 'shape')}
            darkMode={darkMode}
            hasSubmenu
            onMouseEnter={() => setSubmenu('shape')}
          />
          {submenu === 'shape' && (
            <div
              className={`
                absolute top-0 ${subPos} min-w-[160px] rounded-lg shadow-xl border p-1
                ${darkMode ? 'bg-dk-panel border-dk-border' : 'bg-white border-slate-200'}
              `}
            >
              {shapeOptions.map(({ value, label }) => (
                <MenuItem
                  key={value}
                  icon={<Shapes size={14} />}
                  label={label}
                  onClick={() => { onChangeShape(value); onClose(); }}
                  darkMode={darkMode}
                />
              ))}
            </div>
          )}
        </div>

        <div className="relative" onMouseLeave={() => setSubmenu(null)}>
          <MenuItem
            icon={<Circle size={14} />}
            label="Add Status"
            onClick={() => setSubmenu(submenu === 'status' ? null : 'status')}
            darkMode={darkMode}
            hasSubmenu
            onMouseEnter={() => setSubmenu('status')}
          />
          {submenu === 'status' && (
            <div
              className={`
                absolute top-0 ${subPos} min-w-[160px] rounded-lg shadow-xl border p-1
                ${darkMode ? 'bg-dk-panel border-dk-border' : 'bg-white border-slate-200'}
              `}
            >
              {statusOptions.map(({ value, label, color }) => (
                <button
                  key={value}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSetStatus(value);
                  }}
                  className={`
                    flex items-center gap-2.5 w-full px-3 py-1.5 text-left text-sm rounded
                    transition-colors duration-75 cursor-pointer
                    ${darkMode ? 'hover:bg-dk-hover text-dk-text' : 'hover:bg-slate-100 text-slate-700'}
                  `}
                >
                  <span
                    className="w-3 h-3 rounded-full shrink-0 border"
                    style={{ backgroundColor: color, borderColor: color === 'transparent' ? '#94a3b8' : color }}
                  />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {hasMultipleSelected && (
          <>
            <MenuDivider darkMode={darkMode} />
            <div className="relative" onMouseLeave={() => setSubmenu(null)}>
              <MenuItem
                icon={<AlignLeft size={14} />}
                label="Align"
                onClick={() => setSubmenu(submenu === 'align' ? null : 'align')}
                darkMode={darkMode}
                hasSubmenu
                onMouseEnter={() => setSubmenu('align')}
              />
              {submenu === 'align' && onAlign && (
                <div
                  className={`
                    absolute top-0 ${subPos} min-w-[180px] rounded-lg shadow-xl border p-1
                    ${darkMode ? 'bg-dk-panel border-dk-border' : 'bg-white border-slate-200'}
                  `}
                >
                  <MenuItem icon={<AlignLeft size={14} />} label="Align Left" onClick={() => { onAlign(alignment.alignLeft); onClose(); }} darkMode={darkMode} />
                  <MenuItem icon={<AlignCenterHorizontal size={14} />} label="Align Center (H)" onClick={() => { onAlign(alignment.alignCenterH); onClose(); }} darkMode={darkMode} />
                  <MenuItem icon={<AlignRight size={14} />} label="Align Right" onClick={() => { onAlign(alignment.alignRight); onClose(); }} darkMode={darkMode} />
                  <MenuDivider darkMode={darkMode} />
                  <MenuItem icon={<AlignStartVertical size={14} />} label="Align Top" onClick={() => { onAlign(alignment.alignTop); onClose(); }} darkMode={darkMode} />
                  <MenuItem icon={<AlignCenterVertical size={14} />} label="Align Center (V)" onClick={() => { onAlign(alignment.alignCenterV); onClose(); }} darkMode={darkMode} />
                  <MenuItem icon={<AlignEndVertical size={14} />} label="Align Bottom" onClick={() => { onAlign(alignment.alignBottom); onClose(); }} darkMode={darkMode} />
                </div>
              )}
            </div>
          </>
        )}

        {/* Inline color swatches */}
        <div className="px-3 py-1.5" onMouseEnter={() => setSubmenu(null)}>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="shrink-0 w-4 h-4 flex items-center justify-center text-slate-400">
              <Palette size={14} />
            </span>
            <span className={`text-sm ${darkMode ? 'text-dk-text' : 'text-slate-700'}`}>Color</span>
          </div>
          <div className="grid grid-cols-5 gap-1 ml-6">
            {quickColors.map((color) => (
              <button
                key={color}
                onClick={(e) => {
                  e.stopPropagation();
                  onChangeColor(color);
                  onClose();
                }}
                className="w-6 h-6 rounded-md border-2 border-transparent hover:border-white hover:scale-110 transition-all cursor-pointer"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>

        <MenuDivider darkMode={darkMode} />

        <div className="relative" onMouseLeave={() => setSubmenu(null)}>
          <MenuItem
            icon={<MousePointerClick size={14} />}
            label="Select"
            onClick={() => setSubmenu(submenu === 'select' ? null : 'select')}
            darkMode={darkMode}
            hasSubmenu
            onMouseEnter={() => setSubmenu('select')}
          />
          {submenu === 'select' && (
            <div
              className={`
                absolute top-0 ${subPos} min-w-[180px] rounded-lg shadow-xl border p-1
                ${darkMode ? 'bg-dk-panel border-dk-border' : 'bg-white border-slate-200'}
              `}
            >
              <MenuItem
                icon={<Shapes size={14} />}
                label="Same Shape"
                onClick={() => {
                  const { nodes, setSelectedNodes } = useFlowStore.getState();
                  const sourceNode = nodes.find((n) => n.id === nodeId);
                  if (!sourceNode) return;
                  const ids = nodes.filter((n) => n.data.shape === sourceNode.data.shape).map((n) => n.id);
                  setSelectedNodes(ids);
                  onClose();
                }}
                darkMode={darkMode}
              />
              <MenuItem
                icon={<Palette size={14} />}
                label="Same Color"
                onClick={() => {
                  const { nodes, setSelectedNodes } = useFlowStore.getState();
                  const sourceNode = nodes.find((n) => n.id === nodeId);
                  if (!sourceNode) return;
                  const srcColor = sourceNode.data.color || '#3b82f6';
                  const ids = nodes.filter((n) => (n.data.color || '#3b82f6') === srcColor).map((n) => n.id);
                  setSelectedNodes(ids);
                  onClose();
                }}
                darkMode={darkMode}
              />
              <MenuItem
                icon={<Circle size={14} />}
                label="Same Outline"
                onClick={() => {
                  const { nodes, setSelectedNodes } = useFlowStore.getState();
                  const sourceNode = nodes.find((n) => n.id === nodeId);
                  if (!sourceNode) return;
                  const srcBorder = sourceNode.data.borderColor || '';
                  const srcStyle = sourceNode.data.borderStyle || 'solid';
                  const ids = nodes.filter((n) => {
                    return (n.data.borderColor || '') === srcBorder && (n.data.borderStyle || 'solid') === srcStyle;
                  }).map((n) => n.id);
                  setSelectedNodes(ids);
                  onClose();
                }}
                darkMode={darkMode}
              />
              <MenuDivider darkMode={darkMode} />
              <MenuItem
                icon={<MousePointerClick size={14} />}
                label="All Nodes"
                onClick={() => {
                  const { nodes, setSelectedNodes } = useFlowStore.getState();
                  setSelectedNodes(nodes.map((n) => n.id));
                  onClose();
                }}
                darkMode={darkMode}
              />
            </div>
          )}
        </div>

        <MenuDivider darkMode={darkMode} />

        <div className="relative" onMouseLeave={() => setSubmenu(null)}>
          <MenuItem
            icon={<Layers size={14} />}
            label="Order"
            onClick={() => setSubmenu(submenu === 'order' ? null : 'order')}
            darkMode={darkMode}
            hasSubmenu
            onMouseEnter={() => setSubmenu('order')}
          />
          {submenu === 'order' && (
            <div
              className={`
                absolute top-0 ${subPos} min-w-[200px] rounded-lg shadow-xl border p-1
                ${darkMode ? 'bg-dk-panel border-dk-border' : 'bg-white border-slate-200'}
              `}
            >
              <MenuItem
                icon={<ChevronUp size={14} />}
                label="Forward"
                shortcut="Ctrl+]"
                onClick={() => { onBringForward(); }}
                darkMode={darkMode}
              />
              <MenuItem
                icon={<ChevronDown size={14} />}
                label="Backward"
                shortcut="Ctrl+["
                onClick={() => { onSendBackward(); }}
                darkMode={darkMode}
              />
              <MenuDivider darkMode={darkMode} />
              <MenuItem
                icon={<ArrowUpToLine size={14} />}
                label="Front"
                shortcut="Ctrl+Shift+]"
                onClick={() => { onBringToFront(); }}
                darkMode={darkMode}
              />
              <MenuItem
                icon={<ArrowDownToLine size={14} />}
                label="Back"
                shortcut="Ctrl+Shift+["
                onClick={() => { onSendToBack(); }}
                darkMode={darkMode}
              />
            </div>
          )}
        </div>

        {isInLinkGroup && onEditLinkGroup && (
          <>
            <MenuDivider darkMode={darkMode} />
            <MenuItem
              icon={<Link size={14} />}
              label="Edit Link Group"
              onClick={() => { onEditLinkGroup(); onClose(); }}
              darkMode={darkMode}
            />
          </>
        )}

        {isGroupNode && onUngroup && (
          <>
            <MenuDivider darkMode={darkMode} />
            <MenuItem
              icon={<Ungroup size={14} />}
              label="Ungroup"
              onClick={() => { onUngroup(); onClose(); }}
              darkMode={darkMode}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default React.memo(NodeContextMenu);
