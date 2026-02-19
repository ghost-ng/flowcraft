import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Trash2,
  LayoutGrid,
  AlignLeft,
  AlignCenterHorizontal,
  AlignRight,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  ArrowRightLeft,
  ArrowUpDown,
  Palette,
  Group,
  FlipHorizontal2,
  FlipVertical2,
  RotateCw,
  RotateCcw,
  Link,
} from 'lucide-react';

import { useFlowStore, type FlowNode } from '../../store/flowStore';
import { useUIStore } from '../../store/uiStore';
import { useStyleStore } from '../../store/styleStore';
import { useAutoLayout } from '../../hooks/useAutoLayout';
import * as alignment from '../../utils/alignmentUtils';
import { mirrorHorizontal, mirrorVertical, rotateArrangement } from '../../utils/transformUtils';
import { computeBoundingBox } from '../../utils/groupUtils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SelectionContextMenuProps {
  /** Pixel position of the menu (screen coords) */
  x: number;
  y: number;
  /** IDs of the selected nodes */
  nodeIds: string[];
  /** Close callback */
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Quick colors (same as NodeContextMenu)
// ---------------------------------------------------------------------------

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

const SelectionContextMenu: React.FC<SelectionContextMenuProps> = ({
  x,
  y,
  nodeIds,
  onClose,
}) => {
  const darkMode = useStyleStore((s) => s.darkMode);
  const menuRef = useRef<HTMLDivElement>(null);
  const [submenu, setSubmenu] = useState<'align' | 'distribute' | 'color' | 'group' | 'mirror' | 'rotate' | null>(null);
  const { applyLayout } = useAutoLayout();

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

  // Viewport boundary clamping
  const adjustedStyle = useCallback((): React.CSSProperties => {
    const menuW = 200;
    const menuH = 320;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    return {
      position: 'fixed',
      top: y + menuH > vh ? vh - menuH - 8 : y,
      left: x + menuW > vw ? vw - menuW - 8 : x,
      zIndex: 9999,
    };
  }, [x, y]);

  // Helper: get selected FlowNode objects
  const getSelectedNodes = useCallback(() => {
    const { nodes } = useFlowStore.getState();
    const idSet = new Set(nodeIds);
    return nodes.filter((n) => idSet.has(n.id));
  }, [nodeIds]);

  // Helper: apply alignment result to store
  const applyPositions = useCallback((positions: Map<string, { x: number; y: number }>) => {
    const { updateNodePosition } = useFlowStore.getState();
    for (const [id, pos] of positions) {
      updateNodePosition(id, pos);
    }
  }, []);

  // ---- Delete all selected nodes -------------------------------------------
  const handleDeleteSelected = useCallback(() => {
    const { removeNode } = useFlowStore.getState();
    for (const id of nodeIds) {
      removeNode(id);
    }
    onClose();
  }, [nodeIds, onClose]);

  // ---- Auto-Format Selected ------------------------------------------------
  const handleAutoFormat = useCallback(() => {
    applyLayout('TB', nodeIds);
    onClose();
  }, [applyLayout, nodeIds, onClose]);

  // ---- Alignment handlers --------------------------------------------------
  const handleAlign = useCallback((fn: typeof alignment.alignLeft) => {
    const nodes = getSelectedNodes();
    if (nodes.length < 2) return;
    const positions = fn(nodes);
    applyPositions(positions);
    onClose();
  }, [getSelectedNodes, applyPositions, onClose]);

  // ---- Distribution handlers -----------------------------------------------
  const handleDistribute = useCallback((fn: typeof alignment.distributeH) => {
    const nodes = getSelectedNodes();
    if (nodes.length < 3) return;
    const positions = fn(nodes);
    applyPositions(positions);
    onClose();
  }, [getSelectedNodes, applyPositions, onClose]);

  // ---- Change color for all selected nodes ---------------------------------
  const handleChangeColor = useCallback((color: string) => {
    const { updateNodeData } = useFlowStore.getState();
    for (const id of nodeIds) {
      updateNodeData(id, { color });
    }
    onClose();
  }, [nodeIds, onClose]);

  const handleMirror = useCallback((fn: typeof mirrorHorizontal) => {
    const nodes = getSelectedNodes();
    if (nodes.length < 2) return;
    const positions = fn(nodes);
    applyPositions(positions);
    onClose();
  }, [getSelectedNodes, applyPositions, onClose]);

  const handleRotate = useCallback((angleDeg: number) => {
    const nodes = getSelectedNodes();
    if (nodes.length < 2) return;
    const positions = rotateArrangement(nodes, angleDeg);
    applyPositions(positions);
    onClose();
  }, [getSelectedNodes, applyPositions, onClose]);

  // ---- Group selected nodes into a container --------------------------------
  const handleGroup = useCallback(() => {
    const { nodes, addNode, setNodes } = useFlowStore.getState();
    const selected = nodes.filter((n) => nodeIds.includes(n.id));
    if (selected.length < 2) return;

    const bbox = computeBoundingBox(selected, 30, 25);
    const groupId = `group_${Date.now()}`;
    const groupNode: FlowNode = {
      id: groupId,
      type: 'groupNode',
      position: { x: bbox.x, y: bbox.y },
      data: {
        label: 'Group',
        shape: 'group',
        width: bbox.width,
        height: bbox.height,
        color: '#f1f5f9',
        borderColor: '#94a3b8',
      },
    };

    addNode(groupNode);

    // Make selected nodes children - ensure group is BEFORE children in array
    const currentNodes = useFlowStore.getState().nodes;
    const childIds = new Set(nodeIds);
    const otherNodes = currentNodes.filter((n) => n.id !== groupId && !childIds.has(n.id));
    const theGroup = currentNodes.find((n) => n.id === groupId)!;
    const childNodes = currentNodes
      .filter((n) => childIds.has(n.id))
      .map((n) => ({
        ...n,
        parentId: groupId,
        position: {
          x: n.position.x - bbox.x,
          y: n.position.y - bbox.y,
        },
        extent: 'parent' as const,
        data: { ...n.data, groupId },
      }));
    setNodes([...otherNodes, theGroup, ...childNodes]);
    onClose();
  }, [nodeIds, onClose]);

  const handleLinkGroup = useCallback(() => {
    if (nodeIds.length < 2) return;
    useFlowStore.getState().createLinkGroup(nodeIds);
    onClose();
  }, [nodeIds, onClose]);

  // Check if all selected nodes share the same link group
  const sharedLinkGroupId = (() => {
    const { nodes } = useFlowStore.getState();
    const idSet = new Set(nodeIds);
    const selected = nodes.filter((n) => idSet.has(n.id));
    if (selected.length === 0) return null;
    const first = selected[0].data.linkGroupId;
    if (!first) return null;
    return selected.every((n) => n.data.linkGroupId === first) ? first : null;
  })();

  const handleEditLinkGroup = useCallback(() => {
    if (sharedLinkGroupId) {
      useUIStore.getState().setLinkGroupEditorId(sharedLinkGroupId);
      onClose();
    }
  }, [sharedLinkGroupId, onClose]);

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
          icon={<Trash2 size={14} />}
          label="Delete Selected"
          onClick={handleDeleteSelected}
          darkMode={darkMode}
          shortcut="Del"
          onMouseEnter={() => setSubmenu(null)}
        />

        <MenuDivider darkMode={darkMode} />

        <MenuItem
          icon={<LayoutGrid size={14} />}
          label="Auto-Format Selected"
          onClick={handleAutoFormat}
          darkMode={darkMode}
          shortcut="Ctrl+Shift+L"
          onMouseEnter={() => setSubmenu(null)}
        />

        <div className="relative" onMouseLeave={() => setSubmenu(null)}>
          <MenuItem
            icon={<Group size={14} />}
            label="Group"
            onClick={() => setSubmenu(submenu === 'group' ? null : 'group')}
            darkMode={darkMode}
            hasSubmenu
            onMouseEnter={() => setSubmenu('group')}
            disabled={nodeIds.length < 2}
          />
          {submenu === 'group' && (
            <div
              className={`
                absolute top-0 left-full ml-1 min-w-[180px] rounded-lg shadow-xl border p-1
                ${darkMode ? 'bg-dk-panel border-dk-border' : 'bg-white border-slate-200'}
              `}
            >
              <MenuItem
                icon={<Group size={14} />}
                label="Arrange in Region"
                onClick={handleGroup}
                darkMode={darkMode}
              />
              <MenuItem
                icon={<Link size={14} />}
                label="Link Group"
                onClick={handleLinkGroup}
                darkMode={darkMode}
              />
              {sharedLinkGroupId && (
                <>
                  <MenuDivider darkMode={darkMode} />
                  <MenuItem
                    icon={<Link size={14} />}
                    label="Edit Link Group"
                    onClick={handleEditLinkGroup}
                    darkMode={darkMode}
                  />
                </>
              )}
            </div>
          )}
        </div>

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
          {submenu === 'align' && (
            <div
              className={`
                absolute top-0 left-full ml-1 min-w-[180px] rounded-lg shadow-xl border p-1
                ${darkMode ? 'bg-dk-panel border-dk-border' : 'bg-white border-slate-200'}
              `}
            >
              <MenuItem icon={<AlignLeft size={14} />} label="Align Left" onClick={() => handleAlign(alignment.alignLeft)} darkMode={darkMode} />
              <MenuItem icon={<AlignCenterHorizontal size={14} />} label="Align Center (H)" onClick={() => handleAlign(alignment.alignCenterH)} darkMode={darkMode} />
              <MenuItem icon={<AlignRight size={14} />} label="Align Right" onClick={() => handleAlign(alignment.alignRight)} darkMode={darkMode} />
              <MenuDivider darkMode={darkMode} />
              <MenuItem icon={<AlignStartVertical size={14} />} label="Align Top" onClick={() => handleAlign(alignment.alignTop)} darkMode={darkMode} />
              <MenuItem icon={<AlignCenterVertical size={14} />} label="Align Center (V)" onClick={() => handleAlign(alignment.alignCenterV)} darkMode={darkMode} />
              <MenuItem icon={<AlignEndVertical size={14} />} label="Align Bottom" onClick={() => handleAlign(alignment.alignBottom)} darkMode={darkMode} />
            </div>
          )}
        </div>

        <div className="relative" onMouseLeave={() => setSubmenu(null)}>
          <MenuItem
            icon={<ArrowRightLeft size={14} />}
            label="Distribute"
            onClick={() => setSubmenu(submenu === 'distribute' ? null : 'distribute')}
            darkMode={darkMode}
            hasSubmenu
            onMouseEnter={() => setSubmenu('distribute')}
            disabled={nodeIds.length < 3}
          />
          {submenu === 'distribute' && (
            <div
              className={`
                absolute top-0 left-full ml-1 min-w-[200px] rounded-lg shadow-xl border p-1
                ${darkMode ? 'bg-dk-panel border-dk-border' : 'bg-white border-slate-200'}
              `}
            >
              <MenuItem icon={<ArrowRightLeft size={14} />} label="Horizontal" onClick={() => handleDistribute(alignment.distributeH)} darkMode={darkMode} />
              <MenuItem icon={<ArrowUpDown size={14} />} label="Vertical" onClick={() => handleDistribute(alignment.distributeV)} darkMode={darkMode} />
            </div>
          )}
        </div>

        <MenuDivider darkMode={darkMode} />

        <div className="relative" onMouseLeave={() => setSubmenu(null)}>
          <MenuItem
            icon={<FlipHorizontal2 size={14} />}
            label="Mirror / Flip"
            onClick={() => setSubmenu(submenu === 'mirror' ? null : 'mirror')}
            darkMode={darkMode}
            hasSubmenu
            onMouseEnter={() => setSubmenu('mirror')}
            disabled={nodeIds.length < 2}
          />
          {submenu === 'mirror' && (
            <div
              className={`
                absolute top-0 left-full ml-1 min-w-[180px] rounded-lg shadow-xl border p-1
                ${darkMode ? 'bg-dk-panel border-dk-border' : 'bg-white border-slate-200'}
              `}
            >
              <MenuItem icon={<FlipHorizontal2 size={14} />} label="Flip Horizontal" onClick={() => handleMirror(mirrorHorizontal)} darkMode={darkMode} shortcut="Ctrl+Shift+H" />
              <MenuItem icon={<FlipVertical2 size={14} />} label="Flip Vertical" onClick={() => handleMirror(mirrorVertical)} darkMode={darkMode} shortcut="Ctrl+Alt+V" />
            </div>
          )}
        </div>

        <div className="relative" onMouseLeave={() => setSubmenu(null)}>
          <MenuItem
            icon={<RotateCw size={14} />}
            label="Rotate"
            onClick={() => setSubmenu(submenu === 'rotate' ? null : 'rotate')}
            darkMode={darkMode}
            hasSubmenu
            onMouseEnter={() => setSubmenu('rotate')}
            disabled={nodeIds.length < 2}
          />
          {submenu === 'rotate' && (
            <div
              className={`
                absolute top-0 left-full ml-1 min-w-[160px] rounded-lg shadow-xl border p-1
                ${darkMode ? 'bg-dk-panel border-dk-border' : 'bg-white border-slate-200'}
              `}
            >
              <MenuItem icon={<RotateCw size={14} />} label="90° Clockwise" onClick={() => handleRotate(90)} darkMode={darkMode} shortcut="Ctrl+]" />
              <MenuItem icon={<RotateCcw size={14} />} label="90° Counter-CW" onClick={() => handleRotate(-90)} darkMode={darkMode} shortcut="Ctrl+[" />
              <MenuItem icon={<RotateCw size={14} />} label="180°" onClick={() => handleRotate(180)} darkMode={darkMode} />
            </div>
          )}
        </div>

        <MenuDivider darkMode={darkMode} />

        <div className="relative" onMouseLeave={() => setSubmenu(null)}>
          <MenuItem
            icon={<Palette size={14} />}
            label="Change Color"
            onClick={() => setSubmenu(submenu === 'color' ? null : 'color')}
            darkMode={darkMode}
            hasSubmenu
            onMouseEnter={() => setSubmenu('color')}
          />
          {submenu === 'color' && (
            <div
              className={`
                absolute top-0 left-full ml-1 rounded-lg shadow-xl border p-3
                ${darkMode ? 'bg-dk-panel border-dk-border' : 'bg-white border-slate-200'}
              `}
            >
              <div className="grid grid-cols-5 gap-1.5">
                {quickColors.map((color) => (
                  <button
                    key={color}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleChangeColor(color);
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
      </div>
    </div>
  );
};

export default React.memo(SelectionContextMenu);
