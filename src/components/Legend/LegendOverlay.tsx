import React, { useCallback, useRef, useState, useEffect } from 'react';
import { useViewport } from '@xyflow/react';
import { useLegendStore, type LegendKind, type LegendItemKind } from '../../store/legendStore';
import { useStyleStore } from '../../store/styleStore';
import { generateId } from '../../utils/idGenerator';

// ---------------------------------------------------------------------------
// Visual swatch renderers per LegendItemKind
// ---------------------------------------------------------------------------

interface SwatchProps {
  color: string;
  kind: LegendItemKind;
  borderStyle?: 'solid' | 'dashed' | 'dotted';
  darkMode: boolean;
}

/** Renders the appropriate visual indicator for each legend item kind */
const LegendSwatch: React.FC<SwatchProps> = ({ color, kind, borderStyle, darkMode }) => {
  const dim = 14;
  const border = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

  switch (kind) {
    // Filled rectangle — standard node color
    case 'fill':
    case 'lane':
      return (
        <div
          style={{
            width: dim,
            height: dim,
            backgroundColor: color,
            borderRadius: 2,
            flexShrink: 0,
            border: `1px solid ${border}`,
          }}
        />
      );

    // Outlined rectangle with border style
    case 'border':
      return (
        <div
          style={{
            width: dim,
            height: dim,
            backgroundColor: 'transparent',
            borderRadius: 2,
            flexShrink: 0,
            border: `2px ${borderStyle || 'solid'} ${color}`,
          }}
        />
      );

    // Circular puck (status indicator)
    case 'puck':
      return (
        <div
          style={{
            width: dim,
            height: dim,
            backgroundColor: color,
            borderRadius: '50%',
            flexShrink: 0,
            border: `1px solid ${border}`,
          }}
        />
      );

    // Horizontal line (edge / connector)
    case 'edge':
      return (
        <svg width={dim + 4} height={dim} viewBox={`0 0 ${dim + 4} ${dim}`} style={{ flexShrink: 0 }}>
          <line
            x1={0}
            y1={dim / 2}
            x2={dim + 4}
            y2={dim / 2}
            stroke={color}
            strokeWidth={2.5}
            strokeLinecap="round"
          />
          {/* arrowhead */}
          <polygon
            points={`${dim + 4},${dim / 2} ${dim - 2},${dim / 2 - 3} ${dim - 2},${dim / 2 + 3}`}
            fill={color}
          />
        </svg>
      );

    default:
      return (
        <div
          style={{
            width: dim,
            height: dim,
            backgroundColor: color,
            borderRadius: 2,
            flexShrink: 0,
            border: `1px solid ${border}`,
          }}
        />
      );
  }
};

// ---------------------------------------------------------------------------
// Right-click context menu for legend items / title
// ---------------------------------------------------------------------------

