import React, { useCallback, useMemo, useState, useRef } from 'react';
import {
  X,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeClosed,
  GripVertical,
  Search,
  Minus,
  Plus,
} from 'lucide-react';
import { useFlowStore, type FlowNodeData } from '../../store/flowStore';
import { useStyleStore } from '../../store/styleStore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OrderModalProps {
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const OrderModal: React.FC<OrderModalProps> = ({ onClose }) => {
  const darkMode = useStyleStore((s) => s.darkMode);
  const nodes = useFlowStore((s) => s.nodes);
  const setNodes = useFlowStore((s) => s.setNodes);
  const setSelectedNodes = useFlowStore((s) => s.setSelectedNodes);
  const [filter, setFilter] = useState('');
  const dragIdx = useRef<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  // Draggable modal position
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const draggingModal = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Collapse state
  const [collapsed, setCollapsed] = useState(false);

  // Nodes in render order (last = topmost). Show reversed so top of list = front.
  const orderedNodes = useMemo(() => [...nodes].reverse(), [nodes]);

  // Filter nodes by any data property
  const filteredNodes = useMemo(() => {
    if (!filter.trim()) return orderedNodes;
    const q = filter.toLowerCase();
    return orderedNodes.filter((n) => {
      const d = n.data as FlowNodeData;
      const searchable = [
        d.label,
        d.shape,
        d.color,
        d.borderColor,
        d.textColor,
        d.fontFamily,
        d.notes,
        d.swimlaneId,
        n.id,
        n.type,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return searchable.includes(q);
    });
  }, [orderedNodes, filter]);

  // Convert display index (reversed) back to real nodes array index
  const toRealIdx = useCallback(
    (displayIdx: number) => nodes.length - 1 - displayIdx,
    [nodes.length],
  );

  const handleMoveUp = useCallback(
    (displayIdx: number) => {
      const realIdx = toRealIdx(displayIdx);
      if (realIdx >= nodes.length - 1) return;
      const moved = [...nodes];
      [moved[realIdx], moved[realIdx + 1]] = [moved[realIdx + 1], moved[realIdx]];
      setNodes(moved);
    },
    [nodes, setNodes, toRealIdx],
  );

  const handleMoveDown = useCallback(
    (displayIdx: number) => {
      const realIdx = toRealIdx(displayIdx);
      if (realIdx <= 0) return;
      const moved = [...nodes];
      [moved[realIdx - 1], moved[realIdx]] = [moved[realIdx], moved[realIdx - 1]];
      setNodes(moved);
    },
    [nodes, setNodes, toRealIdx],
  );

  const handleToggleHidden = useCallback(
    (nodeId: string) => {
      setNodes(
        nodes.map((n) =>
          n.id === nodeId ? { ...n, hidden: !n.hidden } : n,
        ),
      );
    },
    [nodes, setNodes],
  );

  // Drag-and-drop reorder (rows)
  const handleDragStart = useCallback((displayIdx: number) => {
    dragIdx.current = displayIdx;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, displayIdx: number) => {
    e.preventDefault();
    setDragOverIdx(displayIdx);
  }, []);

  const handleDrop = useCallback(
    (dropDisplayIdx: number) => {
      const fromDisplay = dragIdx.current;
      if (fromDisplay === null || fromDisplay === dropDisplayIdx) {
        dragIdx.current = null;
        setDragOverIdx(null);
        return;
      }

      const fromReal = toRealIdx(fromDisplay);
      const toReal = toRealIdx(dropDisplayIdx);

      const moved = [...nodes];
      const [item] = moved.splice(fromReal, 1);
      moved.splice(toReal, 0, item);
      setNodes(moved);

      dragIdx.current = null;
      setDragOverIdx(null);
    },
    [nodes, setNodes, toRealIdx],
  );

  const handleDragEnd = useCallback(() => {
    dragIdx.current = null;
    setDragOverIdx(null);
  }, []);

  const handleSelect = useCallback(
    (nodeId: string) => {
      setSelectedNodes([nodeId]);
    },
    [setSelectedNodes],
  );

  // Modal drag handlers
  const handleHeaderMouseDown = useCallback((e: React.MouseEvent) => {
    // Don't start drag from buttons
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    draggingModal.current = true;

    const modalEl = (e.currentTarget as HTMLElement).parentElement!;
    const rect = modalEl.getBoundingClientRect();
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    const handleMove = (ev: MouseEvent) => {
      if (!draggingModal.current) return;
      setPosition({
        x: ev.clientX - dragOffset.current.x,
        y: ev.clientY - dragOffset.current.y,
      });
    };

    const handleUp = () => {
      draggingModal.current = false;
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  }, []);

  // Pretty-print shape name
  const formatShape = (shape: string | undefined) => {
    if (!shape) return 'rectangle';
    return shape.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()).trim();
  };

  // Modal positioning style
  const modalStyle: React.CSSProperties = position
    ? { position: 'fixed', left: position.x, top: position.y, zIndex: 9999 }
    : { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 9999 };

  return (
    <>
      {/* Backdrop — click to close, but doesn't block canvas interaction for dragged modal */}
      <div className="fixed inset-0 bg-black/30 z-[9998]" onClick={onClose} />

      {/* Modal */}
      <div
        style={modalStyle}
        className={`
          w-[560px] flex flex-col rounded-xl shadow-2xl border
          ${collapsed ? '' : 'max-h-[70vh]'}
          ${darkMode ? 'bg-dk-panel border-dk-border' : 'bg-white border-slate-200'}
        `}
      >
        {/* Header — draggable */}
        <div
          onMouseDown={handleHeaderMouseDown}
          className={`flex items-center gap-2 px-4 py-3 shrink-0 cursor-move select-none ${
            collapsed ? '' : 'border-b'
          } ${darkMode ? 'border-dk-border' : 'border-slate-200'}`}
        >
          <h2 className={`text-sm font-semibold flex-1 ${darkMode ? 'text-dk-text' : 'text-slate-800'}`}>
            Element Order
          </h2>
          <span className={`text-[10px] ${darkMode ? 'text-dk-muted' : 'text-slate-400'}`}>
            {nodes.length} elements
          </span>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className={`p-1 rounded transition-colors cursor-pointer ${
              darkMode ? 'hover:bg-dk-hover text-dk-muted' : 'hover:bg-slate-100 text-slate-400'
            }`}
            data-tooltip={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <Plus size={14} /> : <Minus size={14} />}
          </button>
          <button
            onClick={onClose}
            className={`p-1 rounded transition-colors cursor-pointer ${
              darkMode ? 'hover:bg-dk-hover text-dk-muted' : 'hover:bg-slate-100 text-slate-400'
            }`}
          >
            <X size={16} />
          </button>
        </div>

        {/* Collapsible body */}
        {!collapsed && (
          <>
            {/* Filter */}
            <div className={`flex items-center gap-2 px-4 py-2 border-b shrink-0 ${darkMode ? 'border-dk-border' : 'border-slate-200'}`}>
              <Search size={14} className={darkMode ? 'text-dk-muted' : 'text-slate-400'} />
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter by label, shape, color, notes..."
                className={`flex-1 text-xs bg-transparent outline-none placeholder:text-text-muted ${
                  darkMode ? 'text-dk-text' : 'text-slate-700'
                }`}
              />
              {filter && (
                <button
                  onClick={() => setFilter('')}
                  className={`p-0.5 rounded cursor-pointer ${darkMode ? 'text-dk-muted hover:text-dk-text' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Column labels */}
            <div className={`flex items-center gap-1 px-4 py-1 text-[10px] font-medium uppercase tracking-wider shrink-0 ${
              darkMode ? 'text-dk-faint' : 'text-slate-400'
            }`}>
              <span className="w-5" />
              <span className="w-3" />
              <span className="flex-1 pl-1">Element</span>
              <span className="w-16 text-center">Type</span>
              <span className="w-12 text-center">Order</span>
              <span className="w-6 text-center">Vis</span>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-1">
              {filteredNodes.length === 0 ? (
                <div className={`text-center py-8 text-xs ${darkMode ? 'text-dk-muted' : 'text-slate-400'}`}>
                  {filter ? 'No matching elements' : 'No elements on canvas'}
                </div>
              ) : (
                filteredNodes.map((node, displayIdx) => {
                  const d = node.data as FlowNodeData;
                  const isHidden = !!node.hidden;
                  const isDragOver = dragOverIdx === displayIdx;
                  return (
                    <div
                      key={node.id}
                      draggable={!filter}
                      onDragStart={() => handleDragStart(displayIdx)}
                      onDragOver={(e) => handleDragOver(e, displayIdx)}
                      onDrop={() => handleDrop(displayIdx)}
                      onDragEnd={handleDragEnd}
                      className={`
                        flex items-center gap-1 px-2 py-1.5 rounded-md text-xs
                        transition-colors group
                        ${isDragOver ? 'bg-primary/10 border border-primary/30' : 'border border-transparent'}
                        ${isHidden ? 'opacity-50' : ''}
                        ${darkMode ? 'hover:bg-dk-hover' : 'hover:bg-slate-50'}
                      `}
                    >
                      {/* Drag handle */}
                      <GripVertical
                        size={12}
                        className={`shrink-0 cursor-grab ${
                          filter ? 'opacity-20 cursor-not-allowed' : darkMode ? 'text-dk-faint' : 'text-slate-300'
                        }`}
                      />

                      {/* Color dot */}
                      <span
                        className="w-3 h-3 rounded-sm shrink-0 border"
                        style={{
                          backgroundColor: d.color || '#3b82f6',
                          borderColor: d.borderColor || d.color || '#3b82f6',
                        }}
                      />

                      {/* Label — click to select on canvas */}
                      <button
                        onClick={() => handleSelect(node.id)}
                        className={`flex-1 text-left truncate px-1 rounded transition-colors cursor-pointer ${
                          darkMode
                            ? 'text-dk-text hover:text-primary'
                            : 'text-slate-700 hover:text-primary'
                        }`}
                      >
                        {d.label || node.type || node.id}
                      </button>

                      {/* Shape / type badge */}
                      <span className={`w-16 text-center text-[10px] truncate shrink-0 ${
                        darkMode ? 'text-dk-faint' : 'text-slate-400'
                      }`}>
                        {formatShape(d.shape)}
                      </span>

                      {/* Move up / down */}
                      <div className="flex items-center shrink-0">
                        <button
                          onClick={() => handleMoveUp(displayIdx)}
                          disabled={displayIdx === 0 || !!filter}
                          className={`p-0.5 rounded transition-colors cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed ${
                            darkMode ? 'text-dk-muted hover:text-dk-text' : 'text-slate-400 hover:text-slate-700'
                          }`}
                          data-tooltip="Move forward"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          onClick={() => handleMoveDown(displayIdx)}
                          disabled={displayIdx === filteredNodes.length - 1 || !!filter}
                          className={`p-0.5 rounded transition-colors cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed ${
                            darkMode ? 'text-dk-muted hover:text-dk-text' : 'text-slate-400 hover:text-slate-700'
                          }`}
                          data-tooltip="Move backward"
                        >
                          <ChevronDown size={14} />
                        </button>
                      </div>

                      {/* Hide toggle */}
                      <button
                        onClick={() => handleToggleHidden(node.id)}
                        className={`w-6 flex items-center justify-center p-0.5 rounded transition-colors cursor-pointer shrink-0 ${
                          isHidden
                            ? 'text-slate-300 dark:text-dk-faint hover:text-text-muted'
                            : 'text-text-muted hover:text-primary'
                        }`}
                        data-tooltip={isHidden ? 'Show' : 'Hide'}
                      >
                        {isHidden ? <EyeClosed size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer hint */}
            <div className={`flex items-center justify-center gap-2 px-4 py-2 border-t text-[10px] shrink-0 ${
              darkMode ? 'border-dk-border text-dk-faint' : 'border-slate-200 text-slate-400'
            }`}>
              Drag rows to reorder · Click label to select · Top = front
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default React.memo(OrderModal);
