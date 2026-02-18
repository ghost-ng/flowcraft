import { create, type StoreApi } from 'zustand';
import { persist } from 'zustand/middleware';
import { setDebugMode, log } from '../utils/logger';

// ---------------------------------------------------------------------------
// Inline types
// ---------------------------------------------------------------------------

export type EdgeType = 'default' | 'straight' | 'step' | 'smoothstep' | 'bezier';
export type MarkerType = 'none' | 'arrow' | 'arrowclosed';
export type ConnectionLineType = 'default' | 'straight' | 'step' | 'smoothstep' | 'bezier';
export type ToolbarOrientation = 'horizontal' | 'vertical';

export interface NodeDefaults {
  shape: string;
  width: number;
  height: number;
  color: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  textColor: string;
  fontSize: number;
  fontFamily: string;
}

export interface EdgeDefaults {
  type: EdgeType;
  color: string;
  width: number;
  animated: boolean;
  markerStart: MarkerType;
  markerEnd: MarkerType;
  labelFontSize: number;
  labelBackground: boolean;
}

export interface CanvasSettings {
  gridVisible: boolean;
  gridSpacing: number;
  gridColor: string;
  snapToGrid: boolean;
  snapDistance: number;
  backgroundColor: string;
  showDots: boolean;
}

export interface InteractionSettings {
  multiSelectKey: 'shift' | 'ctrl' | 'meta';
  panOnDrag: boolean;
  panOnScroll: boolean;
  zoomOnScroll: boolean;
  zoomOnPinch: boolean;
  zoomOnDoubleClick: boolean;
  minZoom: number;
  maxZoom: number;
  fitViewOnInit: boolean;
  connectionMode: 'strict' | 'loose';
  connectionLineType: ConnectionLineType;
}

export interface AutoSaveSettings {
  enabled: boolean;
  intervalSeconds: number;
  maxSlots: number;
}

export interface AccessibilitySettings {
  highContrast: boolean;
  reducedMotion: boolean;
  keyboardNavigation: boolean;
  screenReaderAnnouncements: boolean;
  focusIndicatorWidth: number;
}

export interface SettingsState {
  // ---- grouped settings ---------------------------------------
  canvas: CanvasSettings;
  nodeDefaults: NodeDefaults;
  edgeDefaults: EdgeDefaults;
  interaction: InteractionSettings;
  autoSave: AutoSaveSettings;
  accessibility: AccessibilitySettings;

  // ---- debug --------------------------------------------------
  debugMode: boolean;

  // ---- toolbar ------------------------------------------------
  toolbarGroupOrder: string[];
  toolbarLocked: boolean;
  toolbarOrientation: ToolbarOrientation;

  // ---- actions ------------------------------------------------
  toggleDebugMode: () => void;
  setToolbarGroupOrder: (order: string[]) => void;
  toggleToolbarLocked: () => void;
  setToolbarOrientation: (orientation: ToolbarOrientation) => void;
  toggleToolbarOrientation: () => void;
  updateCanvasSettings: (patch: Partial<CanvasSettings>) => void;
  updateNodeDefaults: (patch: Partial<NodeDefaults>) => void;
  updateEdgeDefaults: (patch: Partial<EdgeDefaults>) => void;
  updateInteractionSettings: (patch: Partial<InteractionSettings>) => void;
  updateAutoSaveSettings: (patch: Partial<AutoSaveSettings>) => void;
  updateAccessibilitySettings: (patch: Partial<AccessibilitySettings>) => void;

  /** Update any single top-level setting group at once */
  updateSetting: <K extends SettingsGroupKey>(
    group: K,
    patch: Partial<SettingsState[K]>,
  ) => void;

  resetTabDefaults: (group: SettingsGroupKey) => void;
  resetAllDefaults: () => void;

  /** Import a full or partial settings object (e.g. from a JSON file) */
  importSettings: (imported: Partial<SerializedSettings>) => void;
  /** Export current settings as a plain object */
  exportSettings: () => SerializedSettings;
}

// ---------------------------------------------------------------------------
// Helper types for import / export
// ---------------------------------------------------------------------------

type SettingsGroupKey =
  | 'canvas'
  | 'nodeDefaults'
  | 'edgeDefaults'
  | 'interaction'
  | 'autoSave'
  | 'accessibility';

export type SerializedSettings = Pick<
  SettingsState,
  'canvas' | 'nodeDefaults' | 'edgeDefaults' | 'interaction' | 'autoSave' | 'accessibility'
>;

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_CANVAS: CanvasSettings = {
  gridVisible: true,
  gridSpacing: 16,
  gridColor: '#e2e8f0',
  snapToGrid: true,
  snapDistance: 8,
  backgroundColor: '#ffffff',
  showDots: true,
};

const DEFAULT_NODE: NodeDefaults = {
  shape: 'roundedRectangle',
  width: 160,
  height: 60,
  color: '#ffffff',
  borderColor: '#94a3b8',
  borderWidth: 1,
  borderRadius: 8,
  textColor: '#1e293b',
  fontSize: 14,
  fontFamily: 'Inter, system-ui, sans-serif',
};

const DEFAULT_EDGE: EdgeDefaults = {
  type: 'smoothstep',
  color: '#94a3b8',
  width: 1.5,
  animated: false,
  markerStart: 'none',
  markerEnd: 'arrowclosed',
  labelFontSize: 12,
  labelBackground: true,
};

const DEFAULT_INTERACTION: InteractionSettings = {
  multiSelectKey: 'shift',
  panOnDrag: true,
  panOnScroll: false,
  zoomOnScroll: true,
  zoomOnPinch: true,
  zoomOnDoubleClick: false,
  minZoom: 0.1,
  maxZoom: 4,
  fitViewOnInit: true,
  connectionMode: 'loose',
  connectionLineType: 'smoothstep',
};

