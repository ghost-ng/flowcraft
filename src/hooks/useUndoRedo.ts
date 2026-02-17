// ---------------------------------------------------------------------------
// Undo / Redo Hook
// ---------------------------------------------------------------------------

import { useState, useCallback, useRef } from 'react';

// ---------------------------------------------------------------------------
// Inline types
// ---------------------------------------------------------------------------

export interface Snapshot<N, E> {
  nodes: N[];
  edges: E[];
}

export interface UndoRedoResult<N, E> {
  /** Revert to the previous snapshot. */
  undo: () => Snapshot<N, E> | null;
  /** Re-apply the next snapshot. */
  redo: () => Snapshot<N, E> | null;
  /** Whether there is a snapshot to undo to. */
  canUndo: boolean;
  /** Whether there is a snapshot to redo to. */
  canRedo: boolean;
  /** Capture the current state as a new snapshot (call before mutations). */
  takeSnapshot: (nodes: N[], edges: E[]) => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

const MAX_HISTORY = 50;

/**
 * A simple undo/redo hook that stores snapshots of `{nodes, edges}` state.
 *
 * Usage:
 * ```ts
 * const { undo, redo, canUndo, canRedo, takeSnapshot } = useUndoRedo<FlowNode, FlowEdge>();
 *
 * // Before a mutation:
 * takeSnapshot(currentNodes, currentEdges);
 *
 * // To undo:
 * const prev = undo();
 * if (prev) { setNodes(prev.nodes); setEdges(prev.edges); }
 * ```
 *
 * The hook maintains up to 50 history levels.  Taking a new snapshot while
 * in the middle of the undo stack discards the redo future.
 */
export function useUndoRedo<N = unknown, E = unknown>(): UndoRedoResult<N, E> {
  // We use refs for the history stacks so that the callback identities remain
  // stable (they never depend on the stack contents).  A simple counter state
  // is toggled to trigger re-renders when can-undo/can-redo changes.
  const pastRef = useRef<Snapshot<N, E>[]>([]);
  const futureRef = useRef<Snapshot<N, E>[]>([]);
  const [, setRevision] = useState(0);
  const bump = useCallback(() => setRevision((r) => r + 1), []);

  const takeSnapshot = useCallback(
    (nodes: N[], edges: E[]) => {
      const past = pastRef.current;
      past.push({ nodes: [...nodes], edges: [...edges] });

      // Enforce max history depth
      if (past.length > MAX_HISTORY) {
        past.splice(0, past.length - MAX_HISTORY);
      }

      // Taking a new snapshot invalidates any redo future
      futureRef.current = [];
      bump();
    },
    [bump],
  );

  const undo = useCallback((): Snapshot<N, E> | null => {
    const past = pastRef.current;
    if (past.length === 0) return null;

    const snapshot = past.pop()!;
    futureRef.current.push(snapshot);
    bump();
    return snapshot;
  }, [bump]);

  const redo = useCallback((): Snapshot<N, E> | null => {
    const future = futureRef.current;
    if (future.length === 0) return null;

    const snapshot = future.pop()!;
    pastRef.current.push(snapshot);
    bump();
    return snapshot;
  }, [bump]);

  return {
    undo,
    redo,
    canUndo: pastRef.current.length > 0,
    canRedo: futureRef.current.length > 0,
    takeSnapshot,
  };
}
