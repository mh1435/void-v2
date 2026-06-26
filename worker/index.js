// VOID Proxy — Cloudflare Worker
// The real backend URL is stored in the BACKEND_URL environment variable
// (set it as a Secret in the Cloudflare dashboard — never put it in code).

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return cors(null, 204);
    }

    if (request.method !== 'POST') {
      return cors(JSON.stringify({ error: 'Method not allowed' }), 405);
    }

    const backend = env.BACKEND_URL;
    if (!backend) {
      return cors(JSON.stringify({ error: 'VOID core offline' }), 503);
    }

    let body;
    try {
      body = await request.text();
    } catch {
      return cors(JSON.stringify({ error: 'Bad request' }), 400);
    }

    try {
      const upstream = await fetch(backend, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': '1',
          'User-Agent': 'VoidProxy/1.0',
        },
        body,
      });
      const text = await upstream.text();
      return cors(text, upstream.status);
    } catch (e) {
      return cors(JSON.stringify({ error: 'Upstream unreachable' }), 502);
    }
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