const DEFAULT_AUTOSAVE: AutoSaveSettings = {
  enabled: true,
  intervalSeconds: 30,
  maxSlots: 5,
};

const DEFAULT_ACCESSIBILITY: AccessibilitySettings = {
  highContrast: false,
  reducedMotion: false,
  keyboardNavigation: true,
  screenReaderAnnouncements: true,
  focusIndicatorWidth: 2,
};

/** All defaults bundled (used by reset helpers) */
const ALL_DEFAULTS: SerializedSettings = {
  canvas: DEFAULT_CANVAS,
  nodeDefaults: DEFAULT_NODE,
  edgeDefaults: DEFAULT_EDGE,
  interaction: DEFAULT_INTERACTION,
  autoSave: DEFAULT_AUTOSAVE,
  accessibility: DEFAULT_ACCESSIBILITY,
};

// ---------------------------------------------------------------------------
// Store (persisted to localStorage)
// ---------------------------------------------------------------------------

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // -- initial state ------------------------------------------
      canvas: { ...DEFAULT_CANVAS },
      nodeDefaults: { ...DEFAULT_NODE },
      edgeDefaults: { ...DEFAULT_EDGE },
      interaction: { ...DEFAULT_INTERACTION },
      autoSave: { ...DEFAULT_AUTOSAVE },
      accessibility: { ...DEFAULT_ACCESSIBILITY },
      debugMode: false,
      toolbarGroupOrder: ['file', 'edit', 'view', 'layout', 'transform', 'panels', 'export'],
      toolbarLocked: true,
      toolbarOrientation: 'horizontal' as ToolbarOrientation,

      // -- toolbar group order ------------------------------------
      setToolbarGroupOrder: (order) => set({ toolbarGroupOrder: order }),
      toggleToolbarLocked: () => set((s) => ({ toolbarLocked: !s.toolbarLocked })),
      setToolbarOrientation: (orientation) => set({ toolbarOrientation: orientation }),
      toggleToolbarOrientation: () => set((s) => ({
        toolbarOrientation: s.toolbarOrientation === 'horizontal' ? 'vertical' : 'horizontal',
      })),

      // -- debug toggle -------------------------------------------
      toggleDebugMode: () =>
        set((s) => {
          const next = !s.debugMode;
          setDebugMode(next);
          return { debugMode: next };
        }),

      // -- granular updaters --------------------------------------
      updateCanvasSettings: (patch) =>
        set((s) => ({ canvas: { ...s.canvas, ...patch } })),

      updateNodeDefaults: (patch) =>
        set((s) => ({ nodeDefaults: { ...s.nodeDefaults, ...patch } })),

      updateEdgeDefaults: (patch) =>
        set((s) => ({ edgeDefaults: { ...s.edgeDefaults, ...patch } })),

      updateInteractionSettings: (patch) =>
        set((s) => ({ interaction: { ...s.interaction, ...patch } })),

      updateAutoSaveSettings: (patch) =>
        set((s) => ({ autoSave: { ...s.autoSave, ...patch } })),

      updateAccessibilitySettings: (patch) =>
        set((s) => ({ accessibility: { ...s.accessibility, ...patch } })),

      // -- generic updater ----------------------------------------
      updateSetting: (group, patch) =>
        set((s) => ({
          [group]: { ...(s[group] as unknown as Record<string, unknown>), ...patch },
        } as unknown as Partial<SettingsState>)),

      // -- reset helpers ------------------------------------------
      resetTabDefaults: (group) =>
        set({ [group]: { ...ALL_DEFAULTS[group] } } as unknown as Partial<SettingsState>),

      resetAllDefaults: () =>
        set({
          canvas: { ...DEFAULT_CANVAS },
          nodeDefaults: { ...DEFAULT_NODE },
          edgeDefaults: { ...DEFAULT_EDGE },
          interaction: { ...DEFAULT_INTERACTION },
          autoSave: { ...DEFAULT_AUTOSAVE },
          accessibility: { ...DEFAULT_ACCESSIBILITY },
        }),

      // -- import / export ----------------------------------------
      importSettings: (imported) => {
        log.info('Importing settings', Object.keys(imported));
        const patch: Partial<SerializedSettings> = {};
        for (const key of Object.keys(ALL_DEFAULTS) as SettingsGroupKey[]) {
          if (imported[key]) {
            patch[key] = { ...ALL_DEFAULTS[key], ...imported[key] } as never;
          }
        }
        set(patch as Partial<SettingsState>);
      },

      exportSettings: () => {
        const s = get();
        return {
          canvas: { ...s.canvas },
          nodeDefaults: { ...s.nodeDefaults },
          edgeDefaults: { ...s.edgeDefaults },
          interaction: { ...s.interaction },
          autoSave: { ...s.autoSave },
          accessibility: { ...s.accessibility },
        };
      },
    }),
    {
      name: 'flowcraft-settings',
      // Only persist the data groups, not the actions
      partialize: (state) => ({
        canvas: state.canvas,
        nodeDefaults: state.nodeDefaults,
        edgeDefaults: state.edgeDefaults,
        interaction: state.interaction,
        autoSave: state.autoSave,
        accessibility: state.accessibility,
        debugMode: state.debugMode,
        toolbarGroupOrder: state.toolbarGroupOrder,
        toolbarLocked: state.toolbarLocked,
        toolbarOrientation: state.toolbarOrientation,
      }),
      // Sync logger debug flag when persisted state is rehydrated
      onRehydrateStorage: () => (state) => {
        if (state?.debugMode) setDebugMode(true);
      },
    },
  ),
);

/** Direct access to the store (useful outside of React components) */
export const settingsStore: StoreApi<SettingsState> = useSettingsStore;
