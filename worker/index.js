/**
 * VOID Intelligence Router — Cloudflare Worker
 *
 * API keys live ONLY in Cloudflare secrets — users can never see them.
 * Shuffles across all configured providers so no single rate limit is hit.
 * Providers with no key set are automatically skipped.
 * Pollinations is the unlimited no-key safety net at the end.
 *
 * Add your keys in Cloudflare Dashboard:
 *   Workers → void-proxy → Settings → Variables → Add variable (Secret type)
 *
 *   GROQ_KEY        → console.groq.com
 *   CEREBRAS_KEY    → cloud.cerebras.ai  (fastest: 1000+ tok/s)
 *   SAMBANOVA_KEY   → cloud.sambanova.ai
 *   DEEPSEEK_KEY    → platform.deepseek.com
 *   OPENROUTER_KEY  → openrouter.ai/keys
 *   TOGETHER_KEY    → api.together.ai
 *   FIREWORKS_KEY   → fireworks.ai
 *   NVIDIA_KEY      → build.nvidia.com
 *   HYPERBOLIC_KEY  → app.hyperbolic.xyz
 *   HF_TOKEN        → huggingface.co/settings/tokens
 *   MISTRAL_KEY     → console.mistral.ai
 *   COHERE_KEY      → dashboard.cohere.com
 *   GEMINI_KEY      → aistudio.google.com/apikey
 */

const PROVIDERS = [
  {
    id: 'groq',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.3-70b-versatile',
    keyEnv: 'GROQ_KEY',
  },
  {
    // Fastest provider — 1000+ tok/s on Llama 3.3 70B
    id: 'cerebras',
    url: 'https://api.cerebras.ai/v1/chat/completions',
    model: 'llama-3.3-70b',
    keyEnv: 'CEREBRAS_KEY',
  },
  {
    id: 'sambanova',
    url: 'https://api.sambanova.ai/v1/chat/completions',
    model: 'Meta-Llama-3.3-70B-Instruct',
    keyEnv: 'SAMBANOVA_KEY',
  },
  {
    id: 'deepseek',
    url: 'https://api.deepseek.com/v1/chat/completions',
    model: 'deepseek-chat',
    keyEnv: 'DEEPSEEK_KEY',
  },
  {
    id: 'openrouter',
    url: 'https://openrouter.ai/api/v1/chat/completions',
    model: 'meta-llama/llama-3.3-70b-instruct:free',
    keyEnv: 'OPENROUTER_KEY',
    extra: { 'HTTP-Referer': 'https://void-app.pages.dev', 'X-Title': 'VOID' },
  },
  {
    id: 'together',
    url: 'https://api.together.xyz/v1/chat/completions',
    model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    keyEnv: 'TOGETHER_KEY',
  },
  {
    id: 'fireworks',
    url: 'https://api.fireworks.ai/inference/v1/chat/completions',
    model: 'accounts/fireworks/models/llama-v3p3-70b-instruct',
    keyEnv: 'FIREWORKS_KEY',
  },
  {
    id: 'nvidia',
    url: 'https://integrate.api.nvidia.com/v1/chat/completions',
    model: 'meta/llama-3.3-70b-instruct',
    keyEnv: 'NVIDIA_KEY',
  },
  {
    id: 'hyperbolic',
    url: 'https://api.hyperbolic.xyz/v1/chat/completions',
    model: 'meta-llama/Llama-3.3-70B-Instruct',
    keyEnv: 'HYPERBOLIC_KEY',
  },
  {
    id: 'huggingface',
    url: 'https://router.huggingface.co/hf-inference/v1/chat/completions',
    model: 'meta-llama/Llama-3.3-70B-Instruct',
    keyEnv: 'HF_TOKEN',
  },
  {
    id: 'mistral',
    url: 'https://api.mistral.ai/v1/chat/completions',
    model: 'mistral-small-latest',
    keyEnv: 'MISTRAL_KEY',
  },
  {
    id: 'cohere',
    url: 'https://api.cohere.com/compatibility/v1/chat/completions',
    model: 'command-r-plus',
    keyEnv: 'COHERE_KEY',
  },
  {
    id: 'gemini',
    url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    model: 'gemini-2.0-flash',
    keyEnv: 'GEMINI_KEY',
  },
];

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return cors(null, 204);
    if (request.method !== 'POST') return cors(JSON.stringify({ error: 'Method not allowed' }), 405);

    let body;
    try { body = await request.json(); }
    catch { return cors(JSON.stringify({ error: 'Invalid JSON' }), 400); }

    const messages = body.messages || [];
    const max_tokens = body.max_tokens || 1024;

    // Only use providers that have a key configured
    const available = PROVIDERS.filter(p => env[p.keyEnv]);

    // Shuffle so load spreads across providers and rate limits are hit evenly
    const order = shuffle(available);

    for (const p of order) {
      try {
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env[p.keyEnv]}`,
          ...( p.extra || {} ),
        };

        const res = await fetch(p.url, {
          method: 'POST',
          headers,
          body: JSON.stringify({ model: p.model, messages, max_tokens }),
          signal: AbortSignal.timeout(30000),
        });

        if (res.ok) return cors(await res.text());

        // Rate limited — try next provider
        if (res.status === 429) continue;

      } catch { continue; }
    }

    // Final fallback — Pollinations (unlimited, no key, always works)
    try {
      const res = await fetch('https://text.pollinations.ai/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'openai', messages, max_tokens }),
        signal: AbortSignal.timeout(30000),
      });
      if (res.ok) return cors(await res.text());
    } catch {}

    return cors(JSON.stringify({ error: 'All providers unavailable' }), 502);
  },
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function cors(body, status = 200) {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
