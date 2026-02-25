import { create, type StoreApi } from 'zustand';
import { type AIProvider, PROVIDERS } from '../lib/ai/providers';

// ---------------------------------------------------------------------------
// Re-export the AIProvider type for convenience
// ---------------------------------------------------------------------------

export type { AIProvider };

// ---------------------------------------------------------------------------
// Inline types
// ---------------------------------------------------------------------------

export type KeyStorage = 'session' | 'local';

export interface AIToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

export interface AIToolResult {
  toolCallId: string;
  toolName?: string;
  result: string;
  success: boolean;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  toolCalls?: AIToolCall[];
  toolResults?: AIToolResult[];
  timestamp: number;
}

// ---------------------------------------------------------------------------
// State interface
// ---------------------------------------------------------------------------

interface AIState {
  // Provider config
  provider: AIProvider;
  apiKey: string;
  endpoint: string;
  model: string;
  models: string[];
  keyStorage: KeyStorage;

  // Chat state
  messages: AIMessage[];
  isStreaming: boolean;
  isPanelOpen: boolean;
  isSettingsOpen: boolean;
  error: string | null;

  // Actions
  setProvider: (provider: AIProvider) => void;
  setApiKey: (key: string) => void;
  setEndpoint: (url: string) => void;
  setModel: (model: string) => void;
  setModels: (models: string[]) => void;
  setKeyStorage: (storage: KeyStorage) => void;
  addMessage: (msg: Omit<AIMessage, 'id' | 'timestamp'>) => void;
  updateLastMessage: (patch: Partial<AIMessage>) => void;
  appendToLastMessage: (text: string) => void;
  clearMessages: () => void;
  togglePanel: () => void;
  setPanelOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setStreaming: (streaming: boolean) => void;
  setError: (error: string | null) => void;
  loadApiKey: () => void;
  persistApiKey: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'charthero_ai_key';

const DEFAULT_PROVIDER: AIProvider = 'anthropic';
const DEFAULT_CONFIG = PROVIDERS[DEFAULT_PROVIDER];

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAIStore = create<AIState>()((set, get) => ({
  // -- initial state --------------------------------------------------------
  provider: DEFAULT_PROVIDER,
  apiKey: '',
  endpoint: DEFAULT_CONFIG.endpoint,
  model: DEFAULT_CONFIG.defaultModel,
  models: DEFAULT_CONFIG.defaultModels,
  keyStorage: 'session',

  messages: [],
  isStreaming: false,
  isPanelOpen: false,
  isSettingsOpen: false,
  error: null,

  // -- actions --------------------------------------------------------------

  setProvider: (provider) => {
    const config = PROVIDERS[provider];
    if (provider === 'custom') {
      // Don't overwrite a user-provided endpoint
      set({
        provider,
        model: config.defaultModel,
        models: config.defaultModels,
      });
    } else {
      set({
        provider,
        endpoint: config.endpoint,
        model: config.defaultModel,
        models: config.defaultModels,
      });
    }
  },

  setApiKey: (key) => set({ apiKey: key }),
  setEndpoint: (url) => set({ endpoint: url }),
  setModel: (model) => set({ model }),
  setModels: (models) => set({ models }),
  setKeyStorage: (storage) => set({ keyStorage: storage }),

  addMessage: (msg) =>
    set((s) => ({
      messages: [
        ...s.messages,
        {
          ...msg,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
        },
      ],
    })),

  updateLastMessage: (patch) =>
    set((s) => {
      if (s.messages.length === 0) return s;
      const updated = [...s.messages];
      updated[updated.length - 1] = { ...updated[updated.length - 1], ...patch };
      return { messages: updated };
    }),

  appendToLastMessage: (text) =>
    set((s) => {
      if (s.messages.length === 0) return s;
      const updated = [...s.messages];
      const last = updated[updated.length - 1];
      updated[updated.length - 1] = { ...last, content: last.content + text };
      return { messages: updated };
    }),

  clearMessages: () => set({ messages: [] }),

  togglePanel: () => set((s) => ({ isPanelOpen: !s.isPanelOpen })),
  setPanelOpen: (open) => set({ isPanelOpen: open }),
  setSettingsOpen: (open) => set({ isSettingsOpen: open }),
  setStreaming: (streaming) => set({ isStreaming: streaming }),
  setError: (error) => set({ error }),

  loadApiKey: () => {
    // Check sessionStorage first, then localStorage
    const sessionKey = sessionStorage.getItem(STORAGE_KEY);
    if (sessionKey) {
      set({ apiKey: sessionKey, keyStorage: 'session' });
      return;
    }
    const localKey = localStorage.getItem(STORAGE_KEY);
    if (localKey) {
      set({ apiKey: localKey, keyStorage: 'local' });
      return;
    }
  },

  persistApiKey: () => {
    const { apiKey, keyStorage } = get();
    if (keyStorage === 'session') {
      sessionStorage.setItem(STORAGE_KEY, apiKey);
      // Clean up the other storage
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, apiKey);
      sessionStorage.removeItem(STORAGE_KEY);
    }
  },
}));

/** Direct access to the store (useful outside of React components) */
export const aiStore: StoreApi<AIState> = useAIStore;
