import React, { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { GripVertical, Eye, Palette, Pencil, Trash2, EyeClosed, ChevronRight, Check } from 'lucide-react';
import { useSwimlaneStore, type SwimlaneOrientation } from '../../store/swimlaneStore';

// ---------------------------------------------------------------------------
// Color palette for quick lane color changes
// ---------------------------------------------------------------------------

const LANE_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
  '#14b8a6', '#a855f7',
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LaneHeaderProps {
  laneId: string;
  label: string;
  color: string;
  orientation: SwimlaneOrientation;
  /** Position offset in pixels (x for vertical, y for horizontal) */
  offset: number;
  /** Size in pixels (width for vertical header, height for horizontal header) */
  size: number;
  darkMode: boolean;
  /** Font size for label text (default 10) */
  fontSize?: number;
  /** Label rotation in degrees (-90 to 90, step 15). 0 = default for lane type */
  rotation?: number;
  /** Whether the label is visible (default true) */
  showLabel?: boolean;
  /** Whether the color indicator is visible (default true) */
  showColor?: boolean;
}

// ---------------------------------------------------------------------------
// LaneContextMenu
// ---------------------------------------------------------------------------

interface LaneContextMenuProps {
  x: number;
  y: number;
  laneId: string;
  orientation: SwimlaneOrientation;
  darkMode: boolean;
  onClose: () => void;
  onStartEdit: () => void;
}

const LaneContextMenu: React.FC<LaneContextMenuProps> = ({
  x, y, laneId, orientation, darkMode, onClose, onStartEdit,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const updateLane = useSwimlaneStore((s) => s.updateLane);
  const removeLane = useSwimlaneStore((s) => s.removeLane);
  const lane = useSwimlaneStore((s) => {
    const lanes = orientation === 'horizontal' ? s.config.horizontal : s.config.vertical;
    return lanes.find((l) => l.id === laneId);
  });
  const [showColors, setShowColors] = useState(false);
  const [showVisibility, setShowVisibility] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  if (!lane) return null;

  const labelVisible = lane.showLabel ?? true;
  const colorVisible = lane.showColor ?? true;
  const laneHidden = lane.hidden ?? false;

  const menuW = 190;
  const menuH = 260;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const adjustedX = x + menuW > vw ? vw - menuW - 8 : x;
  const adjustedY = y + menuH > vh ? vh - menuH - 8 : y;

  const btnClass = `flex items-center gap-2 w-full px-3 py-1.5 text-left text-sm rounded transition-colors duration-75 cursor-pointer ${
    darkMode ? 'hover:bg-dk-hover text-dk-text' : 'hover:bg-slate-100 text-slate-700'
  }`;
  const dividerClass = `my-1 h-px ${darkMode ? 'bg-dk-hover' : 'bg-slate-200'}`;

  return (
    <>
    {/* Invisible backdrop to capture outside clicks */}
    <div className="fixed inset-0" style={{ zIndex: 9999 }} onMouseDown={onClose} />
    <div
      ref={menuRef}
      className={`fixed min-w-[180px] rounded-lg shadow-xl border p-1 ${
        darkMode ? 'bg-dk-panel border-dk-border' : 'bg-white border-slate-200'
      }`}
      style={{ left: adjustedX, top: adjustedY, zIndex: 10000 }}
    >
      {/* Lane label at top */}
      <div className={`px-3 py-1.5 text-xs font-semibold ${darkMode ? 'text-dk-muted' : 'text-slate-400'} uppercase tracking-wider`}>
        {lane.label}
      </div>
      <div className={dividerClass} />

      {/* Rename */}
      <button className={btnClass} onClick={() => { onStartEdit(); onClose(); }}>
        <Pencil size={14} />
        Rename Lane
      </button>

      {/* Show submenu — toggle visibility of label and color */}
      <button className={btnClass} onClick={() => setShowVisibility(!showVisibility)}>
        <Eye size={14} />
        <span className="flex-1">Show</span>
        <ChevronRight size={12} className={`transition-transform ${showVisibility ? 'rotate-90' : ''}`} />
      </button>
      {showVisibility && (
        <div className="pl-3">
          <button className={btnClass} onClick={() => {
            updateLane(orientation, laneId, { showLabel: !labelVisible });
          }}>
            {labelVisible ? <Check size={14} /> : <span className="w-[14px]" />}
            Label
          </button>
          <button className={btnClass} onClick={() => {
            updateLane(orientation, laneId, { showColor: !colorVisible });
          }}>
            {colorVisible ? <Check size={14} /> : <span className="w-[14px]" />}
            Color
          </button>
        </div>
      )}

      {/* Toggle lane visibility (hide lane + contents) */}
      <button className={btnClass} onClick={() => {
        updateLane(orientation, laneId, { hidden: !laneHidden });
        onClose();
      }}>
        {laneHidden ? <Eye size={14} /> : <EyeClosed size={14} />}
        {laneHidden ? 'Show Lane & Contents' : 'Hide Lane & Contents'}
      </button>

      <div className={dividerClass} />

      {/* Color picker */}
      <button className={btnClass} onClick={() => setShowColors(!showColors)}>
        <Palette size={14} />
        Change Color
      </button>
      {showColors && (
        <div className="px-3 py-1.5 flex flex-wrap gap-1">
          {LANE_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => {
                updateLane(orientation, laneId, { color: c });
                onClose();
              }}
              className="w-5 h-5 rounded border border-slate-200 cursor-pointer transition-transform hover:scale-110"
              style={{ backgroundColor: c, outline: c === lane.color ? '2px solid #3b82f6' : 'none', outlineOffset: 1 }}
            />
          ))}
          <input
            type="color"
            value={lane.color}
            onChange={(e) => {
              updateLane(orientation, laneId, { color: e.target.value });
            }}
            className="w-5 h-5 rounded border border-slate-200 cursor-pointer"
            title="Custom color"
          />
        </div>
      )}

      <div className={dividerClass} />

      {/* Remove */}
      <button className={`${btnClass} text-red-500`} onClick={() => {
        removeLane(orientation, laneId);
        onClose();
      }}>
        <Trash2 size={14} />
        Remove Lane
      </button>
    </div>
    </>
  );
};

