import { create, type StoreApi } from 'zustand';

// ---------------------------------------------------------------------------
// Inline types
// ---------------------------------------------------------------------------

export type PanelTab = 'node' | 'edge' | 'deps' | 'lane' | 'data' | 'style';

export type GridStyle = 'dots' | 'lines' | 'cross';

export interface UIState {
  // ---- panel / palette state ---------------------------------
  activePanelTab: PanelTab;
  shapePaletteOpen: boolean;
  propertiesPanelOpen: boolean;
  settingsPanelOpen: boolean;
  layersPanelOpen: boolean;

  // ---- canvas overlays ----------------------------------------
  minimapVisible: boolean;
  gridVisible: boolean;
  snapEnabled: boolean;
  gridSpacing: number;
  snapDistance: number;
  gridStyle: GridStyle;
  rulerVisible: boolean;

  // ---- alignment / distribution guides ------------------------
  showAlignmentGuides: boolean;
  showDistributionGuides: boolean;

  // ---- zoom ---------------------------------------------------
  zoomLevel: number;

  // ---- palette shape selection ---------------------------------
  selectedPaletteShape: string | null;

  // ---- inline editing -----------------------------------------
  isEditingNode: string | null;

  // ---- puck selection -----------------------------------------
  /** IDs of currently selected status pucks (across all nodes) */
  selectedPuckIds: string[];
  /** Node ID whose puck is selected (for properties panel context) */
  selectedPuckNodeId: string | null;

  // ---- format painter -----------------------------------------
  formatPainterActive: boolean;
  formatPainterNodeStyle: {
    color?: string;
    borderColor?: string;
    textColor?: string;
    fontSize?: number;
    fontWeight?: number;
    fontFamily?: string;
    borderStyle?: 'solid' | 'dashed' | 'dotted';
    borderWidth?: number;
    borderRadius?: number;
    opacity?: number;
    textAlign?: string;
  } | null;
  formatPainterEdgeStyle: {
    color?: string;
    thickness?: number;
    opacity?: number;
    strokeDasharray?: string;
    labelColor?: string;
  } | null;

  // ---- selection color -----------------------------------------
  /** Highlight color for selected nodes, edges, pucks, resize handles */
  selectionColor: string;

  // ---- presentation mode --------------------------------------
  presentationMode: boolean;
  presentationTool: 'pointer' | 'pen' | 'highlighter' | 'eraser';

  // ---- toast notification --------------------------------------
  toast: { message: string; type: 'info' | 'success' | 'error' | 'warning' } | null;

  // ---- link group editor --------------------------------------
  /** Link group ID currently being edited (null = dialog closed) */
  linkGroupEditorId: string | null;
  /** When true, clicking a node adds it to the group being edited */
  linkGroupAddMode: boolean;

  // ---- screenshot mode ----------------------------------------
  screenshotMode: boolean;

  // ---- confirm dialog -----------------------------------------
  confirmDialog: {
    message: string;
    title?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    resolve: (result: boolean) => void;
  } | null;

  // ---- actions ------------------------------------------------
  setActivePanelTab: (tab: PanelTab) => void;

  toggleShapePalette: () => void;
  setShapePaletteOpen: (open: boolean) => void;

  togglePropertiesPanel: () => void;
  setPropertiesPanelOpen: (open: boolean) => void;

  toggleSettingsPanel: () => void;
  setSettingsPanelOpen: (open: boolean) => void;

  toggleLayersPanel: () => void;
  setLayersPanelOpen: (open: boolean) => void;

  toggleMinimap: () => void;
  setMinimapVisible: (visible: boolean) => void;

  toggleGrid: () => void;
  setGridVisible: (visible: boolean) => void;

  toggleSnap: () => void;
  setSnapEnabled: (enabled: boolean) => void;

  setGridSpacing: (spacing: number) => void;
  setSnapDistance: (distance: number) => void;

  setGridStyle: (style: GridStyle) => void;

  toggleRuler: () => void;
  setRulerVisible: (visible: boolean) => void;

  toggleAlignmentGuides: () => void;
  setShowAlignmentGuides: (show: boolean) => void;

