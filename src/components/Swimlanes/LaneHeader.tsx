import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GripVertical } from 'lucide-react';
import { useSwimlaneStore, type SwimlaneOrientation } from '../../store/swimlaneStore';

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
}

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
}) => {
  const fs = fontSizeProp ?? 10;
  const rotDeg = rotationProp ?? 0;
  const isHorizontal = orientation === 'horizontal';

  // For horizontal lanes: default (0) = vertical text via writingMode.
  // Any non-zero rotation = use CSS transform: rotate() instead.
  const useWritingMode = isHorizontal && rotDeg === 0;
  const rotateAngle = isHorizontal
    ? (rotDeg === 0 ? 0 : rotDeg)  // non-zero: apply the angle directly
    : rotDeg;                        // vertical lanes: apply angle directly

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(label);
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

  // For horizontal lanes: header on the left side, positioned vertically
  // For vertical lanes: header on top, positioned horizontally
  const style: React.CSSProperties = isHorizontal
    ? {
        position: 'absolute',
        left: 0,
        top: offset,
        width: 48,
        height: size,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        borderRight: `2px solid ${color}`,
        backgroundColor: darkMode ? 'rgba(30,41,59,0.9)' : 'rgba(255,255,255,0.9)',
        zIndex: 5,
        overflow: 'hidden',
      }
    : {
        position: 'absolute',
        left: offset,
        top: 0,
        width: size,
        height: 32,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottom: `2px solid ${color}`,
        backgroundColor: darkMode ? 'rgba(30,41,59,0.9)' : 'rgba(255,255,255,0.9)',
        zIndex: 5,
        overflow: 'hidden',
      };

  const textColor = darkMode ? '#f1f5f9' : '#0f172a';

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
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        maxWidth: isHorizontal ? size - 10 : size - 50,
        userSelect: 'none' as const,
        lineHeight: 1.2,
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
    <div style={style} onDoubleClick={handleDoubleClick} title="Double-click to edit">
      {/* Color indicator */}
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

      {/* Drag handle */}
      <GripVertical
        size={12}
        onMouseDown={handleDragStart}
        style={{
          color: darkMode ? '#64748b' : '#94a3b8',
          flexShrink: 0,
          marginBottom: isHorizontal ? 2 : 0,
          marginRight: isHorizontal ? 0 : 4,
          transform: isHorizontal ? 'rotate(90deg)' : undefined,
          pointerEvents: 'auto',
          cursor: 'grab',
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
      ) : (
        <span style={textStyle}>
          {label}
        </span>
      )}
    </div>
  );
};

export default React.memo(LaneHeader);
