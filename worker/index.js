/**
 * VOID Intelligence Router — Cloudflare Worker
 *
 * Load-balances across multiple free AI providers so no single rate limit
 * is ever a bottleneck. Priority order:
 *   1. Groq          — Llama 3.3 70B  (fastest inference on the planet, free)
 *   2. OpenRouter    — Llama 3.3 70B free tier (same model, separate rate pool)
 *   3. CF Workers AI — Llama 3.1 8B   (built-in, no external call, always works)
 *   4. Pollinations  — GPT-4o-mini eq (unlimited, no key, final safety net)
 *
 * Secrets to set in Cloudflare Dashboard → Workers → void-proxy → Settings → Variables:
 *   GROQ_KEY       — https://console.groq.com  (free, takes 1 min)
 *   OPENROUTER_KEY — https://openrouter.ai     (free, takes 1 min)
 *
 * CF Workers AI works automatically with no keys — just add the [ai] binding
 * in wrangler.toml (already done).
 */

const PROVIDERS = [
  {
    id: 'groq',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.3-70b-versatile',
    keyEnv: 'GROQ_KEY',
  },
  {
    id: 'openrouter',
    url: 'https://openrouter.ai/api/v1/chat/completions',
    model: 'meta-llama/llama-3.3-70b-instruct:free',
    keyEnv: 'OPENROUTER_KEY',
    extraHeaders: {
      'HTTP-Referer': 'https://void-app.pages.dev',
      'X-Title': 'VOID',
    },
  },
  {
    id: 'pollinations',
    url: 'https://text.pollinations.ai/openai',
    model: 'openai',
    keyEnv: null,
  },
];

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return cors(null, 204);
    if (request.method !== 'POST') return cors(JSON.stringify({ error: 'Method not allowed' }), 405);

    let body;
    try {
      body = await request.json();
    } catch {
      return cors(JSON.stringify({ error: 'Invalid JSON body' }), 400);
    }

    const messages = body.messages || [];
    if (!messages.length) return cors(JSON.stringify({ error: 'No messages provided' }), 400);

    // Build available provider list — include only those with keys configured
    // Groq and OpenRouter shuffle randomly between themselves to spread load
    // across their separate rate limit pools
    const keyed = PROVIDERS.filter(p => !p.keyEnv || env[p.keyEnv]);
    const groqLike = keyed.filter(p => p.id === 'groq' || p.id === 'openrouter');
    const rest = keyed.filter(p => p.id !== 'groq' && p.id !== 'openrouter');

    // Randomly rotate between Groq and OpenRouter so neither hits its limit first
    const order = [...shuffle(groqLike), ...rest];

    // Cloudflare Workers AI sits between keyed providers and Pollinations
    // (inserted before the Pollinations fallback)
    const pollinationsIdx = order.findIndex(p => p.id === 'pollinations');
    const insertAt = pollinationsIdx >= 0 ? pollinationsIdx : order.length;
    order.splice(insertAt, 0, { id: 'cf-ai', model: '@cf/meta/llama-3.1-8b-instruct' });

    let lastError = 'No providers available';

    for (const provider of order) {
      try {
        // Cloudflare Workers AI — uses env.AI binding, no external fetch
        if (provider.id === 'cf-ai') {
          if (!env.AI) continue;
          const cfRes = await env.AI.run(provider.model, {
            messages,
            max_tokens: 1024,
          });
          return cors(JSON.stringify({
            choices: [{ message: { role: 'assistant', content: cfRes.response } }],
            _provider: 'cf-ai',
          }));
        }

        // Standard OpenAI-compatible REST providers
        const headers = { 'Content-Type': 'application/json' };
        if (provider.keyEnv && env[provider.keyEnv]) {
          headers['Authorization'] = `Bearer ${env[provider.keyEnv]}`;
        }
        if (provider.extraHeaders) Object.assign(headers, provider.extraHeaders);

        const upstream = await fetch(provider.url, {
          method: 'POST',
          headers,
          body: JSON.stringify({ model: provider.model, messages, max_tokens: 1024 }),
        });

        if (!upstream.ok) {
          const err = await upstream.json().catch(() => ({}));
          throw new Error(err.error?.message || `HTTP ${upstream.status}`);
        }

        const data = await upstream.json();
        // Tag which provider answered (visible only in network tab, not in app UI)
        data._provider = provider.id;
        return cors(JSON.stringify(data));

      } catch (e) {
        lastError = `${provider.id}: ${e.message}`;
        // Silent fallthrough to next provider
      }
    }

    return cors(JSON.stringify({ error: 'All providers failed', detail: lastError }), 502);
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