interface LegendContextMenuProps {
  x: number;
  y: number;
  darkMode: boolean;
  which: LegendKind;
  target:
    | { type: 'title' }
    | { type: 'item'; itemId: string }
    | { type: 'canvas' };
  onClose: () => void;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const LegendContextMenu: React.FC<LegendContextMenuProps> = ({
  x, y, darkMode, which, target, onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const removeItem = useLegendStore((s) => s.removeItem);
  const addItem = useLegendStore((s) => s.addItem);
  const setVisible = useLegendStore((s) => s.setVisible);
  const generateNodeLegend = useLegendStore((s) => s.generateNodeLegend);
  const resetLegend = useLegendStore((s) => s.resetLegend);
  const legend = useLegendStore((s) => which === 'node' ? s.nodeLegend : s.swimlaneLegend);
  const itemCount = legend.items.length;

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
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

  const menuW = 180;
  const menuH = 200;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const adjustedX = x + menuW > vw ? vw - menuW - 8 : x;
  const adjustedY = y + menuH > vh ? vh - menuH - 8 : y;

  const btnClass = `flex items-center gap-2 w-full px-3 py-1.5 text-left text-sm rounded transition-colors duration-75 cursor-pointer ${
    darkMode ? 'hover:bg-dk-hover text-dk-text' : 'hover:bg-slate-100 text-slate-700'
  }`;
  const dividerClass = `my-1 h-px ${darkMode ? 'bg-dk-hover' : 'bg-slate-200'}`;

  return (
    <div
      ref={menuRef}
      className={`fixed min-w-[170px] rounded-lg shadow-xl border p-1 ${
        darkMode ? 'bg-dk-panel border-dk-border' : 'bg-white border-slate-200'
      }`}
      style={{ left: adjustedX, top: adjustedY, zIndex: 10000 }}
    >
      {target.type === 'item' && (
        <>
          <button className={btnClass} onClick={() => {
            window.dispatchEvent(new CustomEvent(`legend-edit-item-${which}`, { detail: target.itemId }));
            onClose();
          }}>
            Edit Label
          </button>
          <button className={btnClass} onClick={() => {
            removeItem(which, target.itemId);
            onClose();
          }}>
            Remove Item
          </button>
          <div className={dividerClass} />
        </>
      )}
      {target.type === 'title' && (
        <>
          <button className={btnClass} onClick={() => {
            window.dispatchEvent(new CustomEvent(`legend-edit-title-${which}`));
            onClose();
          }}>
            Edit Title
          </button>
          <div className={dividerClass} />
        </>
      )}
      <button className={btnClass} onClick={() => {
        addItem(which, {
          id: generateId('legend'),
          label: `Item ${itemCount + 1}`,
          color: COLORS[itemCount % COLORS.length],
          order: itemCount,
        });
        onClose();
      }}>
        Add Item
      </button>
      {which === 'node' && (
        <button className={btnClass} onClick={() => {
          generateNodeLegend();
          onClose();
        }}>
          Auto-Generate
        </button>
      )}
      <div className={dividerClass} />
      <button className={btnClass} onClick={() => {
        setVisible(which, false);
        onClose();
      }}>
        Hide Legend
      </button>
      <button className={`${btnClass} text-red-500`} onClick={() => {
        resetLegend(which);
        onClose();
      }}>
        Clear Legend
      </button>
    </div>
  );
};

// ---------------------------------------------------------------------------
// LegendOverlay
// ---------------------------------------------------------------------------

interface LegendOverlayProps {
  which: LegendKind;
}

const LegendOverlay: React.FC<LegendOverlayProps> = ({ which }) => {
  const config = useLegendStore((s) => which === 'node' ? s.nodeLegend : s.swimlaneLegend);
  const setPosition = useLegendStore((s) => s.setPosition);
  const setTitle = useLegendStore((s) => s.setTitle);
  const updateItem = useLegendStore((s) => s.updateItem);
  const darkMode = useStyleStore((s) => s.darkMode);
  const viewport = useViewport();
  const dragRef = useRef<{ startX: number; startY: number; posX: number; posY: number } | null>(null);

  // Context menu state
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; target: LegendContextMenuProps['target'] } | null>(null);

  // Inline editing state
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const itemInputRef = useRef<HTMLInputElement>(null);

  // Listen for custom edit events scoped to this legend kind
  useEffect(() => {
    const handleEditTitle = () => setEditingTitle(true);
    const handleEditItem = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setEditingItemId(detail);
    };
    window.addEventListener(`legend-edit-title-${which}`, handleEditTitle);
    window.addEventListener(`legend-edit-item-${which}`, handleEditItem);
    return () => {
      window.removeEventListener(`legend-edit-title-${which}`, handleEditTitle);
      window.removeEventListener(`legend-edit-item-${which}`, handleEditItem);
    };
  }, [which]);

