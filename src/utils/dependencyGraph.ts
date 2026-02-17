// ---------------------------------------------------------------------------
// Dependency Graph Utilities
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Inline types
// ---------------------------------------------------------------------------

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
}

export interface AdjacencyEntry {
  upstream: string[];
  downstream: string[];
}

/** An adjacency list mapping each nodeId to its upstream and downstream neighbours. */
export type AdjacencyList = Map<string, AdjacencyEntry>;

/** A weight function returning the cost/duration of traversing a node. */
export type WeightFn = (nodeId: string) => number;

// ---------------------------------------------------------------------------
// buildAdjacencyList
// ---------------------------------------------------------------------------

/**
 * Build a bidirectional adjacency list from an array of edges.
 *
 * - `upstream[nodeId]`   = nodes that have an edge pointing *to* this node
 * - `downstream[nodeId]` = nodes that this node points *to*
 */
export function buildAdjacencyList(edges: GraphEdge[]): AdjacencyList {
  const adj: AdjacencyList = new Map();

  const ensure = (id: string): AdjacencyEntry => {
    let entry = adj.get(id);
    if (!entry) {
      entry = { upstream: [], downstream: [] };
      adj.set(id, entry);
    }
    return entry;
  };

  for (const edge of edges) {
    const srcEntry = ensure(edge.source);
    const tgtEntry = ensure(edge.target);

    srcEntry.downstream.push(edge.target);
    tgtEntry.upstream.push(edge.source);
  }

  return adj;
}

// ---------------------------------------------------------------------------
// detectCycles  (Kahn's algorithm)
// ---------------------------------------------------------------------------

/**
 * Detect cycles in the graph using Kahn's algorithm.
 *
 * If the graph is a DAG (no cycles), returns an empty array.
 * Otherwise returns an array of node ID arrays, each representing one cycle.
 *
 * Note: Kahn's algorithm detects *that* cycles exist by finding nodes that
 * cannot be topologically sorted.  To report actual cycle paths we perform a
 * DFS on the remaining nodes.
 */
export function detectCycles(adjacencyList: AdjacencyList): string[][] {
  // Compute in-degrees
  const inDegree = new Map<string, number>();
  for (const [nodeId, entry] of adjacencyList) {
    if (!inDegree.has(nodeId)) inDegree.set(nodeId, 0);
    for (const down of entry.downstream) {
      inDegree.set(down, (inDegree.get(down) ?? 0) + 1);
    }
  }

  // Kahn's: start with zero in-degree nodes
  const queue: string[] = [];
  for (const [nodeId, deg] of inDegree) {
    if (deg === 0) queue.push(nodeId);
  }

  const visited = new Set<string>();
  while (queue.length > 0) {
    const node = queue.shift()!;
    visited.add(node);
    const entry = adjacencyList.get(node);
    if (!entry) continue;
    for (const down of entry.downstream) {
      const newDeg = (inDegree.get(down) ?? 1) - 1;
      inDegree.set(down, newDeg);
      if (newDeg === 0) queue.push(down);
    }
  }

  // Remaining nodes (not visited) are part of cycles
  const remaining = new Set<string>();
  for (const nodeId of adjacencyList.keys()) {
    if (!visited.has(nodeId)) remaining.add(nodeId);
  }

  if (remaining.size === 0) return [];

  // DFS to extract individual cycles from the remaining sub-graph
  const cycles: string[][] = [];
  const globalVisited = new Set<string>();

  for (const startNode of remaining) {
    if (globalVisited.has(startNode)) continue;

    const stack: string[] = [];
    const onStack = new Set<string>();
    const localVisited = new Set<string>();

    const dfs = (node: string): void => {
      localVisited.add(node);
      globalVisited.add(node);
      onStack.add(node);
      stack.push(node);

      const entry = adjacencyList.get(node);
      if (entry) {
        for (const down of entry.downstream) {
          if (!remaining.has(down)) continue;

          if (onStack.has(down)) {
            // Found a cycle -- extract it from the stack
            const cycleStart = stack.indexOf(down);
            if (cycleStart !== -1) {
              cycles.push(stack.slice(cycleStart));
            }
          } else if (!localVisited.has(down)) {
            dfs(down);
          }
        }
      }

      stack.pop();
      onStack.delete(node);
    };

    dfs(startNode);
  }

  return cycles;
}

// ---------------------------------------------------------------------------
// getUpstream / getDownstream / getChain
// ---------------------------------------------------------------------------

/**
 * Get all transitive ancestors (upstream) of a node.
 *
 * @param nodeId        - Starting node
 * @param adjacencyList - The adjacency map
 * @param depth         - Optional max traversal depth (undefined = unlimited)
 */
