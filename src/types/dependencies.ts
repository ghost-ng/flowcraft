// ---------------------------------------------------------------------------
// dependencies.ts -- Dependency chain analysis types
// ---------------------------------------------------------------------------

import type { DependencyType } from './edges';

// ---- A single link in a dependency chain ----------------------------------

export interface DependencyLink {
  /** Source node id. */
  from: string;
  /** Target node id. */
  to: string;
  /** Edge id connecting the two nodes. */
  edgeId: string;
  /** The semantic type of the dependency. */
  type: DependencyType;
}

// ---- An ordered chain of dependent nodes ----------------------------------

export interface DependencyChain {
  /** Unique identifier for this chain. */
  id: string;
  /** Human-readable name (auto-generated or user-defined). */
  name?: string;
  /** Ordered list of node ids from start to end. */
  nodeIds: string[];
  /** Links between consecutive nodes in the chain. */
  links: DependencyLink[];
  /** Total "weight" or duration of the chain (application-defined). */
  totalWeight?: number;
  /** Whether this chain is the critical path. */
  isCritical?: boolean;
}

// ---- Critical path result -------------------------------------------------

export interface CriticalPath {
  /** The chain representing the critical (longest) path. */
  chain: DependencyChain;
  /** Total weight / duration of the critical path. */
  totalWeight: number;
  /** Node ids that lie on the critical path. */
  nodeIds: string[];
  /** Edge ids that lie on the critical path. */
  edgeIds: string[];
}

// ---- Aggregate dependency statistics --------------------------------------

export interface DependencyCounts {
  /** Number of incoming dependency edges. */
  incoming: number;
  /** Number of outgoing dependency edges. */
  outgoing: number;
  /** Breakdown by DependencyType. */
  byType: Partial<Record<DependencyType, number>>;
}

export interface DependencyStats {
  /** Total number of dependency edges in the diagram. */
  totalEdges: number;
  /** Number of distinct dependency chains found. */
  chainCount: number;
  /** Per-node dependency counts keyed by node id. */
  perNode: Record<string, DependencyCounts>;
  /** The critical path, if one exists. */
  criticalPath?: CriticalPath;
  /** Whether a cycle was detected in the dependency graph. */
  hasCycle: boolean;
  /** Node ids involved in any detected cycle. */
  cycleNodeIds: string[];
}