  toggleDistributionGuides: () => void;
  setShowDistributionGuides: (show: boolean) => void;

  setZoomLevel: (level: number) => void;

  setSelectedPaletteShape: (shape: string | null) => void;
  setIsEditingNode: (nodeId: string | null) => void;

  // ---- puck selection actions ----------------------------------
  selectPuck: (puckId: string, nodeId: string) => void;
  togglePuckSelection: (puckId: string, nodeId: string) => void;
  clearPuckSelection: () => void;
  /** Select pucks matching a filter across all nodes. Accepts puck IDs directly. */
  selectPucks: (puckIds: string[], nodeId?: string | null) => void;

  setFormatPainterActive: (active: boolean) => void;
  setFormatPainterNodeStyle: (style: UIState['formatPainterNodeStyle']) => void;
  setFormatPainterEdgeStyle: (style: UIState['formatPainterEdgeStyle']) => void;
  clearFormatPainter: () => void;

  setSelectionColor: (color: string) => void;

  setPresentationMode: (on: boolean) => void;
  setPresentationTool: (tool: UIState['presentationTool']) => void;

  showToast: (message: string, type?: 'info' | 'success' | 'error' | 'warning') => void;
  clearToast: () => void;
  showConfirm: (message: string, options?: { title?: string; confirmLabel?: string; cancelLabel?: string }) => Promise<boolean>;
  resolveConfirm: (result: boolean) => void;

  // ---- screenshot mode actions ----------------------------------
  setScreenshotMode: (active: boolean) => void;

