import { create, type StoreApi } from 'zustand';

// ---------------------------------------------------------------------------
// Inline types
// ---------------------------------------------------------------------------

export type DependencyLinkType = 'depends-on' | 'blocks' | 'related';

export interface DependencyState {
  // ---- visibility / display -----------------------------------
  showBadges: boolean;
  showLabels: boolean;
  showReadyBlocked: boolean;
  orphanHighlight: boolean;

  // ---- critical path ------------------------------------------
  criticalPathEnabled: boolean;
  criticalPathColor: string;

  // ---- walk mode (step-through) --------------------------------
  walkModeActive: boolean;
  walkModeNodeId: string | null;
  walkModePath: string[];

  // ---- quick-link mode -----------------------------------------
  quickLinkActive: boolean;
  quickLinkType: DependencyLinkType;

  // ---- highlighting -------------------------------------------
  highlightedChain: Set<string>;

  // ---- computed counts (node-id -> { in, out }) ----------------
  dependencyCounts: Map<string, { in: number; out: number }>;

  // ---- actions ------------------------------------------------
  toggleBadges: () => void;
  setShowBadges: (show: boolean) => void;

  toggleLabels: () => void;
  setShowLabels: (show: boolean) => void;

  toggleReadyBlocked: () => void;
  setShowReadyBlocked: (show: boolean) => void;

  toggleOrphanHighlight: () => void;
  setOrphanHighlight: (show: boolean) => void;

  toggleCriticalPath: () => void;
  setCriticalPathEnabled: (enabled: boolean) => void;
  setCriticalPathColor: (color: string) => void;

  startWalkMode: (startNodeId: string, path: string[]) => void;
  stopWalkMode: () => void;
  walkTo: (nodeId: string) => void;

  startQuickLink: (type: DependencyLinkType) => void;
  stopQuickLink: () => void;
  setQuickLinkType: (type: DependencyLinkType) => void;

  setHighlightedChain: (nodeIds: Set<string>) => void;
  clearHighlightedChain: () => void;

  updateCounts: (counts: Map<string, { in: number; out: number }>) => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useDependencyStore = create<DependencyState>()((set) => ({
  // -- initial state --------------------------------------------
  showBadges: false,
  showLabels: false,
  showReadyBlocked: false,
  orphanHighlight: false,

  criticalPathEnabled: true,
  criticalPathColor: '#e53e3e',

  walkModeActive: false,
  walkModeNodeId: null,
  walkModePath: [],

  quickLinkActive: false,
  quickLinkType: 'depends-on',

  highlightedChain: new Set<string>(),

  dependencyCounts: new Map<string, { in: number; out: number }>(),

  // -- actions --------------------------------------------------
  toggleBadges: () => set((s) => ({ showBadges: !s.showBadges })),
  setShowBadges: (show) => set({ showBadges: show }),

  toggleLabels: () => set((s) => ({ showLabels: !s.showLabels })),
  setShowLabels: (show) => set({ showLabels: show }),

  toggleReadyBlocked: () => set((s) => ({ showReadyBlocked: !s.showReadyBlocked })),
  setShowReadyBlocked: (show) => set({ showReadyBlocked: show }),

  toggleOrphanHighlight: () => set((s) => ({ orphanHighlight: !s.orphanHighlight })),
  setOrphanHighlight: (show) => set({ orphanHighlight: show }),

  toggleCriticalPath: () =>
    set((s) => ({ criticalPathEnabled: !s.criticalPathEnabled })),
  setCriticalPathEnabled: (enabled) => set({ criticalPathEnabled: enabled }),
  setCriticalPathColor: (color) => set({ criticalPathColor: color }),

  startWalkMode: (startNodeId, path) =>
    set({
      walkModeActive: true,
      walkModeNodeId: startNodeId,
      walkModePath: path,
    }),

  stopWalkMode: () =>
    set({
      walkModeActive: false,
      walkModeNodeId: null,
      walkModePath: [],
    }),

  walkTo: (nodeId) =>
    set((s) => {
      if (!s.walkModeActive) return s;
      return { walkModeNodeId: nodeId };
    }),

  startQuickLink: (type) =>
    set({ quickLinkActive: true, quickLinkType: type }),

  stopQuickLink: () => set({ quickLinkActive: false }),

  setQuickLinkType: (type) => set({ quickLinkType: type }),

  setHighlightedChain: (nodeIds) => set({ highlightedChain: nodeIds }),
  clearHighlightedChain: () => set({ highlightedChain: new Set<string>() }),

  updateCounts: (counts) => set({ dependencyCounts: counts }),
}));

/** Direct access to the store (useful outside of React components) */
export const dependencyStore: StoreApi<DependencyState> = useDependencyStore;
