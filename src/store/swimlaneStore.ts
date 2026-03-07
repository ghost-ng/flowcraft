import { create, type StoreApi } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { generateId } from '../utils/idGenerator';

// ---------------------------------------------------------------------------
// Inline types
// ---------------------------------------------------------------------------

export type SwimlaneOrientation = 'horizontal' | 'vertical';
export type BorderStyleType = 'solid' | 'dashed' | 'dotted' | 'none';

export interface SwimlaneItem {
  id: string;
  label: string;
  color: string;
  collapsed: boolean;
  /** Pixel size (width for vertical lanes, height for horizontal lanes) */
  size: number;
  order: number;
  /** Whether the lane label is visible on the canvas (default true) */
  showLabel?: boolean;
  /** Whether the lane color indicator is visible on the canvas (default true) */
  showColor?: boolean;
  /** When true, the lane background, header, and all nodes/edges in this lane are hidden */
  hidden?: boolean;
  /** Lane background opacity (0-100, default uses theme value: ~12 dark / ~15 light) */
  colorOpacity?: number;
}

export interface BorderConfig {
  color: string;
  width: number;
  style: BorderStyleType;
  radius: number;
}

export interface DividerConfig {
  color: string;
  width: number;
  style: BorderStyleType;
}

export interface SwimlaneConfig {
  orientation: SwimlaneOrientation;
  containerTitle: string;
  horizontal: SwimlaneItem[];
  vertical: SwimlaneItem[];
  containerBorder?: BorderConfig;
  dividerStyle?: DividerConfig;
  labelFontSize?: number;
  labelRotation?: number;
  /** Width of horizontal lane headers in px (default 48) */
  hHeaderWidth?: number;
  /** Height of vertical lane headers in px (default 32) */
  vHeaderHeight?: number;
  /** Container title font size in px (default 13) */
  titleFontSize?: number;
  /** Container title color (default auto based on dark mode) */
  titleColor?: string;
  /** Container title font family */
  titleFontFamily?: string;
  /** Width of the container when not determined by vertical lanes (default 800) */
  containerWidth?: number;
  /** Height of the container when not determined by horizontal lanes (default 400) */
  containerHeight?: number;
}

/** A single swimlane container on the canvas */
export interface SwimlaneContainer {
  id: string;
  config: SwimlaneConfig;
  containerOffset: { x: number; y: number };
  selected: boolean;
}

export interface SwimlaneState {
  // ---- state --------------------------------------------------
  /** All swimlane containers on the canvas */
  containers: SwimlaneContainer[];
  /** The currently-focused container for panel editing */
  activeContainerId: string | null;
  isCreating: boolean;
  editingLaneId: string | null;
  /** Optional: container ID to target when creating via palette drop */
  creatingForContainerId: string | null;

  // ---- container-level actions --------------------------------
  addContainer: (container: SwimlaneContainer) => void;
  removeContainer: (containerId: string) => void;
  setActiveContainerId: (containerId: string | null) => void;
  setContainerOffset: (offset: { x: number; y: number }, containerId?: string) => void;
  setSwimlaneSelected: (selected: boolean, containerId?: string, additive?: boolean) => void;

  // ---- lane-level actions (operate on active container) --------
  addLane: (orientation: SwimlaneOrientation, lane: SwimlaneItem) => void;
  removeLane: (orientation: SwimlaneOrientation, laneId: string) => void;
  updateLane: (
    orientation: SwimlaneOrientation,
    laneId: string,
    patch: Partial<Omit<SwimlaneItem, 'id'>>,
  ) => void;
  reorderLanes: (orientation: SwimlaneOrientation, orderedIds: string[]) => void;
  setOrientation: (orientation: SwimlaneOrientation) => void;
  setContainerTitle: (title: string) => void;
  toggleCollapsed: (orientation: SwimlaneOrientation, laneId: string) => void;

  updateContainerBorder: (patch: Partial<BorderConfig>) => void;
  updateDividerStyle: (patch: Partial<DividerConfig>) => void;
  updateLabelConfig: (patch: { labelFontSize?: number; labelRotation?: number; hHeaderWidth?: number; vHeaderHeight?: number }) => void;
  updateTitleConfig: (patch: { titleFontSize?: number; titleColor?: string; titleFontFamily?: string }) => void;
  updateContainerSize: (patch: { containerWidth?: number; containerHeight?: number }) => void;

  /** Proportionally resize all visible lanes in the given orientation to fit a new total size */
  resizeLanes: (orientation: SwimlaneOrientation, newTotalSize: number) => void;

  /** Remove all lanes (horizontal + vertical) from the active container */
  clearAllLanes: () => void;

  /** Remove ALL containers entirely */
  clearAllContainers: () => void;

