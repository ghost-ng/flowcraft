// ---------------------------------------------------------------------------
// WaypointHandle.tsx -- Draggable circle at a waypoint position on an edge
// ---------------------------------------------------------------------------

import React, { useCallback, useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useFlowStore } from '../../store/flowStore';
import { CURSOR_OPEN_HAND, CURSOR_SELECT } from '../../assets/cursors/cursors';

interface WaypointHandleProps {
  /** Edge ID this waypoint belongs to */
  edgeId: string;
  /** Index of this waypoint in the waypoints array */
  index: number;
  /** Center X in flow coords */
  cx: number;
  /** Center Y in flow coords */
  cy: number;
  /** Edge stroke color */
  color: string;
  /** Whether this is an auto-computed elbow (not yet persisted) */
  isAutoElbow?: boolean;
  /** All auto-elbow positions (needed to persist on first drag) */
  autoElbows?: Array<{ x: number; y: number }>;
}

const HANDLE_RADIUS = 5;

const WaypointHandle: React.FC<WaypointHandleProps> = ({
  edgeId,
  index,
  cx,
  cy,
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

      // If this is an auto-elbow, persist all auto-elbows as real waypoints first
      if (isAutoElbow && autoElbows) {
        useFlowStore.getState().updateEdgeData(edgeId, {
          waypoints: autoElbows.map(wp => ({ ...wp })),
        });
      }

      const startClientX = e.clientX;
      const startClientY = e.clientY;
      const startFlow = screenToFlowPosition({ x: startClientX, y: startClientY });

      // Apply grab cursor to body during drag
      document.body.style.cursor = CURSOR_OPEN_HAND;

      const handleMouseMove = (ev: MouseEvent) => {
        const currentFlow = screenToFlowPosition({ x: ev.clientX, y: ev.clientY });
        const dx = currentFlow.x - startFlow.x;
        const dy = currentFlow.y - startFlow.y;

        const edge = useFlowStore.getState().edges.find((ed) => ed.id === edgeId);
        if (!edge?.data?.waypoints) return;
        const wps = [...(edge.data.waypoints as Array<{ x: number; y: number }>)];
        wps[index] = { x: cx + dx, y: cy + dy };
        useFlowStore.getState().updateEdgeData(edgeId, { waypoints: wps });
      };

      const handleMouseUp = () => {
        document.body.style.cursor = '';
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [edgeId, index, cx, cy, screenToFlowPosition, isAutoElbow, autoElbows],
  );

  const onDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      if (isAutoElbow && autoElbows) {
        // Persist auto-elbows minus the clicked one
        const wps = autoElbows.filter((_, i) => i !== index);
        useFlowStore.getState().updateEdgeData(edgeId, {
          waypoints: wps.length > 0 ? wps : undefined,
        });
        return;
      }

      // Remove this waypoint
      const edge = useFlowStore.getState().edges.find((ed) => ed.id === edgeId);
      if (!edge?.data?.waypoints) return;
      const wps = (edge.data.waypoints as Array<{ x: number; y: number }>).filter(
        (_, i) => i !== index,
      );
      useFlowStore.getState().updateEdgeData(edgeId, {
        waypoints: wps.length > 0 ? wps : undefined,
      });
    },
    [edgeId, index, isAutoElbow, autoElbows],
  );

  return (
    <circle
      cx={cx}
      cy={cy}
      r={HANDLE_RADIUS}
      style={{
        fill: 'white',
        stroke: color,
        strokeWidth: 1.5,
        opacity: hovered ? 1 : 0.7,
        cursor: CURSOR_SELECT,
        transition: 'opacity 0.15s',
        pointerEvents: 'all',
      }}
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    />
  );
};

export default React.memo(WaypointHandle);
