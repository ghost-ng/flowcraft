// ---------------------------------------------------------------------------
// useAddWaypoint.ts -- Hook to insert a waypoint on double-click
// ---------------------------------------------------------------------------

import { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useFlowStore } from '../../store/flowStore';

/**
 * Returns a double-click handler that inserts a waypoint at the click position.
 * The waypoint is inserted at the correct index based on proximity to existing segments.
 */
export function useAddWaypoint(
  edgeId: string,
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
) {
  const { screenToFlowPosition } = useReactFlow();

  return useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      const flowPos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const edge = useFlowStore.getState().edges.find((ed) => ed.id === edgeId);
      const existing = (edge?.data?.waypoints as Array<{ x: number; y: number }>) ?? [];

      // Build the full point list: source → waypoints → target
      const allPoints = [
        { x: sourceX, y: sourceY },
        ...existing,
        { x: targetX, y: targetY },
      ];

      // Find which segment the click is closest to and insert there
      let bestIdx = existing.length; // default: insert before target
      let bestDist = Infinity;

      for (let i = 0; i < allPoints.length - 1; i++) {
        const dist = pointToSegmentDist(
          flowPos.x, flowPos.y,
          allPoints[i].x, allPoints[i].y,
          allPoints[i + 1].x, allPoints[i + 1].y,
        );
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = i; // insert after allPoints[i], which is index i in waypoints array
        }
      }

      const newWaypoints = [...existing];
      // bestIdx 0 means between source and first waypoint → insert at waypoints[0]
      // bestIdx 1 means between waypoints[0] and waypoints[1] → insert at waypoints[1]
      newWaypoints.splice(bestIdx, 0, { x: flowPos.x, y: flowPos.y });

      useFlowStore.getState().updateEdgeData(edgeId, { waypoints: newWaypoints });
    },
    [edgeId, sourceX, sourceY, targetX, targetY, screenToFlowPosition],
  );
}

/** Distance from point (px,py) to line segment (ax,ay)-(bx,by) */
function pointToSegmentDist(
  px: number, py: number,
  ax: number, ay: number,
  bx: number, by: number,
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - ax, py - ay);
  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
