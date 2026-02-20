import { create, type StoreApi } from 'zustand';
import { immer } from 'zustand/middleware/immer';

// ---------------------------------------------------------------------------
// Inline types
// ---------------------------------------------------------------------------

export interface BannerConfig {
  enabled: boolean;
  height: number;        // px, default 40
  label: string;         // default ''
  color: string;         // background color, default '#1e293b'
  textColor: string;     // default '#ffffff'
  fontFamily: string;    // default 'Inter, system-ui, sans-serif'
  fontSize: number;      // default 14
}

export interface BannerState {
  // ---- state --------------------------------------------------
  topBanner: BannerConfig;
  bottomBanner: BannerConfig;

  // ---- actions ------------------------------------------------
  setTopEnabled: (enabled: boolean) => void;
  setBottomEnabled: (enabled: boolean) => void;
  updateTopBanner: (patch: Partial<BannerConfig>) => void;
  updateBottomBanner: (patch: Partial<BannerConfig>) => void;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_BANNER: BannerConfig = {
  enabled: false,
  height: 40,
  label: '',
  color: '#1e293b',
  textColor: '#ffffff',
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: 14,
};

// ---------------------------------------------------------------------------
// Store (immer for easy nested mutations)
// ---------------------------------------------------------------------------

export const useBannerStore = create<BannerState>()(
  immer((set) => ({
    // -- initial state -------------------------------------------
    topBanner: { ...DEFAULT_BANNER },
    bottomBanner: { ...DEFAULT_BANNER },

    // -- actions -------------------------------------------------
    setTopEnabled: (enabled) => {
      set((state) => {
        state.topBanner.enabled = enabled;
      });
    },

    setBottomEnabled: (enabled) => {
      set((state) => {
        state.bottomBanner.enabled = enabled;
      });
    },

    updateTopBanner: (patch) => {
      set((state) => {
        Object.assign(state.topBanner, patch);
      });
    },

    updateBottomBanner: (patch) => {
      set((state) => {
        Object.assign(state.bottomBanner, patch);
      });
    },
  })),
);

/** Direct access to the store (useful outside of React components) */
export const bannerStore: StoreApi<BannerState> = useBannerStore;
