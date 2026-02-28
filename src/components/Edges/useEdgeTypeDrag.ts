// ---------------------------------------------------------------------------
// useEdgeTypeDrag — drag on an edge body to cycle through connector types
// ---------------------------------------------------------------------------
//
// When the user mousedowns on the interaction path (not near endpoints) and
// drags perpendicular to the edge, the connector type cycles through:
//   straight → bezier → smoothstep → step → (wrap)
//
// A 6px dead zone prevents accidental changes on regular clicks.
// ---------------------------------------------------------------------------

import { useCallback, useRef } from 'react';
import { useFlowStore } from '../../store/flowStore';

// The 4 standard edge types in cycle order
const EDGE_TYPES = ['straight', 'bezier', 'smoothstep', 'step'] as const;

// Pixels of perpendicular drag to advance one type
const DRAG_THRESHOLD = 40;

// Dead zone — must drag at least this far before any type change
const DEAD_ZONE = 6;

/**
 * Returns an onMouseDown handler for an edge's interaction path.
 * Attach it to the invisible wider `<path>` element.
 *
 * @param edgeId   - The edge ID to update
 * @param sourceX  - Source node X (used to compute edge direction)
 * @param sourceY  - Source node Y
 * @param targetX  - Target node X
 * @param targetY  - Target node Y
 */
export function useEdgeTypeDrag(
  edgeId: string,
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
) {
  const dragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const startTypeIndex = useRef(0);

  const onInteractionMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Only left button, and skip if ctrl/shift held (selection gestures)
      if (e.button !== 0 || e.ctrlKey || e.shiftKey || e.metaKey) return;

      // Skip if near source/target endpoints (within 24px)
      const svgEl = (e.target as SVGElement).closest('svg');
      if (!svgEl) return;
      const pt = svgEl.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const ctm = svgEl.getScreenCTM()?.inverse();
      if (!ctm) return;
      const svgPt = pt.matrixTransform(ctm);

      const distToSource = Math.hypot(svgPt.x - sourceX, svgPt.y - sourceY);
      const distToTarget = Math.hypot(svgPt.x - targetX, svgPt.y - targetY);
      if (distToSource < 24 || distToTarget < 24) return;

      // Determine current edge type
      const edge = useFlowStore.getState().edges.find((ed) => ed.id === edgeId);
      const currentType = edge?.type ?? 'smoothstep';
      const idx = EDGE_TYPES.indexOf(currentType as typeof EDGE_TYPES[number]);
      startTypeIndex.current = idx >= 0 ? idx : 0;

      dragging.current = true;
      startPos.current = { x: e.clientX, y: e.clientY };

      const handleMouseMove = (ev: MouseEvent) => {
        if (!dragging.current) return;

        const dx = ev.clientX - startPos.current.x;
        const dy = ev.clientY - startPos.current.y;

        // Compute perpendicular distance to the edge direction
        const edgeDx = targetX - sourceX;
        const edgeDy = targetY - sourceY;
        const edgeLen = Math.hypot(edgeDx, edgeDy) || 1;

        // Perpendicular component of the drag vector (signed)
        const perpDist = (dx * (-edgeDy) + dy * edgeDx) / edgeLen;

        // Apply dead zone
        const effective = Math.abs(perpDist) < DEAD_ZONE ? 0 : perpDist;

        // Calculate how many steps to advance
        const steps = Math.floor(Math.abs(effective) / DRAG_THRESHOLD);
        const direction = effective >= 0 ? 1 : -1;
        const newIdx = ((startTypeIndex.current + direction * steps) % EDGE_TYPES.length + EDGE_TYPES.length) % EDGE_TYPES.length;
        const newType = EDGE_TYPES[newIdx];

        // Update edge type if changed
        const currentEdge = useFlowStore.getState().edges.find((ed) => ed.id === edgeId);
        if (currentEdge && currentEdge.type !== newType) {
          useFlowStore.getState().updateEdge(edgeId, { type: newType });
        }
      };

      const handleMouseUp = () => {
        dragging.current = false;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [edgeId, sourceX, sourceY, targetX, targetY],
  );

  return onInteractionMouseDown;
}
