// ---------------------------------------------------------------------------
// Layout Engine (powered by dagre)
// ---------------------------------------------------------------------------

import dagre from 'dagre';

// ---------------------------------------------------------------------------
// Inline types
// ---------------------------------------------------------------------------

export type LayoutDirection = 'TB' | 'LR' | 'BT' | 'RL';

export interface LayoutNode {
  id: string;
  position: { x: number; y: number };
  measured?: { width?: number; height?: number };
  width?: number;
  height?: number;
  data?: { swimlaneId?: string; [key: string]: unknown };
}

export interface LayoutEdge {
  id: string;
  source: string;
  target: string;
  /** Optional label text — used to compute label dimensions for spacing */
  label?: string;
}

export interface LaneBoundary {
  laneId: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Resolve the pixel width of a node, falling back to a sensible default. */
function nodeWidth(node: LayoutNode): number {
  return node.measured?.width ?? node.width ?? 172;
}

/** Resolve the pixel height of a node, falling back to a sensible default. */
function nodeHeight(node: LayoutNode): number {
  return node.measured?.height ?? node.height ?? 40;
}

// ---------------------------------------------------------------------------
// applyDagreLayout
// ---------------------------------------------------------------------------

/**
 * Run the dagre layout algorithm on a set of nodes and edges, returning a new
 * array of nodes with updated positions.  The original arrays are not mutated.
 *
 * @param nodes          - Nodes to lay out
 * @param edges          - Edges connecting the nodes
 * @param direction      - Graph direction: 'TB' | 'LR' | 'BT' | 'RL'
 * @param nodeSpacingX   - Horizontal gap between nodes (dagre `nodesep`)
 * @param nodeSpacingY   - Vertical gap between nodes (dagre `ranksep`)
 * @returns A new node array with computed positions
 */
export function applyDagreLayout(
  nodes: LayoutNode[],
  edges: LayoutEdge[],
  direction: LayoutDirection = 'TB',
  nodeSpacingX: number = 80,
  nodeSpacingY: number = 80,
): LayoutNode[] {
  if (nodes.length === 0) return [];

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: direction,
    nodesep: nodeSpacingX,
    ranksep: nodeSpacingY,
    marginx: 20,
    marginy: 20,
  });

  // Add nodes
  for (const node of nodes) {
    g.setNode(node.id, {
      width: nodeWidth(node),
      height: nodeHeight(node),
    });
  }

  // Add edges (only between nodes that exist in the graph)
  // When edges have labels, pass estimated label dimensions so dagre reserves space
  const nodeIds = new Set(nodes.map((n) => n.id));
  for (const edge of edges) {
    if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
      if (edge.label) {
        // Estimate label dimensions: ~7px per char width, 22px height with padding
        const labelWidth = Math.max(40, edge.label.length * 7 + 16);
        const labelHeight = 22;
        g.setEdge(edge.source, edge.target, {
          width: labelWidth,
          height: labelHeight,
          labelpos: 'c',
        });
      } else {
        g.setEdge(edge.source, edge.target);
      }
    }
  }

  dagre.layout(g);

  // Map positions back.  Dagre returns centre-based coordinates;
  // React Flow uses top-left, so we offset by half the node dimensions.
  return nodes.map((node) => {
    const dagreNode = g.node(node.id);
    if (!dagreNode) return node;

    const w = nodeWidth(node);
    const h = nodeHeight(node);

    return {
      ...node,
      position: {
        x: dagreNode.x - w / 2,
        y: dagreNode.y - h / 2,
      },
    };
  });
}

// ---------------------------------------------------------------------------
// applyLaneAwareLayout
// ---------------------------------------------------------------------------

/**
 * Apply dagre layout while respecting swimlane boundaries.
 *
 * Nodes are grouped by their `data.swimlaneId`.  Each lane sub-graph is laid
 * out independently, then the resulting positions are offset so that each
 * lane's content sits within the appropriate lane boundary rectangle.
 *
 * @param nodes     - All nodes
 * @param edges     - All edges
 * @param lanes     - Lane boundary rectangles
 * @param direction - Layout direction
 * @returns A new node array with lane-aware positions
 */
export function applyLaneAwareLayout(
  nodes: LayoutNode[],
  edges: LayoutEdge[],
  lanes: LaneBoundary[],
  direction: LayoutDirection = 'TB',
): LayoutNode[] {
  if (nodes.length === 0 || lanes.length === 0) return nodes;

  // Build a lookup from laneId to lane boundary
  const laneLookup = new Map<string, LaneBoundary>();
  for (const lane of lanes) {
    laneLookup.set(lane.laneId, lane);
  }

  // Group nodes by lane assignment
  const laneGroups = new Map<string, LayoutNode[]>();
  const unassigned: LayoutNode[] = [];

  for (const node of nodes) {
    const laneId = node.data?.swimlaneId;
    if (laneId && laneLookup.has(laneId)) {
      const group = laneGroups.get(laneId) ?? [];
      group.push(node);
      laneGroups.set(laneId, group);
    } else {
      unassigned.push(node);
    }
  }

  const result: LayoutNode[] = [];

  // Layout each lane sub-graph independently
  for (const [laneId, laneNodes] of laneGroups) {
    const lane = laneLookup.get(laneId)!;

    // Collect edges that are internal to this lane group
    const laneNodeIds = new Set(laneNodes.map((n) => n.id));
    const laneEdges = edges.filter(
      (e) => laneNodeIds.has(e.source) && laneNodeIds.has(e.target),
    );

    const laidOut = applyDagreLayout(laneNodes, laneEdges, direction);

    // Compute the bounding box of the laid-out sub-graph
    let minX = Infinity;
    let minY = Infinity;
    for (const n of laidOut) {
      if (n.position.x < minX) minX = n.position.x;
      if (n.position.y < minY) minY = n.position.y;
    }

    // Offset so the sub-graph is positioned inside the lane with padding
    const padding = 20;
    const offsetX = lane.x + padding - minX;
    const offsetY = lane.y + padding - minY;

    for (const n of laidOut) {
      result.push({
        ...n,
        position: {
          x: n.position.x + offsetX,
          y: n.position.y + offsetY,
        },
      });
    }
  }

  // Unassigned nodes get a standard layout below/beside lanes
  if (unassigned.length > 0) {
    const laidOut = applyDagreLayout(unassigned, edges, direction);
    result.push(...laidOut);
  }

  return result;
}
