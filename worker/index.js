/**
 * VOID Intelligence Router — Cloudflare Worker
 *
 * Routes to the owner's Phi-3-mini-4k-instruct running on HF Spaces (CPU).
 * Falls back to Pollinations.ai if the Space is restarting.
 *
 * Secrets — Cloudflare Dashboard → Workers → void-proxy → Settings → Variables:
 *   HF_SPACE_URL  →  https://YOUR_USERNAME-void-core.hf.space
 */

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return cors(null, 204);
    if (request.method !== 'POST') return cors(JSON.stringify({ error: 'Method not allowed' }), 405);

    let body;
    try { body = await request.json(); }
    catch { return cors(JSON.stringify({ error: 'Invalid JSON' }), 400); }

    const messages = body.messages || [];
    const max_tokens = body.max_tokens || 512;

    // Primary: your HF Space (Phi-3-mini, always on CPU)
    if (env.HF_SPACE_URL) {
      try {
        const res = await fetch(
          `${env.HF_SPACE_URL.replace(/\/$/, '')}/v1/chat/completions`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages, max_tokens }),
            signal: AbortSignal.timeout(120000), // 2 min — CPU is slow
          }
        );
        if (res.ok) return cors(await res.text());
      } catch { /* fall through */ }
    }

    // Fallback: Pollinations (if Space is restarting / cold start)
    try {
      const res = await fetch('https://text.pollinations.ai/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'openai', messages, max_tokens }),
        signal: AbortSignal.timeout(30000),
      });
      if (res.ok) return cors(await res.text());
    } catch { /* fall through */ }

    return cors(JSON.stringify({ error: 'VOID Core unavailable' }), 502);
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
