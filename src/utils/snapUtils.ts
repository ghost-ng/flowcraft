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