export function getUpstream(
  nodeId: string,
  adjacencyList: AdjacencyList,
  depth?: number,
): Set<string> {
  const result = new Set<string>();
  const queue: Array<{ id: string; d: number }> = [{ id: nodeId, d: 0 }];

  while (queue.length > 0) {
    const { id, d } = queue.shift()!;
    const entry = adjacencyList.get(id);
    if (!entry) continue;

    for (const up of entry.upstream) {
      if (result.has(up)) continue;
      result.add(up);
      if (depth === undefined || d + 1 < depth) {
        queue.push({ id: up, d: d + 1 });
      }
    }
  }

  return result;
}

/**
 * Get all transitive descendants (downstream) of a node.
 *
 * @param nodeId        - Starting node
 * @param adjacencyList - The adjacency map
 * @param depth         - Optional max traversal depth (undefined = unlimited)
 */
export function getDownstream(
  nodeId: string,
  adjacencyList: AdjacencyList,
  depth?: number,
): Set<string> {
  const result = new Set<string>();
  const queue: Array<{ id: string; d: number }> = [{ id: nodeId, d: 0 }];

  while (queue.length > 0) {
    const { id, d } = queue.shift()!;
    const entry = adjacencyList.get(id);
    if (!entry) continue;

    for (const down of entry.downstream) {
      if (result.has(down)) continue;
      result.add(down);
      if (depth === undefined || d + 1 < depth) {
        queue.push({ id: down, d: d + 1 });
      }
    }
  }

  return result;
}

/**
 * Get the full dependency chain for a node (upstream + downstream).
 */
export function getChain(nodeId: string, adjacencyList: AdjacencyList): Set<string> {
  const up = getUpstream(nodeId, adjacencyList);
  const down = getDownstream(nodeId, adjacencyList);
  return new Set([...up, ...down]);
}

// ---------------------------------------------------------------------------
// criticalPath  (longest path in a DAG)
// ---------------------------------------------------------------------------

/**
 * Compute the critical path (longest weighted path) through the graph.
 *
 * Uses topological ordering + dynamic programming.  If the graph contains
 * cycles, returns an empty array.
 *
 * @param adjacencyList - The adjacency map
 * @param weightFn      - Optional function returning the weight of a node (default: 1)
 * @returns Ordered array of node IDs forming the critical path
 */
export function criticalPath(
  adjacencyList: AdjacencyList,
  weightFn: WeightFn = () => 1,
): string[] {
  const sorted = topologicalSort(adjacencyList);
  if (sorted.length === 0) return [];

  // dist[node] = longest distance from any source to this node
  const dist = new Map<string, number>();
  const prev = new Map<string, string | null>();

  for (const node of sorted) {
    dist.set(node, weightFn(node));
    prev.set(node, null);
  }

  for (const node of sorted) {
    const entry = adjacencyList.get(node);
    if (!entry) continue;

    const currentDist = dist.get(node) ?? 0;
    for (const down of entry.downstream) {
      const candidate = currentDist + weightFn(down);
      if (candidate > (dist.get(down) ?? 0)) {
        dist.set(down, candidate);
        prev.set(down, node);
      }
    }
  }

  // Find the node with the maximum distance
  let maxNode = sorted[0];
  let maxDist = dist.get(maxNode) ?? 0;
  for (const node of sorted) {
    const d = dist.get(node) ?? 0;
    if (d > maxDist) {
      maxDist = d;
      maxNode = node;
    }
  }

  // Backtrack to build the path
  const path: string[] = [];
  let current: string | null = maxNode;
  while (current !== null) {
    path.unshift(current);
    current = prev.get(current) ?? null;
  }

  return path;
}

// ---------------------------------------------------------------------------
// topologicalSort  (Kahn's algorithm)
// ---------------------------------------------------------------------------

/**
 * Produce a topological ordering of the graph.
 *
 * Returns an empty array if the graph contains cycles.
 */
export function topologicalSort(adjacencyList: AdjacencyList): string[] {
  const inDegree = new Map<string, number>();

  for (const [nodeId, entry] of adjacencyList) {
    if (!inDegree.has(nodeId)) inDegree.set(nodeId, 0);
    for (const down of entry.downstream) {
      inDegree.set(down, (inDegree.get(down) ?? 0) + 1);
    }
  }

  const queue: string[] = [];
  for (const [nodeId, deg] of inDegree) {
    if (deg === 0) queue.push(nodeId);
  }

  const sorted: string[] = [];
  while (queue.length > 0) {
    const node = queue.shift()!;
    sorted.push(node);

    const entry = adjacencyList.get(node);
    if (!entry) continue;
    for (const down of entry.downstream) {
      const newDeg = (inDegree.get(down) ?? 1) - 1;
      inDegree.set(down, newDeg);
      if (newDeg === 0) queue.push(down);
    }
  }

  // If not all nodes were visited, the graph has cycles
  if (sorted.length !== adjacencyList.size) return [];

  return sorted;
}
