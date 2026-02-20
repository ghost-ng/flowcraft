import { create, type StoreApi } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { generateId } from '../utils/idGenerator';
import { useFlowStore, getStatusIndicators, type FlowNodeData } from './flowStore';

// ---------------------------------------------------------------------------
// Inline types
// ---------------------------------------------------------------------------

/** Visual kind tells the legend overlay how to render the swatch */
export type LegendItemKind = 'fill' | 'border' | 'puck' | 'edge' | 'lane';

export interface LegendItem {
  id: string;
  label: string;
  color: string;
  /** Visual kind — determines swatch rendering (default: 'fill') */
  kind?: LegendItemKind;
  /** Border style for 'border' kind items */
  borderStyle?: 'solid' | 'dashed' | 'dotted';
  shape?: string;
  icon?: string;
  order: number;
  /** When true the item is hidden from the canvas overlay but kept in the editor */
  hidden?: boolean;
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

/** Discriminator for which legend to target */
export type LegendKind = 'node' | 'swimlane';

export interface LegendState {
  /** Legend for node/edge colors, outlines, status pucks */
  nodeLegend: LegendConfig;
  /** Legend for swimlane lanes */
  swimlaneLegend: LegendConfig;

  addItem: (which: LegendKind, item: LegendItem) => void;
  removeItem: (which: LegendKind, id: string) => void;
  updateItem: (which: LegendKind, id: string, patch: Partial<Omit<LegendItem, 'id'>>) => void;
  reorderItems: (which: LegendKind, orderedIds: string[]) => void;
  setVisible: (which: LegendKind, visible: boolean) => void;
  setTitle: (which: LegendKind, title: string) => void;
  setPosition: (which: LegendKind, pos: { x: number; y: number }) => void;
  updateStyle: (which: LegendKind, patch: Partial<LegendStyle>) => void;
  resetLegend: (which: LegendKind) => void;

