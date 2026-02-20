// ---------------------------------------------------------------------------
// EdgeLabel.tsx -- Shared draggable edge label component
//
// Renders the label for an edge and allows the user to click-and-drag it
// along the connector path to reposition. The label position is stored as
// a `t` parameter (0 = source, 0.5 = center, 1 = target) in edge data.
// ---------------------------------------------------------------------------

import React, { useCallback, useRef, useState, useEffect } from 'react';
import { EdgeLabelRenderer, useReactFlow } from '@xyflow/react';
import { useFlowStore } from '../../store/flowStore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EdgeLabelProps {
  /** Edge id -- used to update the store on drag end */
  edgeId: string;
  /** The label text to render */
  label: string;
  /** Source point of the edge path */
  sourceX: number;
  sourceY: number;
  /** Midpoint (labelX/labelY from React Flow's path helpers) */
  midX: number;
  midY: number;
  /** Target point of the edge path */
  targetX: number;
  targetY: number;
  /** Current label position parameter (0-1, default 0.5) */
  labelPosition: number;
  /** Label text color */
  labelColor: string;
  /** Label background color */
  labelBgColor: string;
  /** Label border color (usually matches stroke) */
  borderColor: string;
  /** Label font size */
  fontSize: number;
  /** Optional vertical offset in pixels (used by DependencyEdge to stack with pill badge) */
  offsetY?: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Compute (lx, ly) from t using the same piecewise linear interpolation
 * that the edge components previously used inline.
 *
 * t = 0   => (sourceX, sourceY)
 * t = 0.5 => (midX, midY)
 * t = 1   => (targetX, targetY)
 */
export function computeLabelXY(
  t: number,
  sourceX: number,
  sourceY: number,
  midX: number,
  midY: number,
  targetX: number,
  targetY: number,
): [number, number] {
  if (t <= 0.5) {
    const s = t * 2; // 0..1 within the first half
    return [
      sourceX + s * (midX - sourceX),
      sourceY + s * (midY - sourceY),
    ];
  } else {
    const s = (t - 0.5) * 2; // 0..1 within the second half
    return [
      midX + s * (targetX - midX),
      midY + s * (targetY - midY),
    ];
  }
}

/**
 * Given a mouse position in flow coordinates, compute the nearest t along
 * the piecewise linear path source -> mid -> target.
 *
 * We project the point onto each segment and pick the closest.
 */
function projectToT(
  px: number,
  py: number,
  sourceX: number,
  sourceY: number,
  midX: number,
  midY: number,
  targetX: number,
  targetY: number,
): number {
  // Project onto segment A: source -> mid  (t = 0 .. 0.5)
  const tA = projectOntoSegment(px, py, sourceX, sourceY, midX, midY);
  const axA = sourceX + tA * (midX - sourceX);
  const ayA = sourceY + tA * (midY - sourceY);
  const distA = (px - axA) ** 2 + (py - ayA) ** 2;

  // Project onto segment B: mid -> target  (t = 0.5 .. 1)
  const tB = projectOntoSegment(px, py, midX, midY, targetX, targetY);
  const axB = midX + tB * (targetX - midX);
  const ayB = midY + tB * (targetY - midY);
  const distB = (px - axB) ** 2 + (py - ayB) ** 2;

  // Pick the closer segment and map back to global t
  if (distA <= distB) {
    return tA * 0.5; // segment A maps to t 0..0.5
  } else {
    return 0.5 + tB * 0.5; // segment B maps to t 0.5..1
  }
}

/** Project point (px,py) onto line segment (ax,ay)-(bx,by), return clamped t in [0,1] */
function projectOntoSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return 0;
  const t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  return Math.max(0, Math.min(1, t));
}

/** Snap t to nearest 0.05 increment, clamped to [0, 1] */
function snapT(t: number): number {
  const snapped = Math.round(t * 20) / 20;
  return Math.max(0, Math.min(1, snapped));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const EdgeLabel: React.FC<EdgeLabelProps> = ({
  edgeId,
  label,
  sourceX,
  sourceY,
  midX,
  midY,
  targetX,
  targetY,
  labelPosition,
  labelColor,
  labelBgColor,
  borderColor,
  fontSize,
  offsetY = 0,
}) => {
  const { screenToFlowPosition } = useReactFlow();
  const updateEdgeData = useFlowStore((s) => s.updateEdgeData);
  const [isDragging, setIsDragging] = useState(false);
  const [dragT, setDragT] = useState<number | null>(null);
  const isDraggingRef = useRef(false);
  const dragTRef = useRef<number | null>(null);

  // The effective t: use drag position while dragging, otherwise the stored value
  const effectiveT = dragT !== null ? dragT : labelPosition;
  const [lx, ly] = computeLabelXY(effectiveT, sourceX, sourceY, midX, midY, targetX, targetY);

  // Keep refs for values needed in window event handlers (to avoid stale closures)
  const edgeIdRef = useRef(edgeId);
  edgeIdRef.current = edgeId;
  const pathRef = useRef({ sourceX, sourceY, midX, midY, targetX, targetY });
  pathRef.current = { sourceX, sourceY, midX, midY, targetX, targetY };

  // ---- Drag handlers (attached to window during drag) ----

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      e.preventDefault();
      e.stopPropagation();

      // Convert screen coords to flow coords
      const flowPos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const p = pathRef.current;

      // Compute new t by projecting onto path
      const rawT = projectToT(
        flowPos.x,
        flowPos.y,
        p.sourceX,
        p.sourceY,
        p.midX,
        p.midY,
        p.targetX,
        p.targetY,
      );
      const snapped = snapT(rawT);
      dragTRef.current = snapped;
      setDragT(snapped);
    },
    [screenToFlowPosition],
  );

  const handleMouseUp = useCallback(
    (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      e.preventDefault();
      e.stopPropagation();

      isDraggingRef.current = false;
      setIsDragging(false);

      // Commit the final position to the store (read from ref to avoid stale closure)
      if (dragTRef.current !== null) {
        updateEdgeData(edgeIdRef.current, { labelPosition: dragTRef.current });
      }
      dragTRef.current = null;
      setDragT(null);

      // Remove listeners
      window.removeEventListener('mousemove', handleMouseMove, true);
      window.removeEventListener('mouseup', handleMouseUp, true);
    },
    [handleMouseMove, updateEdgeData],
  );

  // Attach/detach window listeners when dragging starts
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove, true);
      window.addEventListener('mouseup', handleMouseUp, true);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove, true);
        window.removeEventListener('mouseup', handleMouseUp, true);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Only left button
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();

      isDraggingRef.current = true;
      dragTRef.current = labelPosition;
      setIsDragging(true);
      setDragT(labelPosition);
    },
    [labelPosition],
  );

  return (
    <EdgeLabelRenderer>
      <div
        className="absolute pointer-events-auto rounded px-2 py-0.5 font-medium shadow-sm border select-none"
        style={{
          transform: `translate(-50%, -50%) translate(${lx}px, ${ly + offsetY}px)`,
          color: labelColor,
          backgroundColor: labelBgColor,
          borderColor: borderColor,
          fontSize,
          whiteSpace: 'nowrap',
          cursor: isDragging ? 'grabbing' : 'grab',
          zIndex: isDragging ? 1000 : undefined,
        }}
        onMouseDown={handleMouseDown}
      >
        {label}
      </div>
    </EdgeLabelRenderer>
  );
};

export default React.memo(EdgeLabel);
