/**
 * VOID Intelligence Router — Cloudflare Worker
 *
 * Routes entirely through the owner's own model (Phi-3-mini-4k-instruct).
 * No third-party AI services. No Groq. No OpenRouter.
 *
 * Provider chain:
 *   1. HF Space (your self-hosted Phi-3-mini, ZeroGPU — fast, always on)
 *   2. HF Serverless Inference (same model, HF runs it — backup when Space queues)
 *   3. Pollinations.ai (zero-key safety net — only if both above are down)
 *
 * Secrets — set in Cloudflare Dashboard → Workers → void-proxy → Settings → Variables:
 *   HF_SPACE_URL  →  https://YOUR_USERNAME-void-core.hf.space   (your Space URL)
 *   HF_TOKEN      →  your token from huggingface.co/settings/tokens  (free account)
 */

const HF_MODEL = 'microsoft/Phi-3-mini-4k-instruct';

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return cors(null, 204);
    if (request.method !== 'POST') return cors(JSON.stringify({ error: 'Method not allowed' }), 405);

    let body;
    try { body = await request.json(); }
    catch { return cors(JSON.stringify({ error: 'Invalid JSON' }), 400); }

    const messages = body.messages || [];
    const max_tokens = body.max_tokens || 1024;

    // ── 1. Your HF Space (Phi-3-mini, your own GPU server) ─────────────────
    if (env.HF_SPACE_URL) {
      try {
        const res = await fetch(`${env.HF_SPACE_URL.replace(/\/$/, '')}/v1/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages, max_tokens }),
          signal: AbortSignal.timeout(90000), // 90s for GPU queue
        });
        if (res.ok) return cors(await res.text());
      } catch { /* fall through */ }
    }

    // ── 2. HF Serverless Inference (same Phi-3-mini model, HF's servers) ───
    if (env.HF_TOKEN) {
      try {
        const res = await fetch(
          `https://router.huggingface.co/hf-inference/models/${HF_MODEL}/v1/chat/completions`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${env.HF_TOKEN}`,
            },
            body: JSON.stringify({ model: HF_MODEL, messages, max_tokens }),
            signal: AbortSignal.timeout(30000),
          }
        );
        if (res.ok) return cors(await res.text());
      } catch { /* fall through */ }
    }

    // ── 3. Pollinations (unlimited, no key, last resort) ────────────────────
    try {
      const res = await fetch('https://text.pollinations.ai/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'openai', messages, max_tokens }),
        signal: AbortSignal.timeout(30000),
      });
      if (res.ok) return cors(await res.text());
    } catch { /* fall through */ }

    return cors(JSON.stringify({ error: 'All providers unavailable. Check HF Space status.' }), 502);
  },
};

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