  /** Auto-generate node legend from diagram nodes and edges */
  generateNodeLegend: () => void;
  /** Auto-generate swimlane legend from swimlane lanes */
  generateSwimlaneLegend: (lanes: Array<{ id: string; label: string; color: string }>) => void;
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

const DEFAULT_NODE_LEGEND: LegendConfig = {
  items: [],
  visible: true,
  title: 'Legend',
  position: { x: 50, y: 50 },
  style: { ...DEFAULT_STYLE },
};

const DEFAULT_SWIMLANE_LEGEND: LegendConfig = {
  items: [],
  visible: true,
  title: 'Swimlanes',
  position: { x: 50, y: 300 },
  style: { ...DEFAULT_STYLE },
};

// ---------------------------------------------------------------------------
// Helper — pick the right config by kind
// ---------------------------------------------------------------------------

function getConfig(state: LegendState, which: LegendKind): LegendConfig {
  return which === 'node' ? state.nodeLegend : state.swimlaneLegend;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useLegendStore = create<LegendState>()(
  immer((set) => ({
    nodeLegend: { ...DEFAULT_NODE_LEGEND, style: { ...DEFAULT_STYLE } },
    swimlaneLegend: { ...DEFAULT_SWIMLANE_LEGEND, style: { ...DEFAULT_STYLE } },

    addItem: (which, item) => {
      set((state) => {
        const cfg = getConfig(state, which);
        cfg.items.push({ ...item, order: cfg.items.length });
      });
    },

    removeItem: (which, id) => {
      set((state) => {
        const cfg = getConfig(state, which);
        cfg.items = cfg.items.filter((i) => i.id !== id);
        cfg.items.forEach((i, idx) => { i.order = idx; });
      });
    },

    updateItem: (which, id, patch) => {
      set((state) => {
        const cfg = getConfig(state, which);
        const item = cfg.items.find((i) => i.id === id);
        if (item) Object.assign(item, patch);
      });
    },

    reorderItems: (which, orderedIds) => {
      set((state) => {
        const cfg = getConfig(state, which);
        const byId = new Map(cfg.items.map((i) => [i.id, i]));
        const reordered: LegendItem[] = [];
        for (let idx = 0; idx < orderedIds.length; idx++) {
          const item = byId.get(orderedIds[idx]);
          if (item) {
            item.order = idx;
            reordered.push(item);
          }
        }
        cfg.items = reordered;
      });
    },

    setVisible: (which, visible) => {
      set((state) => { getConfig(state, which).visible = visible; });
    },

    setTitle: (which, title) => {
      set((state) => { getConfig(state, which).title = title; });
    },

    setPosition: (which, pos) => {
      set((state) => { getConfig(state, which).position = pos; });
    },

    updateStyle: (which, patch) => {
      set((state) => { Object.assign(getConfig(state, which).style, patch); });
    },

    resetLegend: (which) => {
      set((state) => {
        const defaults = which === 'node' ? DEFAULT_NODE_LEGEND : DEFAULT_SWIMLANE_LEGEND;
        const cfg = getConfig(state, which);
        cfg.items = [];
        cfg.visible = true;
        cfg.title = defaults.title;
        cfg.position = { ...defaults.position };
        cfg.style = { ...DEFAULT_STYLE };
      });
    },

    generateNodeLegend: () => {
      const { nodes, edges } = useFlowStore.getState();

      const items: LegendItem[] = [];
      let order = 0;

      // ---- 1. Unique fill colors (most important grouping) ----
      const colorMap = new Map<string, string>(); // color -> first label
      for (const node of nodes) {
        if (node.type === 'groupNode') continue;
        const color = node.data?.color || '#3b82f6';
        if (!colorMap.has(color)) {
          colorMap.set(color, node.data?.label || node.data?.shape || 'Node');
        }
      }
      for (const [color, label] of colorMap) {
        items.push({ id: generateId('legend'), label, color, kind: 'fill', order: order++ });
      }

      // ---- 2. Unique border/outline colors + styles (if explicitly set) ----
      const borderSet = new Set<string>(); // compound key: color|style
      for (const node of nodes) {
        const bc = node.data?.borderColor;
        if (!bc) continue;
        const bStyle = (node.data?.borderStyle || 'solid') as 'solid' | 'dashed' | 'dotted';
        const key = `${bc}|${bStyle}`;
        if (!borderSet.has(key)) {
          borderSet.add(key);
          items.push({
            id: generateId('legend'),
            label: `${bStyle === 'dashed' ? 'Dashed' : bStyle === 'dotted' ? 'Dotted' : 'Solid'} border`,
            color: bc,
            kind: 'border',
            borderStyle: bStyle,
            order: order++,
          });
        }
      }

      // ---- 3. Unique status puck colors ----
      const statusColorNames: Record<string, string> = {
        '#94a3b8': 'Not Started',
        '#3b82f6': 'In Progress',
        '#10b981': 'Completed',
        '#ef4444': 'Blocked',
        '#f59e0b': 'Review',
      };
      const puckSet = new Set<string>();
      for (const node of nodes) {
        const indicators = getStatusIndicators(node.data as FlowNodeData);
        if (indicators.length === 0) continue;
        for (const puck of indicators) {
          const pc = puck.color || '#94a3b8';
          if (!puckSet.has(pc)) {
            puckSet.add(pc);
            items.push({
              id: generateId('legend'),
              label: statusColorNames[pc] || puck.status || 'Status',
              color: pc,
              kind: 'puck',
              order: order++,
            });
          }
        }
      }

      // ---- 4. Unique edge colors ----
      const edgeColorMap = new Map<string, string>();
      for (const edge of edges) {
        const d = edge.data as Record<string, unknown> | undefined;
        const color = (d?.color as string) || '#94a3b8';
        if (!edgeColorMap.has(color) && !colorMap.has(color)) {
          const label = (d?.label as string) || 'Connector';
          edgeColorMap.set(color, label);
        }
      }
      for (const [color, label] of edgeColorMap) {
        items.push({ id: generateId('legend'), label, color, kind: 'edge', order: order++ });
      }

      set((state) => {
        state.nodeLegend.items = items;
        state.nodeLegend.visible = true;
      });
    },

    generateSwimlaneLegend: (lanes) => {
      const items: LegendItem[] = lanes.map((lane, i) => ({
        id: `lane-${lane.id}`,
        label: lane.label,
        color: lane.color,
        kind: 'lane' as const,
        order: i,
      }));

      set((state) => {
        state.swimlaneLegend.items = items;
        state.swimlaneLegend.visible = true;
      });
    },
  })),
);

/** Direct access outside React components */
export const legendStore: StoreApi<LegendState> = useLegendStore;
