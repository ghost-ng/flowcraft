import { create, type StoreApi } from 'zustand';
import { immer } from 'zustand/middleware/immer';

// ---------------------------------------------------------------------------
// Inline types
// ---------------------------------------------------------------------------

export interface LegendItem {
  id: string;
  label: string;
  color: string;
  shape?: string;
  icon?: string;
  order: number;
}

export interface LegendStyle {
  bgColor: string;
  borderColor: string;
  borderWidth: number;
  fontSize: number;
  opacity: number;
  width: number;
}

export interface LegendConfig {
  items: LegendItem[];
  visible: boolean;
  title: string;
  position: { x: number; y: number };
  style: LegendStyle;
}

export interface LegendState {
  config: LegendConfig;

  addItem: (item: LegendItem) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, patch: Partial<Omit<LegendItem, 'id'>>) => void;
  reorderItems: (orderedIds: string[]) => void;
  setVisible: (visible: boolean) => void;
  setTitle: (title: string) => void;
  setPosition: (pos: { x: number; y: number }) => void;
  updateStyle: (patch: Partial<LegendStyle>) => void;
  resetLegend: () => void;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_STYLE: LegendStyle = {
  bgColor: '#ffffff',
  borderColor: '#e2e8f0',
  borderWidth: 1,
  fontSize: 11,
  opacity: 1,
  width: 180,
};

const DEFAULT_CONFIG: LegendConfig = {
  items: [],
  visible: true,
  title: 'Legend',
  position: { x: 50, y: 50 },
  style: { ...DEFAULT_STYLE },
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useLegendStore = create<LegendState>()(
  immer((set) => ({
    config: { ...DEFAULT_CONFIG, style: { ...DEFAULT_STYLE } },

    addItem: (item) => {
      set((state) => {
        state.config.items.push({ ...item, order: state.config.items.length });
      });
    },

    removeItem: (id) => {
      set((state) => {
        state.config.items = state.config.items.filter((i) => i.id !== id);
        state.config.items.forEach((i, idx) => { i.order = idx; });
      });
    },

    updateItem: (id, patch) => {
      set((state) => {
        const item = state.config.items.find((i) => i.id === id);
        if (item) Object.assign(item, patch);
      });
    },

    reorderItems: (orderedIds) => {
      set((state) => {
        const byId = new Map(state.config.items.map((i) => [i.id, i]));
        const reordered: LegendItem[] = [];
        for (let idx = 0; idx < orderedIds.length; idx++) {
          const item = byId.get(orderedIds[idx]);
          if (item) {
            item.order = idx;
            reordered.push(item);
          }
        }
        state.config.items = reordered;
      });
    },

    setVisible: (visible) => {
      set((state) => { state.config.visible = visible; });
    },

    setTitle: (title) => {
      set((state) => { state.config.title = title; });
    },

    setPosition: (pos) => {
      set((state) => { state.config.position = pos; });
    },

    updateStyle: (patch) => {
      set((state) => { Object.assign(state.config.style, patch); });
    },

    resetLegend: () => {
      set((state) => {
        state.config.items = [];
        state.config.visible = true;
        state.config.title = 'Legend';
        state.config.position = { x: 50, y: 50 };
        state.config.style = { ...DEFAULT_STYLE };
      });
    },
  })),
);

/** Direct access outside React components */
export const legendStore: StoreApi<LegendState> = useLegendStore;
