import { create, type StoreApi } from 'zustand';
import { immer } from 'zustand/middleware/immer';

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
}

export interface SwimlaneState {
  // ---- state --------------------------------------------------
  config: SwimlaneConfig;
  isCreating: boolean;
  editingLaneId: string | null;
  containerOffset: { x: number; y: number };

  // ---- actions ------------------------------------------------
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
  setContainerOffset: (offset: { x: number; y: number }) => void;

  updateContainerBorder: (patch: Partial<BorderConfig>) => void;
  updateDividerStyle: (patch: Partial<DividerConfig>) => void;
  updateLabelConfig: (patch: { labelFontSize?: number; labelRotation?: number }) => void;

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

// ---------------------------------------------------------------------------
// Store (immer for easy nested mutations)
// ---------------------------------------------------------------------------

export const useSwimlaneStore = create<SwimlaneState>()(
  immer((set) => ({
    // -- initial state -------------------------------------------
    config: DEFAULT_CONFIG,
    isCreating: false,
    editingLaneId: null,
    containerOffset: { x: 0, y: 0 },

    // -- actions -------------------------------------------------
    addLane: (orientation, lane) => {
      set((state) => {
        const lanes = getLanes(state.config, orientation);
        lanes.push({ ...lane, order: lanes.length });
        setLanes(state.config, orientation, lanes);
      });
    },

    removeLane: (orientation, laneId) => {
      set((state) => {
        const lanes = getLanes(state.config, orientation).filter(
          (l) => l.id !== laneId,
        );
        // Re-index order
        lanes.forEach((l, i) => {
          l.order = i;
        });
        setLanes(state.config, orientation, lanes);
      });
    },

    updateLane: (orientation, laneId, patch) => {
      set((state) => {
        const lane = getLanes(state.config, orientation).find(
          (l) => l.id === laneId,
        );
        if (lane) {
          Object.assign(lane, patch);
        }
      });
    },

    reorderLanes: (orientation, orderedIds) => {
      set((state) => {
        const lanes = getLanes(state.config, orientation);
        const byId = new Map(lanes.map((l) => [l.id, l]));
        const reordered: SwimlaneItem[] = [];
        for (let i = 0; i < orderedIds.length; i++) {
          const lane = byId.get(orderedIds[i]);
          if (lane) {
            lane.order = i;
            reordered.push(lane);
          }
        }
        setLanes(state.config, orientation, reordered);
      });
    },

    setOrientation: (orientation) => {
      set((state) => {
        state.config.orientation = orientation;
      });
    },

    setContainerTitle: (title) => {
      set((state) => {
        state.config.containerTitle = title;
      });
    },

    toggleCollapsed: (orientation, laneId) => {
      set((state) => {
        const lane = getLanes(state.config, orientation).find(
          (l) => l.id === laneId,
        );
        if (lane) {
          lane.collapsed = !lane.collapsed;
        }
      });
    },

    setContainerOffset: (offset) => {
      set((state) => {
        state.containerOffset = offset;
      });
    },

    updateContainerBorder: (patch) => {
      set((state) => {
        state.config.containerBorder = {
          color: state.config.containerBorder?.color ?? '#94a3b8',
          width: state.config.containerBorder?.width ?? 1,
          style: state.config.containerBorder?.style ?? 'solid',
          radius: state.config.containerBorder?.radius ?? 4,
          ...patch,
        };
      });
    },

    updateDividerStyle: (patch) => {
      set((state) => {
        state.config.dividerStyle = {
          color: state.config.dividerStyle?.color ?? '',
          width: state.config.dividerStyle?.width ?? 1,
          style: state.config.dividerStyle?.style ?? 'solid',
          ...patch,
        };
      });
    },

    updateLabelConfig: (patch) => {
      set((state) => {
        if (patch.labelFontSize !== undefined) {
          state.config.labelFontSize = patch.labelFontSize;
        }
        if (patch.labelRotation !== undefined) {
          state.config.labelRotation = patch.labelRotation;
        }
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