  // ---- link group editor actions --------------------------------
  setLinkGroupEditorId: (id: string | null) => void;
  setLinkGroupAddMode: (active: boolean) => void;
  closeLinkGroupEditor: () => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useUIStore = create<UIState>()((set) => ({
  // -- initial state --------------------------------------------
  activePanelTab: 'node',
  shapePaletteOpen: true,
  propertiesPanelOpen: true,
  settingsPanelOpen: false,
  layersPanelOpen: false,

  minimapVisible: true,
  gridVisible: true,
  snapEnabled: true,
  gridSpacing: 16,
  snapDistance: 8,
  gridStyle: 'dots',
  rulerVisible: false,

  showAlignmentGuides: true,
  showDistributionGuides: true,

  zoomLevel: 1,

  selectedPaletteShape: null,
  isEditingNode: null,

  selectedPuckIds: [],
  selectedPuckNodeId: null,

  formatPainterActive: false,
  formatPainterNodeStyle: null,
  formatPainterEdgeStyle: null,

  selectionColor: '#d946ef', // magenta-500

  presentationMode: false,
  presentationTool: 'pointer',

  toast: null,
  confirmDialog: null,

  screenshotMode: false,

  linkGroupEditorId: null,
  linkGroupAddMode: false,

  // -- actions --------------------------------------------------
  setActivePanelTab: (tab) => set({ activePanelTab: tab }),

  toggleShapePalette: () => set((s) => ({ shapePaletteOpen: !s.shapePaletteOpen })),
  setShapePaletteOpen: (open) => set({ shapePaletteOpen: open }),

  togglePropertiesPanel: () =>
    set((s) => ({ propertiesPanelOpen: !s.propertiesPanelOpen })),
  setPropertiesPanelOpen: (open) => set({ propertiesPanelOpen: open }),

  toggleSettingsPanel: () =>
    set((s) => ({ settingsPanelOpen: !s.settingsPanelOpen })),
  setSettingsPanelOpen: (open) => set({ settingsPanelOpen: open }),

  toggleLayersPanel: () =>
    set((s) => ({ layersPanelOpen: !s.layersPanelOpen })),
  setLayersPanelOpen: (open) => set({ layersPanelOpen: open }),

  toggleMinimap: () => set((s) => ({ minimapVisible: !s.minimapVisible })),
  setMinimapVisible: (visible) => set({ minimapVisible: visible }),

  toggleGrid: () => set((s) => ({ gridVisible: !s.gridVisible })),
  setGridVisible: (visible) => set({ gridVisible: visible }),

  toggleSnap: () => set((s) => ({ snapEnabled: !s.snapEnabled })),
  setSnapEnabled: (enabled) => set({ snapEnabled: enabled }),

  setGridSpacing: (spacing) => set({ gridSpacing: spacing }),
  setSnapDistance: (distance) => set({ snapDistance: distance }),

  setGridStyle: (style) => set({ gridStyle: style }),

  toggleRuler: () => set((s) => ({ rulerVisible: !s.rulerVisible })),
  setRulerVisible: (visible) => set({ rulerVisible: visible }),

  toggleAlignmentGuides: () =>
    set((s) => ({ showAlignmentGuides: !s.showAlignmentGuides })),
  setShowAlignmentGuides: (show) => set({ showAlignmentGuides: show }),

  toggleDistributionGuides: () =>
    set((s) => ({ showDistributionGuides: !s.showDistributionGuides })),
  setShowDistributionGuides: (show) => set({ showDistributionGuides: show }),

  setZoomLevel: (level) => set({ zoomLevel: level }),

  setSelectedPaletteShape: (shape) => set({ selectedPaletteShape: shape }),
  setIsEditingNode: (nodeId) => set({ isEditingNode: nodeId }),

  // -- puck selection -------------------------------------------
  selectPuck: (puckId, nodeId) => set({ selectedPuckIds: [puckId], selectedPuckNodeId: nodeId }),
  togglePuckSelection: (puckId, nodeId) =>
    set((s) => {
      const ids = s.selectedPuckIds.includes(puckId)
        ? s.selectedPuckIds.filter((id) => id !== puckId)
        : [...s.selectedPuckIds, puckId];
      return { selectedPuckIds: ids, selectedPuckNodeId: ids.length > 0 ? nodeId : null };
    }),
  clearPuckSelection: () => set({ selectedPuckIds: [], selectedPuckNodeId: null }),
  selectPucks: (puckIds, nodeId) => set({ selectedPuckIds: puckIds, selectedPuckNodeId: nodeId ?? null }),

  setFormatPainterActive: (active) => set({ formatPainterActive: active }),
  setFormatPainterNodeStyle: (style) => set({ formatPainterNodeStyle: style }),
  setFormatPainterEdgeStyle: (style) => set({ formatPainterEdgeStyle: style }),
  clearFormatPainter: () => set({
    formatPainterActive: false,
    formatPainterNodeStyle: null,
    formatPainterEdgeStyle: null,
  }),

  setSelectionColor: (color) => set({ selectionColor: color }),

  setPresentationMode: (on) => set({ presentationMode: on, presentationTool: 'pointer' }),
  setPresentationTool: (tool) => set({ presentationTool: tool }),

  showToast: (message, type = 'info') => {
    set({ toast: { message, type } });
    setTimeout(() => {
      // Only clear if this is still the same toast
      const current = useUIStore.getState().toast;
      if (current?.message === message) set({ toast: null });
    }, 3500);
  },
  clearToast: () => set({ toast: null }),

  showConfirm: (message, options) =>
    new Promise<boolean>((resolve) => {
      set({
        confirmDialog: {
          message,
          title: options?.title,
          confirmLabel: options?.confirmLabel,
          cancelLabel: options?.cancelLabel,
          resolve,
        },
      });
    }),
  resolveConfirm: (result) => {
    const dialog = useUIStore.getState().confirmDialog;
    if (dialog) {
      dialog.resolve(result);
      set({ confirmDialog: null });
    }
  },

  // -- screenshot mode ---------------------------------------------
  setScreenshotMode: (active) => set({ screenshotMode: active }),

  // -- link group editor ------------------------------------------
  setLinkGroupEditorId: (id) => set({ linkGroupEditorId: id, linkGroupAddMode: false }),
  setLinkGroupAddMode: (active) => set({ linkGroupAddMode: active }),
  closeLinkGroupEditor: () => set({ linkGroupEditorId: null, linkGroupAddMode: false }),
}));

/** Direct access to the store (useful outside of React components) */
export const uiStore: StoreApi<UIState> = useUIStore;
