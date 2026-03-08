// ---------------------------------------------------------------------------
// waypointPath.ts -- Builds SVG path strings from waypoints
// ---------------------------------------------------------------------------

import {
  getBezierPath,
  Position,
} from '@xyflow/react';

export type WaypointEdgeType = 'straight' | 'smoothstep' | 'step' | 'bezier';

interface WaypointPathParams {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: Position;
  targetPosition: Position;
  waypoints: Array<{ x: number; y: number }>;
  edgeType: WaypointEdgeType;
}

/** Infer best exit/entry position between two points */
function inferPositions(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
): { exitPos: Position; entryPos: Position } {
  const dx = toX - fromX;
  const dy = toY - fromY;
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0
      ? { exitPos: Position.Right, entryPos: Position.Left }
      : { exitPos: Position.Left, entryPos: Position.Right };
  }
  return dy >= 0
    ? { exitPos: Position.Bottom, entryPos: Position.Top }
    : { exitPos: Position.Top, entryPos: Position.Bottom };
}

/** Opposite position for intermediate waypoint handle positions */
function oppositePosition(pos: Position): Position {
  switch (pos) {
    case Position.Top: return Position.Bottom;
    case Position.Bottom: return Position.Top;
    case Position.Left: return Position.Right;
    case Position.Right: return Position.Left;
  }
}

/**
 * Build a polyline path through all points, with optional rounded corners.
 * For step: sharp 90° corners. For smoothstep: quadratic bezier rounded corners.
 */
function buildPolylinePath(
  points: Array<{ x: number; y: number }>,
  borderRadius: number,
): string {
  if (points.length < 2) return '';

  // No rounding or only 2 points → straight segments
  if (points.length === 2 || borderRadius === 0) {
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');
  }

  const parts: string[] = [];
  parts.push(`M ${points[0].x},${points[0].y}`);

  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];

    // Vectors from curr to prev and curr to next
    const d1x = prev.x - curr.x;
    const d1y = prev.y - curr.y;
    const d2x = next.x - curr.x;
    const d2y = next.y - curr.y;

    const len1 = Math.sqrt(d1x * d1x + d1y * d1y);
    const len2 = Math.sqrt(d2x * d2x + d2y * d2y);

    if (len1 === 0 || len2 === 0) {
      parts.push(`L ${curr.x},${curr.y}`);
      continue;
    }

    // Clamp radius to half the shorter segment
    const r = Math.min(borderRadius, len1 / 2, len2 / 2);

    // Points where the rounding starts and ends
    const startX = curr.x + (d1x / len1) * r;
    const startY = curr.y + (d1y / len1) * r;
    const endX = curr.x + (d2x / len2) * r;
    const endY = curr.y + (d2y / len2) * r;

    parts.push(`L ${startX},${startY}`);
    parts.push(`Q ${curr.x},${curr.y} ${endX},${endY}`);
  }

  const last = points[points.length - 1];
  parts.push(`L ${last.x},${last.y}`);

  return parts.join(' ');
}

/**
 * Build a path segmented through waypoints.
 * Returns [pathString, labelX, labelY].
 */
export function buildWaypointPath(params: WaypointPathParams): [string, number, number] {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, waypoints, edgeType } = params;

  // Build list of all points: source → waypoints → target
  const points = [
    { x: sourceX, y: sourceY },
    ...waypoints,
    { x: targetX, y: targetY },
  ];

  if (edgeType === 'straight' || edgeType === 'step') {
    // Straight polyline — no corner rounding
    const d = buildPolylinePath(points, 0);
    const mid = getMidpoint(points);
    return [d, mid.x, mid.y];
  }

  if (edgeType === 'smoothstep') {
    // Polyline with rounded corners at waypoints
    const d = buildPolylinePath(points, 8);
    const mid = getMidpoint(points);
    return [d, mid.x, mid.y];
  }

  // Bezier: build path segment by segment using React Flow's getBezierPath
  const segments: string[] = [];

  for (let i = 0; i < points.length - 1; i++) {
    const from = points[i];
    const to = points[i + 1];

    // Determine exit/entry positions
    let srcPos: Position;
    let tgtPos: Position;

    if (i === 0) {
      srcPos = sourcePosition;
    } else {
      const prev = points[i - 1];
      srcPos = oppositePosition(inferPositions(prev.x, prev.y, from.x, from.y).entryPos);
    }

    if (i === points.length - 2) {
      tgtPos = targetPosition;
    } else {
      const { entryPos } = inferPositions(from.x, from.y, to.x, to.y);
      tgtPos = entryPos;
    }

    const [segPath] = getBezierPath({
      sourceX: from.x,
      sourceY: from.y,
      targetX: to.x,
      targetY: to.y,
      sourcePosition: srcPos,
      targetPosition: tgtPos,
    });

    if (i === 0) {
      segments.push(segPath);
    } else {
      // Remove the "M x,y" prefix from subsequent segments to create a continuous path
      const withoutM = segPath.replace(/^M\s*[\d.eE+-]+[,\s][\d.eE+-]+\s*/, '');
      segments.push(withoutM);
    }
  }

  const fullPath = segments.join(' ');
  const mid = getMidpoint(points);
  return [fullPath, mid.x, mid.y];
}

