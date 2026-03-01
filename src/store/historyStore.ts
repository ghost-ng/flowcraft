// ---------------------------------------------------------------------------
// History Store — automatic undo/redo via flowStore subscription
// ---------------------------------------------------------------------------
//
// Subscribes to flowStore and captures {nodes, edges} snapshots whenever they
// change.  Rapid mutations (drag, nudge) are debounced into a single undo
// step via a 300 ms idle window.
//
// Usage:
//   import { useHistoryStore } from '@/store/historyStore';
//   const canUndo = useHistoryStore((s) => s.canUndo);
//   useHistoryStore.getState().undo();
// ---------------------------------------------------------------------------

import { create } from 'zustand';
import { useFlowStore } from './flowStore';
import type { FlowNode, FlowEdge } from './flowStore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HistoryEntry {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

interface HistoryState {
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;
}

// ---------------------------------------------------------------------------
// Internal state (module-scoped, not in the Zustand store)
// ---------------------------------------------------------------------------

const MAX_HISTORY = 50;
const DEBOUNCE_MS = 300;

const undoStack: HistoryEntry[] = [];
const redoStack: HistoryEntry[] = [];

/** When true the subscription skips recording (we're applying undo/redo). */
let isPaused = false;

/**
 * Optional callback to check if a store update came from a remote peer.
 * Registered by the collab module when collaboration is active.
 * Remote changes should NOT create undo entries.
 */
let _isRemoteUpdateCheck: (() => boolean) | null = null;

/** Register a remote-update check (called by collab module on init). */
export function registerRemoteUpdateCheck(fn: () => boolean): void {
  _isRemoteUpdateCheck = fn;
}

/** Unregister the remote-update check (called when leaving collaboration). */
export function unregisterRemoteUpdateCheck(): void {
  _isRemoteUpdateCheck = null;
}

/** The "before" state captured at the start of a debounce window. */
let pendingBefore: HistoryEntry | null = null;

/** Debounce timer handle. */
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

/** Last-seen state used to detect actual changes. */
let lastNodes: FlowNode[] = useFlowStore.getState().nodes;
let lastEdges: FlowEdge[] = useFlowStore.getState().edges;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function cloneEntry(nodes: FlowNode[], edges: FlowEdge[]): HistoryEntry {
  return {
    nodes: structuredClone(nodes),
    edges: structuredClone(edges),
  };
}

function syncFlags(): void {
  useHistoryStore.setState({
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
  });
}

function commitPending(): void {
  if (!pendingBefore) return;
  undoStack.push(pendingBefore);
  if (undoStack.length > MAX_HISTORY) undoStack.shift();
  // Any new change invalidates the redo future
  redoStack.length = 0;
  pendingBefore = null;
  syncFlags();
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useHistoryStore = create<HistoryState>()(() => ({
  canUndo: false,
  canRedo: false,

  undo: () => {
    // Flush any pending debounced snapshot first
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
      commitPending();
    }

    if (undoStack.length === 0) return;

    const { nodes: curNodes, edges: curEdges } = useFlowStore.getState();
    redoStack.push(cloneEntry(curNodes, curEdges));

    const entry = undoStack.pop()!;

    isPaused = true;
    useFlowStore.setState({ nodes: entry.nodes, edges: entry.edges });
    // Update tracking refs so the subscription doesn't see a diff
    lastNodes = entry.nodes;
    lastEdges = entry.edges;
    isPaused = false;

    syncFlags();
  },

  redo: () => {
    if (redoStack.length === 0) return;

    const { nodes: curNodes, edges: curEdges } = useFlowStore.getState();
    undoStack.push(cloneEntry(curNodes, curEdges));

    const entry = redoStack.pop()!;

    isPaused = true;
    useFlowStore.setState({ nodes: entry.nodes, edges: entry.edges });
    lastNodes = entry.nodes;
    lastEdges = entry.edges;
    isPaused = false;

    syncFlags();
  },

  clearHistory: () => {
    undoStack.length = 0;
    redoStack.length = 0;
    pendingBefore = null;
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    syncFlags();
  },
}));

// ---------------------------------------------------------------------------
// Subscription — auto-capture on every flowStore change
// ---------------------------------------------------------------------------

useFlowStore.subscribe((state) => {
  if (isPaused) return;
  if (_isRemoteUpdateCheck?.()) return; // Skip remote changes from collaboration peers

  const { nodes, edges } = state;

  // Quick reference check — skip if nothing changed
  if (nodes === lastNodes && edges === lastEdges) return;

  // First change in a debounce window: record "before" from tracking refs
  if (!pendingBefore) {
    pendingBefore = cloneEntry(lastNodes, lastEdges);
  }

  // Update tracking refs to the new state
  lastNodes = nodes;
  lastEdges = edges;

  // Reset debounce timer — commit after 300 ms of idle
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    commitPending();
  }, DEBOUNCE_MS);
});
