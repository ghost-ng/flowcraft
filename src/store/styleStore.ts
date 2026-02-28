import { create, type StoreApi } from 'zustand';

// ---------------------------------------------------------------------------
// Inline types
// ---------------------------------------------------------------------------

export type AutoColorMode = 'manual' | 'byType' | 'byDepth' | 'byLane';

export interface StylePreset {
  id: string;
  name: string;
  description?: string;
  /** Serialised style overrides keyed by node shape or '*' for global */
  nodeStyles: Record<string, NodeStyleOverride>;
  edgeStyle: EdgeStyleOverride;
  createdAt: number;
}

export interface NodeStyleOverride {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  borderRadius?: number;
  fontSize?: number;
  fontFamily?: string;
  textColor?: string;
  shadow?: boolean;
}

export interface EdgeStyleOverride {
  stroke?: string;
  strokeWidth?: number;
  animated?: boolean;
  markerEnd?: string;
  labelFontSize?: number;
}

export interface StyleState {
  // ---- state --------------------------------------------------
  activeStyleId: string | null;
  activePaletteId: string;
  darkMode: boolean;
  userPresets: StylePreset[];
  autoColorMode: AutoColorMode;
  customFont: string | null;
  canvasColorOverride: string | null;

  // ---- actions ------------------------------------------------
  setStyle: (styleId: string) => void;
  clearStyle: () => void;
  setPalette: (paletteId: string) => void;
  toggleDarkMode: () => void;
  setDarkMode: (dark: boolean) => void;
  addPreset: (preset: StylePreset) => void;
  removePreset: (presetId: string) => void;
  updatePreset: (presetId: string, patch: Partial<Omit<StylePreset, 'id'>>) => void;
  setAutoColorMode: (mode: AutoColorMode) => void;
  setCustomFont: (font: string | null) => void;
  setCanvasColorOverride: (color: string | null) => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useStyleStore = create<StyleState>()((set) => ({
  // -- initial state --------------------------------------------
  activeStyleId: 'cleanMinimal',
  activePaletteId: 'ocean',
  darkMode: false,
  userPresets: [],
  autoColorMode: 'manual',
  customFont: null,
  canvasColorOverride: null,

  // -- actions --------------------------------------------------
  setStyle: (styleId) => set({ activeStyleId: styleId, canvasColorOverride: null }),

  clearStyle: () => set({ activeStyleId: null, canvasColorOverride: null }),

  setPalette: (paletteId) => set({ activePaletteId: paletteId }),

  toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
  setDarkMode: (dark) => set({ darkMode: dark }),

  addPreset: (preset) =>
    set((s) => ({ userPresets: [...s.userPresets, preset] })),

  removePreset: (presetId) =>
    set((s) => ({
      userPresets: s.userPresets.filter((p) => p.id !== presetId),
    })),

  updatePreset: (presetId, patch) =>
    set((s) => ({
      userPresets: s.userPresets.map((p) =>
        p.id === presetId ? { ...p, ...patch } : p,
      ),
    })),

  setAutoColorMode: (mode) => set({ autoColorMode: mode }),

  setCustomFont: (font) => set({ customFont: font }),

  setCanvasColorOverride: (color) => set({ canvasColorOverride: color }),
}));

/** Direct access to the store (useful outside of React components) */
export const styleStore: StoreApi<StyleState> = useStyleStore;