/**
 * Auto-compute elbow corner positions for step/smoothstep edges so they're
 * immediately draggable without the user needing to double-click first.
 */
export function computeStepElbows(
  sx: number, sy: number, sPos: Position,
  tx: number, ty: number, tPos: Position,
): Array<{ x: number; y: number }> {
  // Horizontal→horizontal routing (right→left, left→right)
  if ((sPos === Position.Right && tPos === Position.Left) ||
      (sPos === Position.Left && tPos === Position.Right)) {
    const midX = (sx + tx) / 2;
    if (Math.abs(sy - ty) < 1) return []; // straight horizontal
    return [{ x: midX, y: sy }, { x: midX, y: ty }];
  }
  // Vertical→vertical routing (bottom→top, top→bottom)
  if ((sPos === Position.Bottom && tPos === Position.Top) ||
      (sPos === Position.Top && tPos === Position.Bottom)) {
    const midY = (sy + ty) / 2;
    if (Math.abs(sx - tx) < 1) return []; // straight vertical
    return [{ x: sx, y: midY }, { x: tx, y: midY }];
  }
  // Mixed orientations: L-shaped path with single elbow
  if ((sPos === Position.Right || sPos === Position.Left) &&
      (tPos === Position.Top || tPos === Position.Bottom)) {
    return [{ x: tx, y: sy }];
  }
  if ((sPos === Position.Top || sPos === Position.Bottom) &&
      (tPos === Position.Right || tPos === Position.Left)) {
    return [{ x: sx, y: ty }];
  }
  // Same-side connections
  if (sPos === Position.Right && tPos === Position.Right) {
    const maxX = Math.max(sx, tx) + 30;
    return [{ x: maxX, y: sy }, { x: maxX, y: ty }];
  }
  if (sPos === Position.Left && tPos === Position.Left) {
    const minX = Math.min(sx, tx) - 30;
    return [{ x: minX, y: sy }, { x: minX, y: ty }];
  }
  if (sPos === Position.Bottom && tPos === Position.Bottom) {
    const maxY = Math.max(sy, ty) + 30;
    return [{ x: sx, y: maxY }, { x: tx, y: maxY }];
  }
  if (sPos === Position.Top && tPos === Position.Top) {
    const minY = Math.min(sy, ty) - 30;
    return [{ x: sx, y: minY }, { x: tx, y: minY }];
  }
  return [];
}

/** Find the midpoint along the polyline defined by points (by arc length) */
function getMidpoint(points: Array<{ x: number; y: number }>): { x: number; y: number } {
  if (points.length === 0) return { x: 0, y: 0 };
  if (points.length === 1) return points[0];

  // Compute total length
  let totalLen = 0;
  const segLens: number[] = [];
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    const len = Math.sqrt(dx * dx + dy * dy);
    segLens.push(len);
    totalLen += len;
  }

  // Walk to halfway
  const halfLen = totalLen / 2;
  let walked = 0;
  for (let i = 0; i < segLens.length; i++) {
    if (walked + segLens[i] >= halfLen) {
      const t = (halfLen - walked) / segLens[i];
      return {
        x: points[i].x + (points[i + 1].x - points[i].x) * t,
        y: points[i].y + (points[i + 1].y - points[i].y) * t,
      };
    }
    walked += segLens[i];
  }
  return points[points.length - 1];
}
