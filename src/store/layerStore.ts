import { create, type StoreApi } from 'zustand';
import { immer } from 'zustand/middleware/immer';

// ---------------------------------------------------------------------------
// Inline types
// ---------------------------------------------------------------------------

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  color: string;
  order: number;
}

export interface LayerState {
  // ---- state --------------------------------------------------
  layers: Layer[];
  activeLayerId: string;

  // ---- actions ------------------------------------------------
  addLayer: (layer: Layer) => void;
  removeLayer: (layerId: string) => void;
  updateLayer: (layerId: string, patch: Partial<Omit<Layer, 'id'>>) => void;
  reorderLayers: (orderedIds: string[]) => void;
  setActiveLayer: (layerId: string) => void;
  toggleVisibility: (layerId: string) => void;
  toggleLock: (layerId: string) => void;
  setOpacity: (layerId: string, opacity: number) => void;
  /** Merge the given layer down into the layer directly below it */
  mergeDown: (layerId: string) => void;
}

// ---------------------------------------------------------------------------
// Default layer
// ---------------------------------------------------------------------------

const DEFAULT_LAYER: Layer = {
  id: 'default',
  name: 'Default',
  visible: true,
  locked: false,
  opacity: 1,
  color: '#6366f1',
  order: 0,
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useLayerStore = create<LayerState>()(
  immer((set) => ({
    // -- initial state -------------------------------------------
    layers: [{ ...DEFAULT_LAYER }],
    activeLayerId: 'default',

    // -- actions -------------------------------------------------
    addLayer: (layer) => {
      set((state) => {
        state.layers.push({ ...layer, order: state.layers.length });
      });
    },

    removeLayer: (layerId) => {
      set((state) => {
        // Prevent removal of the last layer
        if (state.layers.length <= 1) return;

        state.layers = state.layers.filter((l) => l.id !== layerId);

        // Re-index order
        state.layers.forEach((l, i) => {
          l.order = i;
        });

        // If we removed the active layer, activate the first remaining one
        if (state.activeLayerId === layerId) {
          state.activeLayerId = state.layers[0].id;
        }
      });
    },

    updateLayer: (layerId, patch) => {
      set((state) => {
        const layer = state.layers.find((l) => l.id === layerId);
        if (layer) {
          Object.assign(layer, patch);
        }
      });
    },

    reorderLayers: (orderedIds) => {
      set((state) => {
        const byId = new Map(state.layers.map((l) => [l.id, l]));
        const reordered: Layer[] = [];
        for (let i = 0; i < orderedIds.length; i++) {
          const layer = byId.get(orderedIds[i]);
          if (layer) {
            layer.order = i;
            reordered.push(layer);
          }
        }
        state.layers = reordered;
      });
    },

    setActiveLayer: (layerId) => {
      set((state) => {
        state.activeLayerId = layerId;
      });
    },

    toggleVisibility: (layerId) => {
      set((state) => {
        const layer = state.layers.find((l) => l.id === layerId);
        if (layer) {
          layer.visible = !layer.visible;
        }
      });
    },

    toggleLock: (layerId) => {
      set((state) => {
        const layer = state.layers.find((l) => l.id === layerId);
        if (layer) {
          layer.locked = !layer.locked;
        }
      });
    },

    setOpacity: (layerId, opacity) => {
      set((state) => {
        const layer = state.layers.find((l) => l.id === layerId);
        if (layer) {
          layer.opacity = Math.max(0, Math.min(1, opacity));
        }
      });
    },

    mergeDown: (layerId) => {
      set((state) => {
        const index = state.layers.findIndex((l) => l.id === layerId);
        // Can't merge if it's the bottom-most layer
        if (index <= 0) return;

        // The layer below (lower order = rendered first = "below")
        const _targetLayer = state.layers[index - 1];

        // Remove the merged layer
        state.layers.splice(index, 1);

        // Re-index order
        state.layers.forEach((l, i) => {
          l.order = i;
        });

        // If we removed the active layer, activate the target
        if (state.activeLayerId === layerId) {
          state.activeLayerId = _targetLayer.id;
        }
      });
    },
  })),
);

/** Direct access to the store (useful outside of React components) */
export const layerStore: StoreApi<LayerState> = useLayerStore;
