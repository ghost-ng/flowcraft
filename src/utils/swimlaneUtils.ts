// ---------------------------------------------------------------------------
// Swimlane Utilities
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Inline types
// ---------------------------------------------------------------------------

export type SwimlaneOrientation = 'horizontal' | 'vertical';

export interface LaneDefinition {
  id: string;
  label: string;
  size: number;
  collapsed: boolean;
  order: number;
}

export interface LaneBoundary {
  laneId: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MatrixCell {
  hLaneId: string;
  vLaneId: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface NodeRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ---------------------------------------------------------------------------
// computeLaneBoundaries
// ---------------------------------------------------------------------------

/**
 * Compute the pixel-space bounding rectangles for an ordered list of lanes.
 *
 * For **horizontal** orientation lanes are stacked top-to-bottom (each lane
 * spans the full width; `size` controls height).
 *
 * For **vertical** orientation lanes are stacked left-to-right (each lane
 * spans the full height; `size` controls width).
 *
 * @param lanes       - Ordered lane definitions
 * @param orientation - 'horizontal' or 'vertical'
 * @param startOffset - Pixel offset for the first lane (e.g. header height)
 * @returns Array of lane boundary rectangles
 */
export function computeLaneBoundaries(
  lanes: LaneDefinition[],
  orientation: SwimlaneOrientation,
  startOffset: number = 0,
): LaneBoundary[] {
  // Sort by order to ensure correct stacking
  const sorted = [...lanes].sort((a, b) => a.order - b.order);

  const collapsedSize = 32; // collapsed lanes get a minimal sliver
  const defaultSpan = 2000; // generous cross-axis span for unconstrained dimension

  const boundaries: LaneBoundary[] = [];
  let cursor = startOffset;

  for (const lane of sorted) {
    const effectiveSize = lane.collapsed ? collapsedSize : lane.size;

    if (orientation === 'horizontal') {
      // Lanes stacked vertically; each is a horizontal band
      boundaries.push({
        laneId: lane.id,
        x: 0,
        y: cursor,
        width: defaultSpan,
        height: effectiveSize,
      });
    } else {
      // Lanes stacked horizontally; each is a vertical band
      boundaries.push({
        laneId: lane.id,
        x: cursor,
        y: 0,
        width: effectiveSize,
        height: defaultSpan,
      });
    }

    cursor += effectiveSize;
  }

  return boundaries;
}

// ---------------------------------------------------------------------------
// hitTestLane
// ---------------------------------------------------------------------------

/**
 * Determine which lane a point falls within.
 *
 * @param position       - {x, y} point to test
 * @param laneBoundaries - Pre-computed lane rectangles
 * @returns The laneId of the hit lane, or null if outside all lanes
 */
export function hitTestLane(
  position: { x: number; y: number },
  laneBoundaries: LaneBoundary[],
): string | null {
  for (const lane of laneBoundaries) {
    if (
      position.x >= lane.x &&
      position.x <= lane.x + lane.width &&
      position.y >= lane.y &&
      position.y <= lane.y + lane.height
    ) {
      return lane.laneId;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// getNodeLaneAssignment
// ---------------------------------------------------------------------------

/**
 * Determine which lane a node belongs to based on its centre point.
 *
 * @param nodePosition   - Top-left {x, y} of the node
 * @param nodeSize       - {width, height} of the node
 * @param laneBoundaries - Pre-computed lane rectangles
 * @returns The laneId the node's centre falls within, or null
 */
export function getNodeLaneAssignment(
  nodePosition: { x: number; y: number },
  nodeSize: { width: number; height: number },
  laneBoundaries: LaneBoundary[],
): string | null {
  const centre = {
    x: nodePosition.x + nodeSize.width / 2,
    y: nodePosition.y + nodeSize.height / 2,
  };
  return hitTestLane(centre, laneBoundaries);
}

// ---------------------------------------------------------------------------
// computeMatrixCells
// ---------------------------------------------------------------------------

/**
 * Given horizontal lanes and vertical lanes, compute the matrix of cells
 * formed by their intersection.
 *
 * Horizontal lanes define rows; vertical lanes define columns.
 *
 * @param hLanes - Horizontal lane definitions (rows)
 * @param vLanes - Vertical lane definitions (columns)
 * @returns Flat array of MatrixCell objects
 */
export function computeMatrixCells(
  hLanes: LaneDefinition[],
  vLanes: LaneDefinition[],
): MatrixCell[] {
  const hBounds = computeLaneBoundaries(hLanes, 'horizontal');
  const vBounds = computeLaneBoundaries(vLanes, 'vertical');

  const cells: MatrixCell[] = [];

  for (const hLane of hBounds) {
    for (const vLane of vBounds) {
      cells.push({
        hLaneId: hLane.laneId,
        vLaneId: vLane.laneId,
        x: vLane.x,
        y: hLane.y,
        width: vLane.width,
        height: hLane.height,
      });
    }
  }

  return cells;
}
