// ---------------------------------------------------------------------------
// Snap & Alignment Utilities
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Inline types
// ---------------------------------------------------------------------------

export interface Position {
  x: number;
  y: number;
}

export interface SnapNode {
  id: string;
  position: Position;
  measured?: { width?: number; height?: number };
  width?: number;
  height?: number;
}

export interface AlignmentGuides {
  vertical: number[];
  horizontal: number[];
}

export interface DistributionGuide {
  axis: 'horizontal' | 'vertical';
  positions: number[];
  spacing: number;
}

export interface DistanceGap {
  axis: 'horizontal' | 'vertical';
  distance: number;
  lineStart: number;
  lineEnd: number;
  crossPos: number;
  isEqual?: boolean;
}

export interface DistanceGuides {
  gaps: DistanceGap[];
  equalSpacingSnap?: Position;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveWidth(node: SnapNode): number {
  return node.measured?.width ?? node.width ?? 172;
}

function resolveHeight(node: SnapNode): number {
  return node.measured?.height ?? node.height ?? 40;
}

/** Return the centre-x of a node. */
function centerX(node: SnapNode): number {
  return node.position.x + resolveWidth(node) / 2;
}

/** Return the centre-y of a node. */
function centerY(node: SnapNode): number {
  return node.position.y + resolveHeight(node) / 2;
}

/** Return the right edge of a node. */
function rightEdge(node: SnapNode): number {
  return node.position.x + resolveWidth(node);
}

/** Return the bottom edge of a node. */
function bottomEdge(node: SnapNode): number {
  return node.position.y + resolveHeight(node);
}

// ---------------------------------------------------------------------------
// snapToGrid
// ---------------------------------------------------------------------------

/**
 * Snap a single numeric value to the nearest grid increment.
 */
export function snapToGrid(value: number, gridSize: number): number {
  if (gridSize <= 0) return value;
  return Math.round(value / gridSize) * gridSize;
}

/**
 * Snap an {x, y} position to the nearest grid point.
 */
export function snapPosition(position: Position, gridSize: number): Position {
  return {
    x: snapToGrid(position.x, gridSize),
    y: snapToGrid(position.y, gridSize),
  };
}

// ---------------------------------------------------------------------------
// findAlignmentGuides
// ---------------------------------------------------------------------------

/**
 * Given a node being dragged and the full list of nodes, find alignment guide
 * lines where the dragged node's edges or centre align with other nodes.
 *
 * @param draggedNode - The node currently being dragged
 * @param allNodes    - Every node on the canvas (including the dragged node)
 * @param threshold   - Pixel distance to consider "aligned" (default 8)
 * @returns Vertical (x) and horizontal (y) guide-line positions
 */
export function findAlignmentGuides(
  draggedNode: SnapNode,
  allNodes: SnapNode[],
  threshold: number = 8,
): AlignmentGuides {
  const vertical: Set<number> = new Set();
  const horizontal: Set<number> = new Set();

  const dLeft = draggedNode.position.x;
  const dRight = rightEdge(draggedNode);
  const dCenterX = centerX(draggedNode);
  const dTop = draggedNode.position.y;
  const dBottom = bottomEdge(draggedNode);
  const dCenterY = centerY(draggedNode);

  for (const other of allNodes) {
    if (other.id === draggedNode.id) continue;

    const oLeft = other.position.x;
    const oRight = rightEdge(other);
    const oCenterX = centerX(other);
    const oTop = other.position.y;
    const oBottom = bottomEdge(other);
    const oCenterY = centerY(other);

    // Vertical guides (x-axis alignment)
    if (Math.abs(dLeft - oLeft) <= threshold) vertical.add(oLeft);
    if (Math.abs(dRight - oRight) <= threshold) vertical.add(oRight);
    if (Math.abs(dCenterX - oCenterX) <= threshold) vertical.add(oCenterX);
    if (Math.abs(dLeft - oRight) <= threshold) vertical.add(oRight);
    if (Math.abs(dRight - oLeft) <= threshold) vertical.add(oLeft);

    // Horizontal guides (y-axis alignment)
    if (Math.abs(dTop - oTop) <= threshold) horizontal.add(oTop);
    if (Math.abs(dBottom - oBottom) <= threshold) horizontal.add(oBottom);
    if (Math.abs(dCenterY - oCenterY) <= threshold) horizontal.add(oCenterY);
    if (Math.abs(dTop - oBottom) <= threshold) horizontal.add(oBottom);
    if (Math.abs(dBottom - oTop) <= threshold) horizontal.add(oTop);
  }

  return {
    vertical: Array.from(vertical),
    horizontal: Array.from(horizontal),
  };
}

// ---------------------------------------------------------------------------
// snapToAlignmentGuides — snap a node's position to the nearest guide line
// ---------------------------------------------------------------------------

/**
 * Given a node and active alignment guides, compute a snapped position.
 * For each axis, finds the closest guide line to the node's edges or center,
 * then adjusts the position to lock onto that guide.
 *
 * @returns Adjusted position (only axes with nearby guides are modified)
 */
export function snapToAlignmentGuides(
  node: SnapNode,
  guides: AlignmentGuides,
  threshold: number = 8,
): Position {
  let newX = node.position.x;
  let newY = node.position.y;

  const w = resolveWidth(node);
  const h = resolveHeight(node);
  const cx = node.position.x + w / 2;
  const cy = node.position.y + h / 2;
  const right = node.position.x + w;
  const bottom = node.position.y + h;

  // Find closest vertical guide (x-axis snap)
  let bestDx = threshold + 1;
  for (const gx of guides.vertical) {
    const dLeft = Math.abs(node.position.x - gx);
    if (dLeft < bestDx) { bestDx = dLeft; newX = gx; }
    const dCenter = Math.abs(cx - gx);
    if (dCenter < bestDx) { bestDx = dCenter; newX = gx - w / 2; }
    const dRight = Math.abs(right - gx);
    if (dRight < bestDx) { bestDx = dRight; newX = gx - w; }
  }

  // Find closest horizontal guide (y-axis snap)
  let bestDy = threshold + 1;
  for (const gy of guides.horizontal) {
    const dTop = Math.abs(node.position.y - gy);
    if (dTop < bestDy) { bestDy = dTop; newY = gy; }
    const dCenter = Math.abs(cy - gy);
    if (dCenter < bestDy) { bestDy = dCenter; newY = gy - h / 2; }
    const dBottom = Math.abs(bottom - gy);
    if (dBottom < bestDy) { bestDy = dBottom; newY = gy - h; }
  }

  return { x: newX, y: newY };
}

// ---------------------------------------------------------------------------
// findDistributionGuides
// ---------------------------------------------------------------------------

/**
 * Detect equal-spacing patterns among three or more nodes (including the
 * dragged node).  When the dragged node creates an evenly-spaced row or
 * column with two or more other nodes, distribution guides are returned.
 *
 * @param draggedNode - The node being dragged
 * @param allNodes    - Every node on the canvas
 * @returns An array of distribution guide descriptors
 */
export function findDistributionGuides(
  draggedNode: SnapNode,
  allNodes: SnapNode[],
): DistributionGuide[] {
  const guides: DistributionGuide[] = [];
  const others = allNodes.filter((n) => n.id !== draggedNode.id);

  if (others.length < 2) return guides;

  const tolerance = 8;

  // --- Horizontal distribution (sorted by x) ---
  const hCandidates = [...others, draggedNode].sort(
    (a, b) => centerX(a) - centerX(b),
  );

  for (let i = 0; i < hCandidates.length - 2; i++) {
    const a = hCandidates[i];
    const b = hCandidates[i + 1];
    const c = hCandidates[i + 2];

    const gap1 = centerX(b) - centerX(a);
    const gap2 = centerX(c) - centerX(b);

    if (Math.abs(gap1 - gap2) <= tolerance) {
      // Check that the dragged node is part of this triplet
      if (a.id === draggedNode.id || b.id === draggedNode.id || c.id === draggedNode.id) {
        guides.push({
          axis: 'horizontal',
          positions: [centerX(a), centerX(b), centerX(c)],
          spacing: (gap1 + gap2) / 2,
        });
      }
    }
  }

  // --- Vertical distribution (sorted by y) ---
  const vCandidates = [...others, draggedNode].sort(
    (a, b) => centerY(a) - centerY(b),
  );

  for (let i = 0; i < vCandidates.length - 2; i++) {
    const a = vCandidates[i];
    const b = vCandidates[i + 1];
    const c = vCandidates[i + 2];

    const gap1 = centerY(b) - centerY(a);
    const gap2 = centerY(c) - centerY(b);

    if (Math.abs(gap1 - gap2) <= tolerance) {
      if (a.id === draggedNode.id || b.id === draggedNode.id || c.id === draggedNode.id) {
        guides.push({
          axis: 'vertical',
          positions: [centerY(a), centerY(b), centerY(c)],
          spacing: (gap1 + gap2) / 2,
        });
      }
    }
  }

  return guides;
}

// ---------------------------------------------------------------------------
// findDistanceGuides — edge-to-edge gap measurements + equal spacing detection
// ---------------------------------------------------------------------------

/** Check whether two 1D ranges overlap. */
function rangesOverlap(a0: number, a1: number, b0: number, b1: number): boolean {
  return a0 < b1 && b0 < a1;
}

/** Midpoint of the overlapping segment of two 1D ranges. */
function overlapMidpoint(a0: number, a1: number, b0: number, b1: number): number {
  const lo = Math.max(a0, b0);
  const hi = Math.min(a1, b1);
  return (lo + hi) / 2;
}

/**
 * Find edge-to-edge distance measurements between a dragged node and its
 * closest neighbours on each side (up/down/left/right).  Also detects
 * equal-spacing opportunities and returns a snap target when found.
 */
export function findDistanceGuides(
  draggedNode: SnapNode,
  allNodes: SnapNode[],
  maxDistance: number = 300,
  tolerance: number = 8,
): DistanceGuides {
  const others = allNodes.filter((n) => n.id !== draggedNode.id);
  if (others.length === 0) return { gaps: [] };

  const dLeft = draggedNode.position.x;
  const dRight = rightEdge(draggedNode);
  const dTop = draggedNode.position.y;
  const dBottom = bottomEdge(draggedNode);
  const dW = resolveWidth(draggedNode);
  const dH = resolveHeight(draggedNode);

  // Track closest neighbour per side
  let rightNeighbor: { node: SnapNode; gap: number } | null = null;
  let leftNeighbor: { node: SnapNode; gap: number } | null = null;
  let belowNeighbor: { node: SnapNode; gap: number } | null = null;
  let aboveNeighbor: { node: SnapNode; gap: number } | null = null;

  for (const other of others) {
    const oLeft = other.position.x;
    const oRight = rightEdge(other);
    const oTop = other.position.y;
    const oBottom = bottomEdge(other);

    // Horizontal neighbours (must overlap vertically)
    if (rangesOverlap(dTop, dBottom, oTop, oBottom)) {
      // Right neighbour
      if (oLeft > dRight) {
        const gap = oLeft - dRight;
        if (gap <= maxDistance && (!rightNeighbor || gap < rightNeighbor.gap)) {
          rightNeighbor = { node: other, gap };
        }
      }
      // Left neighbour
      if (oRight < dLeft) {
        const gap = dLeft - oRight;
        if (gap <= maxDistance && (!leftNeighbor || gap < leftNeighbor.gap)) {
          leftNeighbor = { node: other, gap };
        }
      }
    }

    // Vertical neighbours (must overlap horizontally)
    if (rangesOverlap(dLeft, dRight, oLeft, oRight)) {
      // Below neighbour
      if (oTop > dBottom) {
        const gap = oTop - dBottom;
        if (gap <= maxDistance && (!belowNeighbor || gap < belowNeighbor.gap)) {
          belowNeighbor = { node: other, gap };
        }
      }
      // Above neighbour
      if (oBottom < dTop) {
        const gap = dTop - oBottom;
        if (gap <= maxDistance && (!aboveNeighbor || gap < aboveNeighbor.gap)) {
          aboveNeighbor = { node: other, gap };
        }
      }
    }
  }

  // Build gap objects
  const gaps: DistanceGap[] = [];

  if (rightNeighbor) {
    const o = rightNeighbor.node;
    gaps.push({
      axis: 'horizontal',
      distance: rightNeighbor.gap,
      lineStart: dRight,
      lineEnd: o.position.x,
      crossPos: overlapMidpoint(dTop, dBottom, o.position.y, bottomEdge(o)),
    });
  }

  if (leftNeighbor) {
    const o = leftNeighbor.node;
    gaps.push({
      axis: 'horizontal',
      distance: leftNeighbor.gap,
      lineStart: rightEdge(o),
      lineEnd: dLeft,
      crossPos: overlapMidpoint(dTop, dBottom, o.position.y, bottomEdge(o)),
    });
  }

  if (belowNeighbor) {
    const o = belowNeighbor.node;
    gaps.push({
      axis: 'vertical',
      distance: belowNeighbor.gap,
      lineStart: dBottom,
      lineEnd: o.position.y,
      crossPos: overlapMidpoint(dLeft, dRight, o.position.x, rightEdge(o)),
    });
  }

  if (aboveNeighbor) {
    const o = aboveNeighbor.node;
    gaps.push({
      axis: 'vertical',
      distance: aboveNeighbor.gap,
      lineStart: bottomEdge(o),
      lineEnd: dTop,
      crossPos: overlapMidpoint(dLeft, dRight, o.position.x, rightEdge(o)),
    });
  }

  // Detect equal spacing on opposing sides
  let equalSpacingSnap: Position | undefined;

  // Horizontal equal spacing (left gap ≈ right gap)
  if (leftNeighbor && rightNeighbor) {
    if (Math.abs(leftNeighbor.gap - rightNeighbor.gap) <= tolerance) {
      gaps.forEach((g) => { if (g.axis === 'horizontal') g.isEqual = true; });
      const lRight = rightEdge(leftNeighbor.node);
      const rLeft = rightNeighbor.node.position.x;
      const snapX = lRight + (rLeft - lRight - dW) / 2;
      equalSpacingSnap = { x: snapX, y: draggedNode.position.y };
    }
  }

  // Vertical equal spacing (above gap ≈ below gap)
  if (aboveNeighbor && belowNeighbor) {
    if (Math.abs(aboveNeighbor.gap - belowNeighbor.gap) <= tolerance) {
      gaps.forEach((g) => { if (g.axis === 'vertical') g.isEqual = true; });
      const aBottom = bottomEdge(aboveNeighbor.node);
      const bTop = belowNeighbor.node.position.y;
      const snapY = aBottom + (bTop - aBottom - dH) / 2;
      equalSpacingSnap = {
        x: equalSpacingSnap?.x ?? draggedNode.position.x,
        y: snapY,
      };
    }
  }

  return { gaps, equalSpacingSnap };
}