// ---------------------------------------------------------------------------
// LaneHeader
// ---------------------------------------------------------------------------

const LaneHeader: React.FC<LaneHeaderProps> = ({
  laneId,
  label,
  color,
  orientation,
  offset,
  size,
  darkMode,
  fontSize: fontSizeProp,
  rotation: rotationProp,
  showLabel: showLabelProp,
  showColor: showColorProp,
}) => {
  const labelVisible = showLabelProp ?? true;
  const colorVisible = showColorProp ?? true;
  const fs = fontSizeProp ?? 10;
  const rotDeg = rotationProp ?? 0;
  const isHorizontal = orientation === 'horizontal';

  // For horizontal lanes: rotation=-90 = vertical text via writingMode.
  // rotation=0 (default) = horizontal text. Other angles use CSS rotate.
  const useWritingMode = isHorizontal && rotDeg === -90;
  const rotateAngle = isHorizontal
    ? (rotDeg === -90 ? 0 : rotDeg)  // -90 uses writingMode; others use CSS rotate
    : rotDeg;                          // vertical lanes: apply angle directly

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(label);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const updateLane = useSwimlaneStore((s) => s.updateLane);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Sync editValue when label prop changes externally
  useEffect(() => {
    if (!isEditing) {
      setEditValue(label);
    }
  }, [label, isEditing]);

  const handleDoubleClick = useCallback(() => {
    setEditValue(label);
    setIsEditing(true);
  }, [label]);

  const commitEdit = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== label) {
      updateLane(orientation, laneId, { label: trimmed });
    } else {
      setEditValue(label);
    }
    setIsEditing(false);
  }, [editValue, label, orientation, laneId, updateLane]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        commitEdit();
      } else if (e.key === 'Escape') {
        setEditValue(label);
        setIsEditing(false);
      }
    },
    [commitEdit, label],
  );

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left-click initiates drag
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startOffset = useSwimlaneStore.getState().containerOffset;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      useSwimlaneStore.getState().setContainerOffset({
        x: startOffset.x + dx,
        y: startOffset.y + dy,
      });
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCtxMenu({ x: e.clientX, y: e.clientY });
  }, []);

  // For horizontal lanes: header on the left side, positioned vertically
  // For vertical lanes: header on top, positioned horizontally
  // Widen the header when label is rotated so angled text has room
  const rotBuffer = Math.abs(rotateAngle) > 0 ? Math.ceil(Math.abs(rotateAngle) * 0.3) : 0;

  const style: React.CSSProperties = isHorizontal
    ? {
        position: 'absolute',
        left: 0,
        top: offset,
        width: 48 + rotBuffer,
        height: size,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        borderRight: `2px solid ${color}`,
        backgroundColor: darkMode ? 'rgba(37,51,69,0.9)' : 'rgba(255,255,255,0.9)',
        zIndex: 5,
        overflow: 'visible',
        padding: '4px 2px',
        pointerEvents: 'auto',
      }
    : {
        position: 'absolute',
        left: offset,
        top: 0,
        width: size,
        height: 32 + rotBuffer,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottom: `2px solid ${color}`,
        backgroundColor: darkMode ? 'rgba(37,51,69,0.9)' : 'rgba(255,255,255,0.9)',
        zIndex: 5,
        overflow: 'visible',
        padding: '2px 4px',
        pointerEvents: 'auto',
      };

  const textColor = darkMode ? '#c8d1dc' : '#0f172a';

  // Text styling depending on writing mode vs rotation
  const textStyle: React.CSSProperties = useWritingMode
    ? {
        fontSize: fs,
        fontWeight: 600,
        color: textColor,
        writingMode: 'vertical-rl',
        textOrientation: 'mixed',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'normal',
        maxWidth: 32,
        maxHeight: size - 20,
        lineHeight: 1.2,
        textAlign: 'center',
        userSelect: 'none' as const,
      }
    : {
        fontSize: fs,
        fontWeight: 600,
        color: textColor,
        transform: rotateAngle !== 0 ? `rotate(${rotateAngle}deg)` : undefined,
        transformOrigin: 'center center',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        // Reduce maxWidth when rotated so the label stays within the header bounds
        maxWidth: isHorizontal
          ? Math.max(20, size - 10 - Math.abs(rotateAngle) * 0.4)
          : Math.max(40, size - 50 - Math.abs(rotateAngle) * 0.5),
        userSelect: 'none' as const,
        lineHeight: 1.2,
        padding: rotateAngle !== 0 ? '2px 4px' : undefined,
      };

  const editStyle: React.CSSProperties = useWritingMode
    ? {
        width: 36,
        fontSize: fs,
        fontWeight: 600,
        textAlign: 'center' as const,
        color: textColor,
        backgroundColor: 'transparent',
        border: `1px solid ${color}`,
        borderRadius: 2,
        outline: 'none',
        padding: '1px 2px',
        writingMode: 'vertical-rl',
        textOrientation: 'mixed',
      }
    : {
        width: isHorizontal ? 36 : Math.max(60, size - 60),
        fontSize: fs,
        fontWeight: 600,
        textAlign: 'center' as const,
        color: textColor,
        backgroundColor: 'transparent',
        border: `1px solid ${color}`,
        borderRadius: 2,
        outline: 'none',
        padding: '1px 2px',
        transform: rotateAngle !== 0 ? `rotate(${rotateAngle}deg)` : undefined,
      };

  return (
    <>
      <div
        style={style}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        title="Double-click to edit · Right-click for options"
        data-lane-header={laneId}
      >
        {/* Color indicator */}
        {colorVisible && (
          <div
            style={{
              width: isHorizontal ? 24 : 8,
              height: isHorizontal ? 8 : 20,
              backgroundColor: color,
              borderRadius: 2,
              flexShrink: 0,
              marginBottom: isHorizontal ? 4 : 0,
              marginRight: isHorizontal ? 0 : 6,
            }}
          />
        )}

        {/* Drag handle */}
        <GripVertical
          size={12}
          onMouseDown={handleDragStart}
          onContextMenu={handleContextMenu}
          style={{
            color: darkMode ? '#7e8d9f' : '#94a3b8',
            flexShrink: 0,
            marginBottom: isHorizontal ? 2 : 0,
            marginRight: isHorizontal ? 0 : 4,
            transform: isHorizontal ? 'rotate(90deg)' : undefined,
            pointerEvents: 'auto',
            cursor: 'pointer',
          }}
        />

        {/* Label or edit input */}
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleKeyDown}
            style={editStyle}
          />
        ) : labelVisible ? (
          <span style={textStyle}>
            {label}
          </span>
        ) : null}
      </div>

      {/* Context menu — portaled to document.body to escape transformed parent */}
      {ctxMenu && createPortal(
        <LaneContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          laneId={laneId}
          orientation={orientation}
          darkMode={darkMode}
          onClose={() => setCtxMenu(null)}
          onStartEdit={() => {
            setEditValue(label);
            setIsEditing(true);
          }}
        />,
        document.body,
      )}
    </>
  );
};

export default React.memo(LaneHeader);
