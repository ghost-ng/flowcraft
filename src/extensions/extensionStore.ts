import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ExtensionItem {
  id: string;
  name: string;
  svgContent: string;
  viewBox: string;
  defaultWidth: number;
  defaultHeight: number;
  tags?: string[];
}

export interface ExtensionPack {
  id: string;
  name: string;
  icon: string;          // SVG string for pack icon
  builtIn: boolean;
  items: ExtensionItem[];
}

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

const PINNED_KEY = 'charthero-extension-pinned';
const CUSTOM_PACKS_KEY = 'charthero-extension-custom-packs';

function loadPinnedIds(): string[] {
  try { return JSON.parse(localStorage.getItem(PINNED_KEY) || '[]'); }
  catch { return []; }
}

function savePinnedIds(ids: string[]) {
  localStorage.setItem(PINNED_KEY, JSON.stringify(ids));
}

function loadCustomPacks(): ExtensionPack[] {
  try { return JSON.parse(localStorage.getItem(CUSTOM_PACKS_KEY) || '[]'); }
  catch { return []; }
}

function saveCustomPacks(packs: ExtensionPack[]) {
  localStorage.setItem(CUSTOM_PACKS_KEY, JSON.stringify(packs));
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

interface ExtensionState {
  packs: ExtensionPack[];
  pinnedPackIds: string[];
  loaded: boolean;

  loadBuiltInPacks: () => Promise<void>;
  addPack: (pack: ExtensionPack) => void;
  removePack: (id: string) => void;
  pinPack: (id: string) => void;
  unpinPack: (id: string) => void;
  togglePin: (id: string) => void;
}

export const useExtensionStore = create<ExtensionState>()(
  immer((set, get) => ({
    packs: loadCustomPacks(),
    pinnedPackIds: loadPinnedIds(),
    loaded: false,

    loadBuiltInPacks: async () => {
      if (get().loaded) return;
      const { builtInPacks } = await import('./packs/index');
      set((s) => {
        // Merge built-in packs (don't duplicate)
        const existingIds = new Set(s.packs.map((p) => p.id));
        for (const pack of builtInPacks) {
          if (!existingIds.has(pack.id)) s.packs.push(pack);
        }
        s.loaded = true;
      });
    },

    addPack: (pack) => {
      set((s) => {
        s.packs.push(pack);
        saveCustomPacks(s.packs.filter((p) => !p.builtIn));
      });
    },

    removePack: (id) => {
      set((s) => {
        s.packs = s.packs.filter((p) => p.id !== id);
        s.pinnedPackIds = s.pinnedPackIds.filter((pid) => pid !== id);
        saveCustomPacks(s.packs.filter((p) => !p.builtIn));
        savePinnedIds(s.pinnedPackIds);
      });
    },

    pinPack: (id) => {
      set((s) => {
        if (!s.pinnedPackIds.includes(id)) {
          s.pinnedPackIds.push(id);
          savePinnedIds(s.pinnedPackIds);
        }
      });
    },

    unpinPack: (id) => {
      set((s) => {
        s.pinnedPackIds = s.pinnedPackIds.filter((pid) => pid !== id);
        savePinnedIds(s.pinnedPackIds);
      });
    },

    togglePin: (id) => {
      const { pinnedPackIds } = get();
      if (pinnedPackIds.includes(id)) get().unpinPack(id);
      else get().pinPack(id);
    },
  })),
);