  setIsCreating: (creating: boolean) => void;
  setEditingLaneId: (laneId: string | null) => void;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_CONFIG: SwimlaneConfig = {
  orientation: 'horizontal',
  containerTitle: '',
  horizontal: [],
  vertical: [],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getLanes(config: SwimlaneConfig, orientation: SwimlaneOrientation): SwimlaneItem[] {
  return orientation === 'horizontal' ? config.horizontal : config.vertical;
}

function setLanes(
  config: SwimlaneConfig,
  orientation: SwimlaneOrientation,
  lanes: SwimlaneItem[],
): void {
  if (orientation === 'horizontal') {
    config.horizontal = lanes;
  } else {
    config.vertical = lanes;
  }
}

/** Get the active container from state (immer draft) */
function getActive(state: SwimlaneState): SwimlaneContainer | undefined {
  return state.containers.find((c) => c.id === state.activeContainerId);
}

/** Get a container by ID, falling back to active */
function getContainer(state: SwimlaneState, containerId?: string): SwimlaneContainer | undefined {
  if (containerId) return state.containers.find((c) => c.id === containerId);
  return getActive(state);
}

// ---------------------------------------------------------------------------
// Selector helpers — use these in components instead of s.config directly
// ---------------------------------------------------------------------------

/** Select the active container's config. Returns empty default if none active. */
export function selectActiveConfig(state: SwimlaneState): SwimlaneConfig {
  const container = state.containers.find((c) => c.id === state.activeContainerId);
  return container?.config ?? DEFAULT_CONFIG;
}

/** Select the active container's offset */
export function selectActiveOffset(state: SwimlaneState): { x: number; y: number } {
  const container = state.containers.find((c) => c.id === state.activeContainerId);
  return container?.containerOffset ?? { x: 0, y: 0 };
}

/** Select whether the active container is selected */
export function selectActiveSelected(state: SwimlaneState): boolean {
  const container = state.containers.find((c) => c.id === state.activeContainerId);
  return container?.selected ?? false;
}

/** Create a new default container at a given position */
export function createDefaultContainer(
  offset: { x: number; y: number },
  overrides?: Partial<SwimlaneConfig>,
): SwimlaneContainer {
  return {
    id: generateId('swimlane'),
    config: { ...DEFAULT_CONFIG, ...overrides, horizontal: [], vertical: [] },
    containerOffset: offset,
    selected: false,
  };
}

// ---------------------------------------------------------------------------
// Backward-compat: find which container owns a given lane ID
// ---------------------------------------------------------------------------

/** Find the container that owns a particular lane ID */
export function findContainerByLaneId(
  state: SwimlaneState,
  laneId: string,
): SwimlaneContainer | undefined {
  return state.containers.find(
    (c) =>
      c.config.horizontal.some((l) => l.id === laneId) ||
      c.config.vertical.some((l) => l.id === laneId),
  );
}

// ---------------------------------------------------------------------------
// Store (immer for easy nested mutations)
// ---------------------------------------------------------------------------

export const useSwimlaneStore = create<SwimlaneState>()(
  immer((set) => ({
    // -- initial state -------------------------------------------
    containers: [],
    activeContainerId: null,
    isCreating: false,
    editingLaneId: null,
    creatingForContainerId: null,

    // -- container-level actions ---------------------------------
    addContainer: (container) => {
      set((state) => {
        state.containers.push(container);
        // Auto-select the new container
        state.activeContainerId = container.id;
      });
    },

    removeContainer: (containerId) => {
      set((state) => {
        state.containers = state.containers.filter((c) => c.id !== containerId);
        if (state.activeContainerId === containerId) {
          state.activeContainerId = state.containers[0]?.id ?? null;
        }
      });
    },

    setActiveContainerId: (containerId) => {
      set((state) => {
        state.activeContainerId = containerId;
      });
    },

    setContainerOffset: (offset, containerId?) => {
      set((state) => {
        const container = getContainer(state, containerId);
        if (container) container.containerOffset = offset;
      });
    },

    setSwimlaneSelected: (selected, containerId?, additive?) => {
      set((state) => {
        const container = getContainer(state, containerId);
        if (container) {
          // When selecting (not deselecting) and not additive, deselect all others first
          if (selected && !additive) {
            for (const c of state.containers) {
              if (c.id !== container.id) c.selected = false;
            }
          }
          container.selected = selected;
          // When selecting a container, also make it the active one for panel editing
          if (selected && containerId) {
            state.activeContainerId = containerId;
          }
        }
      });
    },

    // -- lane-level actions (active container) -------------------
    addLane: (orientation, lane) => {
      set((state) => {
        let container = getActive(state);
        // Auto-create a container if none exists
        if (!container) {
          const newC: SwimlaneContainer = {
            id: generateId('swimlane'),
            config: { ...DEFAULT_CONFIG },
            containerOffset: { x: 0, y: 0 },
            selected: false,
          };
          state.containers.push(newC);
          state.activeContainerId = newC.id;
          container = state.containers[state.containers.length - 1];
        }
        const lanes = getLanes(container.config, orientation);
        lanes.push({ ...lane, order: lanes.length });
        setLanes(container.config, orientation, lanes);
      });
    },

    removeLane: (orientation, laneId) => {
      set((state) => {
        const container = getActive(state);
        if (!container) return;
        const lanes = getLanes(container.config, orientation).filter(
          (l) => l.id !== laneId,
        );
        lanes.forEach((l, i) => {
          l.order = i;
        });
        setLanes(container.config, orientation, lanes);
      });
    },

    updateLane: (orientation, laneId, patch) => {
      set((state) => {
        // Search all containers for the lane (lane edits can come from headers)
        for (const container of state.containers) {
          const lane = getLanes(container.config, orientation).find(
            (l) => l.id === laneId,
          );
          if (lane) {
            Object.assign(lane, patch);
            return;
          }
        }
      });
    },

    reorderLanes: (orientation, orderedIds) => {
      set((state) => {
        const container = getActive(state);
        if (!container) return;
        const lanes = getLanes(container.config, orientation);
        const byId = new Map(lanes.map((l) => [l.id, l]));
        const reordered: SwimlaneItem[] = [];
        for (let i = 0; i < orderedIds.length; i++) {
          const lane = byId.get(orderedIds[i]);
          if (lane) {
            lane.order = i;
            reordered.push(lane);
          }
        }
        setLanes(container.config, orientation, reordered);
      });
    },

    setOrientation: (orientation) => {
      set((state) => {
        const container = getActive(state);
        if (container) container.config.orientation = orientation;
      });
    },

    setContainerTitle: (title) => {
      set((state) => {
        const container = getActive(state);
        if (container) container.config.containerTitle = title;
      });
    },

    toggleCollapsed: (orientation, laneId) => {
      set((state) => {
        // Search all containers
        for (const container of state.containers) {
          const lane = getLanes(container.config, orientation).find(
            (l) => l.id === laneId,
          );
          if (lane) {
            lane.collapsed = !lane.collapsed;
            return;
          }
        }
      });
    },

    updateContainerBorder: (patch) => {
      set((state) => {
        const container = getActive(state);
        if (!container) return;
        container.config.containerBorder = {
          color: container.config.containerBorder?.color ?? '#94a3b8',
          width: container.config.containerBorder?.width ?? 1,
          style: container.config.containerBorder?.style ?? 'solid',
          radius: container.config.containerBorder?.radius ?? 4,
          ...patch,
        };
      });
    },

    updateDividerStyle: (patch) => {
      set((state) => {
        const container = getActive(state);
        if (!container) return;
        container.config.dividerStyle = {
          color: container.config.dividerStyle?.color ?? '',
          width: container.config.dividerStyle?.width ?? 1,
          style: container.config.dividerStyle?.style ?? 'solid',
          ...patch,
        };
      });
    },

    updateLabelConfig: (patch) => {
      set((state) => {
        const container = getActive(state);
        if (!container) return;
        if (patch.labelFontSize !== undefined) {
          container.config.labelFontSize = patch.labelFontSize;
        }
        if (patch.labelRotation !== undefined) {
          container.config.labelRotation = patch.labelRotation;
        }
        if (patch.hHeaderWidth !== undefined) {
          container.config.hHeaderWidth = patch.hHeaderWidth;
        }
        if (patch.vHeaderHeight !== undefined) {
          container.config.vHeaderHeight = patch.vHeaderHeight;
        }
      });
    },

    updateTitleConfig: (patch) => {
      set((state) => {
        const container = getActive(state);
        if (!container) return;
        if (patch.titleFontSize !== undefined) {
          container.config.titleFontSize = patch.titleFontSize;
        }
        if (patch.titleColor !== undefined) {
          container.config.titleColor = patch.titleColor;
        }
        if (patch.titleFontFamily !== undefined) {
          container.config.titleFontFamily = patch.titleFontFamily;
        }
      });
    },

    updateContainerSize: (patch) => {
      set((state) => {
        const container = getActive(state);
        if (!container) return;
        if (patch.containerWidth !== undefined) {
          container.config.containerWidth = patch.containerWidth;
        }
        if (patch.containerHeight !== undefined) {
          container.config.containerHeight = patch.containerHeight;
        }
      });
    },

    resizeLanes: (orientation, newTotalSize) => {
      set((state) => {
        const container = getActive(state);
        if (!container) return;
        const lanes = getLanes(container.config, orientation);
        const resizable = lanes.filter((l) => !l.hidden && !l.collapsed);
        if (resizable.length === 0) return;

        const currentTotal = resizable.reduce((sum, l) => sum + l.size, 0);
        if (currentTotal <= 0) return;

        const MIN_LANE = 60;
        const scale = newTotalSize / currentTotal;

        for (const lane of resizable) {
          lane.size = Math.max(MIN_LANE, Math.round(lane.size * scale));
        }
      });
    },

    clearAllLanes: () => {
      set((state) => {
        const container = getActive(state);
        if (!container) return;
        container.config.horizontal = [];
        container.config.vertical = [];
        container.selected = false;
      });
    },

    clearAllContainers: () => {
      set((state) => {
        state.containers = [];
        state.activeContainerId = null;
      });
    },

    setIsCreating: (creating) => {
      set((state) => {
        state.isCreating = creating;
      });
    },

    setEditingLaneId: (laneId) => {
      set((state) => {
        state.editingLaneId = laneId;
      });
    },
  })),
);

/** Direct access to the store (useful outside of React components) */
export const swimlaneStore: StoreApi<SwimlaneState> = useSwimlaneStore;