  // Focus inputs when editing starts
  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTitle]);

  useEffect(() => {
    if (editingItemId && itemInputRef.current) {
      itemInputRef.current.focus();
      itemInputRef.current.select();
    }
  }, [editingItemId]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      e.preventDefault();
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        posX: config.position.x,
        posY: config.position.y,
      };

      const onMouseMove = (moveEvent: MouseEvent) => {
        if (!dragRef.current) return;
        const dx = (moveEvent.clientX - dragRef.current.startX) / viewport.zoom;
        const dy = (moveEvent.clientY - dragRef.current.startY) / viewport.zoom;
        setPosition(which, {
          x: dragRef.current.posX + dx,
          y: dragRef.current.posY + dy,
        });
      };

      const onMouseUp = () => {
        dragRef.current = null;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        document.body.style.cursor = '';
      };

      document.body.style.cursor = 'grabbing';
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },
    [config.position, viewport.zoom, setPosition, which],
  );

  const handleContextMenu = useCallback((e: React.MouseEvent, target: LegendContextMenuProps['target']) => {
    e.preventDefault();
    e.stopPropagation();
    setCtxMenu({ x: e.clientX, y: e.clientY, target });
  }, []);

  const visibleItems = config.items.filter((i) => !i.hidden);
  if (!config.visible || visibleItems.length === 0) return null;

  const { style } = config;
  const bgColor = darkMode
    ? (style.bgColor === '#ffffff' ? '#253345' : style.bgColor)
    : style.bgColor;
  const borderColor = darkMode
    ? (style.borderColor === '#e2e8f0' ? '#3a4a5c' : style.borderColor)
    : style.borderColor;
  const textColor = darkMode ? '#c8d1dc' : '#0f172a';
  const titleColor = darkMode ? '#8494a7' : '#64748b';

  return (
    <>
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{ zIndex: 1 }}
      >
        <div
          style={{
            position: 'absolute',
            transformOrigin: '0 0',
            transform: `translate(${viewport.x + config.position.x * viewport.zoom}px, ${viewport.y + config.position.y * viewport.zoom}px) scale(${viewport.zoom})`,
          }}
        >
          <div
            onContextMenu={(e) => handleContextMenu(e, { type: 'canvas' })}
            style={{
              width: style.width,
              backgroundColor: bgColor,
              border: `${style.borderWidth}px solid ${borderColor}`,
              borderRadius: 6,
              opacity: style.opacity,
              boxShadow: darkMode
                ? '0 2px 8px rgba(0,0,0,0.3)'
                : '0 2px 8px rgba(0,0,0,0.08)',
              pointerEvents: 'auto',
            }}
          >
            {/* Title bar (draggable) */}
            <div
              onMouseDown={handleMouseDown}
              onDoubleClick={() => setEditingTitle(true)}
              onContextMenu={(e) => { e.stopPropagation(); handleContextMenu(e, { type: 'title' }); }}
              style={{
                padding: '6px 10px',
                fontSize: style.fontSize + 1,
                fontWeight: 600,
                color: titleColor,
                borderBottom: `1px solid ${borderColor}`,
                cursor: editingTitle ? 'text' : 'grab',
                userSelect: 'none',
              }}
            >
              {editingTitle ? (
                <input
                  ref={titleInputRef}
                  defaultValue={config.title}
                  onBlur={(e) => {
                    setTitle(which, e.target.value || config.title);
                    setEditingTitle(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setTitle(which, (e.target as HTMLInputElement).value || config.title);
                      setEditingTitle(false);
                    }
                    if (e.key === 'Escape') setEditingTitle(false);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  style={{
                    width: '100%',
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    font: 'inherit',
                    color: 'inherit',
                    padding: 0,
                    margin: 0,
                  }}
                />
              ) : (
                config.title
              )}
            </div>

            {/* Items */}
            <div style={{ padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[...visibleItems]
                .sort((a, b) => a.order - b.order)
                .map((item) => (
                  <div
                    key={item.id}
                    onDoubleClick={() => setEditingItemId(item.id)}
                    onContextMenu={(e) => { e.stopPropagation(); handleContextMenu(e, { type: 'item', itemId: item.id }); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      cursor: 'default',
                    }}
                  >
                    <LegendSwatch
                      color={item.color}
                      kind={item.kind || 'fill'}
                      borderStyle={item.borderStyle}
                      darkMode={darkMode}
                    />
                    {editingItemId === item.id ? (
                      <input
                        ref={itemInputRef}
                        defaultValue={item.label}
                        onBlur={(e) => {
                          updateItem(which, item.id, { label: e.target.value || item.label });
                          setEditingItemId(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            updateItem(which, item.id, { label: (e.target as HTMLInputElement).value || item.label });
                            setEditingItemId(null);
                          }
                          if (e.key === 'Escape') setEditingItemId(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        style={{
                          flex: 1,
                          minWidth: 0,
                          border: 'none',
                          outline: 'none',
                          background: 'transparent',
                          fontSize: style.fontSize,
                          color: textColor,
                          padding: 0,
                          margin: 0,
                        }}
                      />
                    ) : (
                      <span
                        style={{
                          fontSize: style.fontSize,
                          color: textColor,
                          lineHeight: 1.3,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.label}
                      </span>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Context menu portal */}
      {ctxMenu && (
        <LegendContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          darkMode={darkMode}
          which={which}
          target={ctxMenu.target}
          onClose={() => setCtxMenu(null)}
        />
      )}
    </>
  );
};

export default React.memo(LegendOverlay);
