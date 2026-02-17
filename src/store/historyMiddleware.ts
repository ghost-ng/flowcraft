import { type StoreApi, type StateCreator } from 'zustand';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Snapshot stored on the undo/redo stacks.
 * `groupId` is non-null when the snapshot belongs to a batched operation.
 */
interface HistoryEntry<T> {
  state: T;
  groupId: string | null;
  timestamp: number;
}

/** The temporal (undo/redo) slice injected into the wrapped store. */
export interface TemporalState {
  /** Undo the last action (or entire group). */
  undo: () => void;
  /** Redo the previously undone action (or entire group). */
  redo: () => void;
  /** Whether there are any undo entries. */
  canUndo: () => boolean;
  /** Whether there are any redo entries. */
  canRedo: () => boolean;
  /**
   * Begin a logical group. All state changes until `endGroup()` are collapsed
   * into a single undo step.
   */
  startGroup: () => void;
  /** End the current group. */
  endGroup: () => void;
  /** Clear all history. */
  clearHistory: () => void;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export interface TemporalOptions<T> {
  /** Maximum number of undo levels (default 50). */
  limit?: number;
  /**
   * Pick only the keys from state that should be tracked.  If omitted the
   * entire state object is snapshotted (actions / functions are automatically
   * stripped).
   */
  partialize?: (state: T) => Partial<T>;
  /**
   * Equality function used to skip duplicate snapshots.
   * Receives the partialised old & new state.  Return `true` to consider
   * them equal (i.e. skip recording).
   */
  equality?: (a: Partial<T>, b: Partial<T>) => boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let _groupCounter = 0;

function generateGroupId(): string {
  return `grp_${++_groupCounter}_${Date.now()}`;
}

/** Shallow-clone only non-function values from an object. */
function stripFunctions<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  for (const key of Object.keys(obj) as (keyof T)[]) {
    if (typeof obj[key] !== 'function') {
      result[key] = obj[key];
    }
  }
  return result;
}

/** Default shallow equality. */
function shallowEqual<T extends Record<string, unknown>>(a: Partial<T>, b: Partial<T>): boolean {
  const keysA = Object.keys(a) as (keyof T)[];
  const keysB = Object.keys(b) as (keyof T)[];
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (a[key] !== b[key]) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

/**
 * A Zustand middleware that adds undo / redo (temporal) capabilities.
 *
 * Usage:
 * ```ts
 * const useMyStore = create<MyState & TemporalState>()(
 *   temporal(
 *     (set, get) => ({
 *       count: 0,
 *       increment: () => set(s => ({ count: s.count + 1 })),
 *     }),
 *     { limit: 50 },
 *   ),
 * );
 * ```
 */
export function temporal<T extends Record<string, unknown>>(
  config: StateCreator<T & TemporalState, [], []>,
  options: TemporalOptions<T> = {},
): StateCreator<T & TemporalState, [], []> {
  const { limit = 50, partialize, equality = shallowEqual } = options;

  return (set, get, api) => {
    // Internal stacks
    const undoStack: HistoryEntry<Partial<T>>[] = [];
    const redoStack: HistoryEntry<Partial<T>>[] = [];
    let activeGroupId: string | null = null;
    let isPaused = false; // suppress recording during undo/redo

    /** Grab the trackable slice of state. */
    function snap(): Partial<T> {
      const raw = get() as T;
      return partialize ? partialize(raw) : stripFunctions(raw) as Partial<T>;
    }

    /** Push a snapshot onto the undo stack (respecting limit). */
    function pushUndo(entry: HistoryEntry<Partial<T>>): void {
      undoStack.push(entry);
      while (undoStack.length > limit) {
        undoStack.shift();
      }
    }

    // -- Temporal actions ----------------------------------------

    const temporalActions: TemporalState = {
      undo: () => {
        if (undoStack.length === 0) return;

        isPaused = true;

        // Snapshot current state for redo
        const currentSnap = snap();
        const lastEntry = undoStack[undoStack.length - 1];

        if (lastEntry.groupId) {
          // Pop everything in this group
          const groupId = lastEntry.groupId;
          const groupEntries: HistoryEntry<Partial<T>>[] = [];
          while (
            undoStack.length > 0 &&
            undoStack[undoStack.length - 1].groupId === groupId
          ) {
            groupEntries.push(undoStack.pop()!);
          }
          // Push current state to redo as a single entry representing the group
          redoStack.push({
            state: currentSnap,
            groupId,
            timestamp: Date.now(),
          });
          // Restore the state from the earliest entry in the group
          const earliest = groupEntries[groupEntries.length - 1];
          set(earliest.state as Partial<T & TemporalState>);
        } else {
          const entry = undoStack.pop()!;
          redoStack.push({
            state: currentSnap,
            groupId: null,
            timestamp: Date.now(),
          });
          set(entry.state as Partial<T & TemporalState>);
        }

        isPaused = false;
      },

      redo: () => {
        if (redoStack.length === 0) return;

        isPaused = true;

        const currentSnap = snap();
        const entry = redoStack.pop()!;

        pushUndo({
          state: currentSnap,
          groupId: entry.groupId,
          timestamp: Date.now(),
        });

        set(entry.state as Partial<T & TemporalState>);

        isPaused = false;
      },

      canUndo: () => undoStack.length > 0,
      canRedo: () => redoStack.length > 0,

      startGroup: () => {
        activeGroupId = generateGroupId();
      },

      endGroup: () => {
        activeGroupId = null;
      },

      clearHistory: () => {
        undoStack.length = 0;
        redoStack.length = 0;
      },
    };

    // -- Wrap `set` to capture snapshots -------------------------

    const originalSet = set;

    const trackedSet: typeof set = ((...args: unknown[]) => {
      if (!isPaused) {
        const before = snap();
        (originalSet as Function)(...args);
        const after = snap();

        // Only record if something actually changed
        if (!equality(before, after)) {
          pushUndo({
            state: before,
            groupId: activeGroupId,
            timestamp: Date.now(),
          });
          // Any new change clears the redo stack
          redoStack.length = 0;
        }
      } else {
        (originalSet as Function)(...args);
      }
    }) as typeof set;

    // Build the store using the wrapped set
    const initialState = config(trackedSet, get, api);

    return {
      ...initialState,
      ...temporalActions,
    };
  };
}

// ---------------------------------------------------------------------------
// Convenience: standalone history store
// ---------------------------------------------------------------------------

/**
 * Creates a standalone history controller for an existing store.
 *
 * This is useful when you want the history middleware to live outside
 * the main store (e.g. for the flow store which already uses immer).
 *
 * Usage:
 * ```ts
 * const history = createHistoryController(useFlowStore, {
 *   limit: 50,
 *   partialize: (s) => ({ nodes: s.nodes, edges: s.edges }),
 * });
 *
 * // In a component or handler:
 * history.capture();          // manually snapshot
 * history.undo();
 * history.redo();
 * history.startGroup();
 * // ... multiple operations ...
 * history.endGroup();
 * ```
 */
export interface HistoryController<_T = unknown> {
  /** Manually capture the current state as an undo point. */
  capture: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  startGroup: () => void;
  endGroup: () => void;
  clearHistory: () => void;
}

export function createHistoryController<T extends Record<string, unknown>>(
  store: StoreApi<T>,
  options: TemporalOptions<T> = {},
): HistoryController<T> {
  const { limit = 50, partialize } = options;

  const undoStack: HistoryEntry<Partial<T>>[] = [];
  const redoStack: HistoryEntry<Partial<T>>[] = [];
  let activeGroupId: string | null = null;

  function snap(): Partial<T> {
    const raw = store.getState();
    return partialize ? partialize(raw) : (stripFunctions(raw) as Partial<T>);
  }

  function pushUndo(entry: HistoryEntry<Partial<T>>): void {
    undoStack.push(entry);
    while (undoStack.length > limit) {
      undoStack.shift();
    }
  }

  return {
    capture: () => {
      pushUndo({
        state: snap(),
        groupId: activeGroupId,
        timestamp: Date.now(),
      });
      redoStack.length = 0;
    },

    undo: () => {
      if (undoStack.length === 0) return;
      const currentSnap = snap();
      const lastEntry = undoStack[undoStack.length - 1];

      if (lastEntry.groupId) {
        const groupId = lastEntry.groupId;
        const groupEntries: HistoryEntry<Partial<T>>[] = [];
        while (
          undoStack.length > 0 &&
          undoStack[undoStack.length - 1].groupId === groupId
        ) {
          groupEntries.push(undoStack.pop()!);
        }
        redoStack.push({ state: currentSnap, groupId, timestamp: Date.now() });
        const earliest = groupEntries[groupEntries.length - 1];
        store.setState(earliest.state as Partial<T>);
      } else {
        const entry = undoStack.pop()!;
        redoStack.push({ state: currentSnap, groupId: null, timestamp: Date.now() });
        store.setState(entry.state as Partial<T>);
      }
    },

    redo: () => {
      if (redoStack.length === 0) return;
      const currentSnap = snap();
      const entry = redoStack.pop()!;

      pushUndo({ state: currentSnap, groupId: entry.groupId, timestamp: Date.now() });
      store.setState(entry.state as Partial<T>);
    },

    canUndo: () => undoStack.length > 0,
    canRedo: () => redoStack.length > 0,

    startGroup: () => {
      activeGroupId = generateGroupId();
    },

    endGroup: () => {
      activeGroupId = null;
    },

    clearHistory: () => {
      undoStack.length = 0;
      redoStack.length = 0;
    },
  };
}
