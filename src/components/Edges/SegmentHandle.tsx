// ---------------------------------------------------------------------------
// SegmentHandle.tsx -- Draggable handle on a straight segment between waypoints
// Allows dragging the "arm" between two elbows perpendicular to its direction.
// ---------------------------------------------------------------------------

import React, { useCallback, useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useFlowStore } from '../../store/flowStore';
import { CURSOR_OPEN_HAND } from '../../assets/cursors/cursors';

interface SegmentHandleProps {
  edgeId: string;
  /** Index of the first waypoint of this segment (segment goes from idx → idx+1) */
  startIdx: number;
  /** Index of the second waypoint of this segment */
  endIdx: number;
  /** Midpoint X of the segment */
  cx: number;
  /** Midpoint Y of the segment */
  cy: number;
  /** Whether the segment is horizontal (drag vertically) or vertical (drag horizontally) */
  orientation: 'horizontal' | 'vertical';
  /** Edge stroke color */
  color: string;
  /** Whether this is an auto-elbow that needs persisting first */
  isAutoElbow?: boolean;
  /** All auto-elbow positions (needed to persist on first drag) */
  autoElbows?: Array<{ x: number; y: number }>;
}

const SegmentHandle: React.FC<SegmentHandleProps> = ({
  edgeId,
  startIdx,
  endIdx,
  cx,
  cy,
  orientation,
  color,
  isAutoElbow,
  autoElbows,
}) => {
  const [hovered, setHovered] = useState(false);
  const { screenToFlowPosition } = useReactFlow();

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      e.preventDefault();

      // If auto-elbow, persist all auto-elbows as real waypoints first
      if (isAutoElbow && autoElbows) {
        useFlowStore.getState().updateEdgeData(edgeId, {
          waypoints: autoElbows.map(wp => ({ ...wp })),
        });
      }

      const startFlow = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      document.body.style.cursor = CURSOR_OPEN_HAND;

      const handleMouseMove = (ev: MouseEvent) => {
        const currentFlow = screenToFlowPosition({ x: ev.clientX, y: ev.clientY });
        const edge = useFlowStore.getState().edges.find((ed) => ed.id === edgeId);
        if (!edge?.data?.waypoints) return;
        const wps = [...(edge.data.waypoints as Array<{ x: number; y: number }>)];

        if (orientation === 'horizontal') {
          // Horizontal segment → drag vertically (move both waypoints' y)
          const dy = currentFlow.y - startFlow.y;
          if (wps[startIdx]) wps[startIdx] = { ...wps[startIdx], y: wps[startIdx].y + dy };
          if (wps[endIdx]) wps[endIdx] = { ...wps[endIdx], y: wps[endIdx].y + dy };
        } else {
          // Vertical segment → drag horizontally (move both waypoints' x)
          const dx = currentFlow.x - startFlow.x;
          if (wps[startIdx]) wps[startIdx] = { ...wps[startIdx], x: wps[startIdx].x + dx };
          if (wps[endIdx]) wps[endIdx] = { ...wps[endIdx], x: wps[endIdx].x + dx };
        }

        useFlowStore.getState().updateEdgeData(edgeId, { waypoints: wps });
        // Update start position for next delta
        startFlow.x = currentFlow.x;
        startFlow.y = currentFlow.y;
      };

      const handleMouseUp = () => {
        document.body.style.cursor = '';
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [edgeId, startIdx, endIdx, orientation, screenToFlowPosition, isAutoElbow, autoElbows],
  );

  // Wider hit area for horizontal vs vertical segments
  const isHoriz = orientation === 'horizontal';
  const hitW = isHoriz ? 24 : 10;
  const hitH = isHoriz ? 10 : 24;

  return (
    <rect
      x={cx - hitW / 2}
      y={cy - hitH / 2}
      width={hitW}
      height={hitH}
      rx={3}
      style={{
        fill: hovered ? color : 'transparent',
        stroke: hovered ? color : 'transparent',
        strokeWidth: 1,
        opacity: hovered ? 0.3 : 0,
        cursor: isHoriz ? 'ns-resize' : 'ew-resize',
        pointerEvents: 'all',
        transition: 'opacity 0.15s, fill 0.15s',
      }}
      onMouseDown={onMouseDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    />
  );
};

export default React.memo(SegmentHandle);
