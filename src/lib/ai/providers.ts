// ---------------------------------------------------------------------------
// AI Provider Configuration — detection, model listing, connection testing
// ---------------------------------------------------------------------------

/** Supported AI provider identifiers */
export type AIProvider = 'anthropic' | 'openai' | 'openrouter' | 'groq' | 'custom';

/** Wire format used by the provider's API */
export type APIFormat = 'anthropic' | 'openai';

/** Full configuration for a single provider */
export interface ProviderConfig {
  id: AIProvider;
  name: string;
  endpoint: string;
  format: APIFormat;
  defaultModel: string;
  defaultModels: string[];
  authHeader: (key: string) => Record<string, string>;
  extraHeaders?: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Provider registry
// ---------------------------------------------------------------------------

export const PROVIDERS: Record<AIProvider, ProviderConfig> = {
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    endpoint: 'https://api.anthropic.com/v1/messages',
    format: 'anthropic',
    defaultModel: 'claude-sonnet-4-5-20250929',
    defaultModels: [
      'claude-opus-4-6',
      'claude-sonnet-4-5-20250929',
      'claude-haiku-4-5-20251001',
    ],
    authHeader: (key: string) => ({
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    }),
  },

  openai: {
    id: 'openai',
    name: 'OpenAI',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    format: 'openai',
    defaultModel: 'gpt-4o',
    defaultModels: [
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4-turbo',
      'gpt-3.5-turbo',
      'o1',
      'o1-mini',
    ],
    authHeader: (key: string) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    }),
  },

  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    format: 'openai',
    defaultModel: 'anthropic/claude-sonnet-4-5-20250929',
    defaultModels: [
      'anthropic/claude-sonnet-4-5-20250929',
      'openai/gpt-4-turbo-preview',
      'google/gemini-pro-1.5',
      'meta-llama/llama-3.1-70b-instruct',
    ],
    authHeader: (key: string) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    }),
    extraHeaders: {
      'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : '',
      'X-Title': 'Chart Hero',
    },
  },

  groq: {
    id: 'groq',
    name: 'Groq',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    format: 'openai',
    defaultModel: 'llama-3.1-70b-versatile',
    defaultModels: [
      'llama-3.1-70b-versatile',
      'llama-3.1-8b-instant',
    ],
    authHeader: (key: string) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    }),
  },

  custom: {
    id: 'custom',
    name: 'Custom',
    endpoint: '',
    format: 'openai',
    defaultModel: '',
    defaultModels: [],
    authHeader: (key: string) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    }),
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Look up the full config for a provider */
export function getProviderConfig(provider: AIProvider): ProviderConfig {
  return PROVIDERS[provider];
}

/**
 * Detect the API wire format from an arbitrary endpoint URL.
 * Used when the provider is 'custom' to decide how to serialize requests.
 */
export function detectProviderFromUrl(url: string): APIFormat {
  const lower = url.toLowerCase();
  if (lower.includes('anthropic') || lower.includes('claude')) {
    return 'anthropic';
  }
  // OpenAI-compatible providers
  if (
    lower.includes('openai') ||
    lower.includes('openrouter') ||
    lower.includes('groq') ||
    lower.includes('together') ||
    lower.includes('ollama') ||
    lower.includes('lmstudio') ||
    lower.includes('mistral') ||
    lower.includes('localhost')
  ) {
    return 'openai';
  }
  return 'openai';
}

// ---------------------------------------------------------------------------
// Model listing
// ---------------------------------------------------------------------------

/**
 * Fetch the list of available models from a provider.
 * - Anthropic: returns hardcoded defaults (no public model-list endpoint).
 * - OpenAI-format providers: calls GET /models.
 */
export async function fetchModels(
  provider: AIProvider,
  apiKey: string,
  endpoint: string,
): Promise<string[]> {
  const config = PROVIDERS[provider];

  // Anthropic has no model listing endpoint — return the curated list
  if (provider === 'anthropic') {
    return config.defaultModels;
  }

  // For OpenAI, OpenRouter, Groq, and Custom — hit the /models endpoint
  let modelsUrl: string;
  if (provider === 'openai') {
    modelsUrl = 'https://api.openai.com/v1/models';
  } else if (provider === 'openrouter') {
    modelsUrl = 'https://openrouter.ai/api/v1/models';
  } else if (provider === 'groq') {
    modelsUrl = 'https://api.groq.com/openai/v1/models';
  } else {
    // Custom: derive /models from the chat completions URL
    modelsUrl = endpoint.replace('/chat/completions', '/models');
  }

  try {
    const headers: Record<string, string> = {
      ...config.authHeader(apiKey),
      ...(config.extraHeaders ?? {}),
    };
    // Model listing is a GET — remove Content-Type (not needed for GET)
    delete headers['Content-Type'];

    const res = await fetch(modelsUrl, { headers });
    if (!res.ok) {
      return config.defaultModels;
    }

    const json = await res.json();
    const models: string[] = Array.isArray(json.data)
      ? json.data.map((m: { id: string }) => m.id)
      : [];

    return models.length > 0 ? models : config.defaultModels;
  } catch {
    return config.defaultModels;
  }
}

// ---------------------------------------------------------------------------
// Connection test
// ---------------------------------------------------------------------------

/**
 * Test whether the API key and endpoint are valid.
 * - Anthropic: sends a minimal POST to /v1/messages.
 * - OpenAI-format: sends a GET to /models.
 */
export async function testConnection(
  provider: AIProvider,
  apiKey: string,
  endpoint: string,
): Promise<{ success: boolean; error?: string }> {
  const config = PROVIDERS[provider];
  const headers: Record<string, string> = {
    ...config.authHeader(apiKey),
    ...(config.extraHeaders ?? {}),
  };

  try {
    if (config.format === 'anthropic') {
      // Send a minimal message request
      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: config.defaultModel,
          max_tokens: 1,
          stream: false,
          messages: [{ role: 'user', content: 'Hi' }],
        }),
      });

      if (res.ok) {
        return { success: true };
      }
      const body = await res.text();
      return { success: false, error: `HTTP ${res.status}: ${body}` };
    }

    // OpenAI-format: ping the /models endpoint
    const modelsUrl = endpoint.replace('/chat/completions', '/models');
    delete headers['Content-Type'];

    const res = await fetch(modelsUrl, { headers });
    if (res.ok) {
      return { success: true };
    }
    const body = await res.text();
    return { success: false, error: `HTTP ${res.status}: ${body}` };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
