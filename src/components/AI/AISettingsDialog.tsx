import React, { useState, useEffect, useCallback } from 'react';
import { X, Eye, EyeOff, RefreshCw, Settings2, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useAIStore } from '@/store/aiStore';
import type { AIProvider, KeyStorage } from '@/store/aiStore';
import { useStyleStore } from '@/store/styleStore';
import { PROVIDERS, fetchModels, testConnection } from '@/lib/ai/providers';

// ---------------------------------------------------------------------------
// AISettingsDialog
// ---------------------------------------------------------------------------

interface AISettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

const PROVIDER_OPTIONS: { value: AIProvider; label: string; note?: string }[] = [
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'openai', label: 'OpenAI', note: 'May be blocked by CORS in some browsers. Use OpenRouter as an alternative.' },
  { value: 'openrouter', label: 'OpenRouter' },
  { value: 'groq', label: 'Groq' },
  { value: 'custom', label: 'Custom' },
];

const AISettingsDialog: React.FC<AISettingsDialogProps> = ({ open, onClose }) => {
  const darkMode = useStyleStore((s) => s.darkMode);

  const provider = useAIStore((s) => s.provider);
  const apiKey = useAIStore((s) => s.apiKey);
  const endpoint = useAIStore((s) => s.endpoint);
  const model = useAIStore((s) => s.model);
  const models = useAIStore((s) => s.models);
  const keyStorage = useAIStore((s) => s.keyStorage);

  const [showKey, setShowKey] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isFetchingModels, setIsFetchingModels] = useState(false);

  // Escape key to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Provider change — auto-fetch models if key is already set
  const handleProviderChange = useCallback(async (newProvider: AIProvider) => {
    useAIStore.getState().setProvider(newProvider);
    setTestResult(null);
    // Auto-fetch models if we already have a key
    const key = useAIStore.getState().apiKey;
    if (key && key.length > 10) {
      setIsFetchingModels(true);
      try {
        const { endpoint: e } = useAIStore.getState();
        const fetched = await fetchModels(newProvider, key, e);
        useAIStore.getState().setModels(fetched);
      } finally {
        setIsFetchingModels(false);
      }
    }
  }, []);

  // Fetch models
  const handleFetchModels = useCallback(async () => {
    setIsFetchingModels(true);
    try {
      const { provider: p, apiKey: k, endpoint: e } = useAIStore.getState();
      const fetched = await fetchModels(p, k, e);
      useAIStore.getState().setModels(fetched);
    } finally {
      setIsFetchingModels(false);
    }
  }, []);

  // Test connection
  const handleTest = useCallback(async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const { provider: p, apiKey: k, endpoint: e } = useAIStore.getState();
      const result = await testConnection(p, k, e);
      setTestResult(result);
    } catch (err) {
      setTestResult({
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setIsTesting(false);
    }
  }, []);

  // Persist key on change
  const handleKeyStorageChange = useCallback((storage: KeyStorage) => {
    useAIStore.getState().setKeyStorage(storage);
    // Re-persist with the new strategy
    if (useAIStore.getState().apiKey) {
      useAIStore.getState().persistApiKey();
    }
  }, []);

  if (!open) return null;

  const inputCls = `
    w-full px-3 py-2 rounded-lg border text-sm transition-colors
    ${darkMode
      ? 'bg-dk-input border-dk-border text-dk-text placeholder:text-dk-faint focus:border-blue-500'
      : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-blue-500'
    }
    outline-none
  `;

  const labelCls = `block text-xs font-medium mb-1 ${darkMode ? 'text-dk-muted' : 'text-slate-600'}`;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Dialog */}
      <div
        className={`
          relative w-[480px] max-h-[85vh] rounded-xl shadow-2xl border overflow-hidden
          ${darkMode ? 'bg-dk-panel border-dk-border' : 'bg-white border-slate-200'}
        `}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-3 border-b ${darkMode ? 'border-dk-border' : 'border-slate-200'}`}>
          <div className="flex items-center gap-2">
            <Settings2 size={18} className="text-primary" />
            <h2 className={`text-base font-semibold ${darkMode ? 'text-dk-text' : 'text-slate-800'}`}>
              AI Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-md transition-colors cursor-pointer ${darkMode ? 'hover:bg-dk-hover text-dk-muted' : 'hover:bg-slate-100 text-slate-500'}`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(85vh-60px)] p-5 panel-scroll flex flex-col gap-5">

          {/* Provider */}
          <div>
            <label className={labelCls}>Provider</label>
            <select
              value={provider}
              onChange={(e) => handleProviderChange(e.target.value as AIProvider)}
              className={inputCls}
            >
              {PROVIDER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {PROVIDER_OPTIONS.find((o) => o.value === provider)?.note && (
              <p className={`mt-1 text-[11px] ${darkMode ? 'text-amber-400/80' : 'text-amber-600'}`}>
                {PROVIDER_OPTIONS.find((o) => o.value === provider)!.note}
              </p>
            )}
          </div>

          {/* API Key */}
          <div>
            <label className={labelCls}>API Key</label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => {
                  useAIStore.getState().setApiKey(e.target.value);
                  useAIStore.getState().persistApiKey();
                  setTestResult(null);
                }}
                onBlur={() => {
                  // Auto-fetch models when user finishes entering API key
                  const key = useAIStore.getState().apiKey;
                  if (key && key.length > 10) {
                    handleFetchModels();
                  }
                }}
                placeholder={`Enter your ${PROVIDERS[provider].name} API key`}
                className={inputCls}
                style={{ paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded cursor-pointer ${darkMode ? 'text-dk-faint hover:text-dk-text' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className={`mt-1 text-[11px] ${darkMode ? 'text-dk-faint' : 'text-slate-400'}`}>
              Your key is sent directly to the provider from your browser. It is never sent to our servers.
            </p>
          </div>

          {/* Endpoint URL */}
          <div>
            <label className={labelCls}>Endpoint URL</label>
            <input
              type="text"
              value={endpoint}
              onChange={(e) => {
                useAIStore.getState().setEndpoint(e.target.value);
                setTestResult(null);
              }}
              placeholder="https://api.example.com/v1/..."
              className={inputCls}
            />
          </div>

          {/* Model */}
          <div>
            <label className={labelCls}>Model</label>
            <div className="flex gap-2">
              <select
                value={model}
                onChange={(e) => useAIStore.getState().setModel(e.target.value)}
                className={`${inputCls} flex-1`}
              >
                {models.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
                {/* If current model not in list, still show it */}
                {model && !models.includes(model) && (
                  <option value={model}>{model}</option>
                )}
              </select>
              <button
                type="button"
                onClick={handleFetchModels}
                disabled={isFetchingModels || !apiKey}
                className={`
                  flex items-center gap-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer
                  ${darkMode
                    ? 'border-dk-border text-dk-text hover:bg-dk-hover disabled:opacity-40 disabled:cursor-not-allowed'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed'
                  }
                `}
              >
                <RefreshCw size={14} className={isFetchingModels ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Key Storage */}
          <div>
            <label className={labelCls}>Key Storage</label>
            <div className="flex flex-col gap-2">
              <label className={`flex items-center gap-2 cursor-pointer text-sm ${darkMode ? 'text-dk-text' : 'text-slate-700'}`}>
                <input
                  type="radio"
                  name="keyStorage"
                  value="session"
                  checked={keyStorage === 'session'}
                  onChange={() => handleKeyStorageChange('session')}
                  className="accent-blue-500"
                />
                Session only (recommended)
              </label>
              <label className={`flex items-center gap-2 cursor-pointer text-sm ${darkMode ? 'text-dk-text' : 'text-slate-700'}`}>
                <input
                  type="radio"
                  name="keyStorage"
                  value="local"
                  checked={keyStorage === 'local'}
                  onChange={() => handleKeyStorageChange('local')}
                  className="accent-blue-500"
                />
                Remember in browser (localStorage)
              </label>
              {keyStorage === 'local' && (
                <p className={`text-[11px] ml-5 ${darkMode ? 'text-amber-400/80' : 'text-amber-600'}`}>
                  Warning: API key will persist in browser storage. Only use this on trusted devices.
                </p>
              )}
            </div>
          </div>

          {/* Test Connection */}
          <div>
            <button
              type="button"
              onClick={handleTest}
              disabled={isTesting || !apiKey}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer
                ${darkMode
                  ? 'bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed'
                }
              `}
            >
              {isTesting ? <Loader2 size={14} className="animate-spin" /> : <Settings2 size={14} />}
              Test Connection
            </button>

            {testResult && (
              <div className={`mt-2 flex items-center gap-2 text-sm ${testResult.success ? 'text-emerald-500' : 'text-red-500'}`}>
                {testResult.success ? (
                  <>
                    <Check size={16} />
                    <span>Connection successful!</span>
                  </>
                ) : (
                  <>
                    <AlertCircle size={16} />
                    <span className="break-all">{testResult.error || 'Connection failed'}</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AISettingsDialog;
