const PROVIDERS = [
  { id: 'groq', url: 'https://api.groq.com/openai/v1/chat/completions', model: 'llama-3.3-70b-versatile', keyEnv: 'GROQ_KEY' },
  { id: 'cerebras', url: 'https://api.cerebras.ai/v1/chat/completions', model: 'llama-3.3-70b', keyEnv: 'CEREBRAS_KEY' },
  { id: 'sambanova', url: 'https://api.sambanova.ai/v1/chat/completions', model: 'Meta-Llama-3.3-70B-Instruct', keyEnv: 'SAMBANOVA_KEY' },
  { id: 'deepseek', url: 'https://api.deepseek.com/v1/chat/completions', model: 'deepseek-chat', keyEnv: 'DEEPSEEK_KEY' },
  { id: 'openrouter', url: 'https://openrouter.ai/api/v1/chat/completions', model: 'meta-llama/llama-3.3-70b-instruct:free', keyEnv: 'OPENROUTER_KEY', extra: { 'HTTP-Referer': 'https://void-app.pages.dev', 'X-Title': 'VOID' } },
  { id: 'together', url: 'https://api.together.xyz/v1/chat/completions', model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', keyEnv: 'TOGETHER_KEY' },
  { id: 'fireworks', url: 'https://api.fireworks.ai/inference/v1/chat/completions', model: 'accounts/fireworks/models/llama-v3p3-70b-instruct', keyEnv: 'FIREWORKS_KEY' },
  { id: 'nvidia', url: 'https://integrate.api.nvidia.com/v1/chat/completions', model: 'meta/llama-3.3-70b-instruct', keyEnv: 'NVIDIA_KEY' },
  { id: 'hyperbolic', url: 'https://api.hyperbolic.xyz/v1/chat/completions', model: 'meta-llama/Llama-3.3-70B-Instruct', keyEnv: 'HYPERBOLIC_KEY' },
  { id: 'huggingface', url: 'https://router.huggingface.co/hf-inference/v1/chat/completions', model: 'meta-llama/Llama-3.3-70B-Instruct', keyEnv: 'HF_TOKEN' },
  { id: 'mistral', url: 'https://api.mistral.ai/v1/chat/completions', model: 'mistral-small-latest', keyEnv: 'MISTRAL_KEY' },
  { id: 'cohere', url: 'https://api.cohere.com/compatibility/v1/chat/completions', model: 'command-r-plus', keyEnv: 'COHERE_KEY' },
  { id: 'gemini', url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', model: 'gemini-2.0-flash', keyEnv: 'GEMINI_KEY' },
];

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return cors(null, 204);
    const url = new URL(request.url);
    if (url.pathname.startsWith('/pay')) return handlePay(request, env, url);
    if (url.pathname.startsWith('/sync')) return handleSync(request, env, url);
    if (url.pathname.startsWith('/tts')) return handleTTS(request, env);
    if (request.method !== 'POST') return cors(JSON.stringify({ error: 'Method not allowed' }), 405);
    let body;
    try { body = await request.json(); } catch { return cors(JSON.stringify({ error: 'Invalid JSON' }), 400); }
    const messages = body.messages || [];
    const max_tokens = body.max_tokens || 1024;
    const available = PROVIDERS.filter(p => env[p.keyEnv]);
    const order = shuffle(available);
    for (const p of order) {
      try {
        const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env[p.keyEnv]}`, ...(p.extra || {}) };
        const res = await fetch(p.url, { method: 'POST', headers, body: JSON.stringify({ model: p.model, messages, max_tokens }), signal: AbortSignal.timeout(30000) });
        if (res.ok) return cors(await res.text());
        if (res.status === 429) continue;
      } catch { continue; }
    }
    try {
      const res = await fetch('https://text.pollinations.ai/openai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'openai', messages, max_tokens }), signal: AbortSignal.timeout(30000) });
      if (res.ok) return cors(await res.text());
    } catch {}
    return cors(JSON.stringify({ error: 'All providers unavailable' }), 502);
  },
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

const PRICE_FALLBACK = { pro: 'price_1TnHz3Em0xqepKvLCBfnW5dd', max: 'price_1TnI4oEm0xqepKvLvoGiTO9X' };

/* ── Realistic voices ──────────────────────────────────────────────
   Reuses the GROQ_KEY secret already configured for chat — no separate
   key needed. Orpheus (Canopy Labs) returns clearly gendered neural voices.
   Groq caps input at 200 characters, so the app sends one sentence/chunk
   at a time rather than a whole reply in one call. */
async function handleTTS(request, env) {
  if (request.method !== 'POST') return cors(JSON.stringify({ error: 'Method not allowed' }), 405);
  if (!env.GROQ_KEY) return cors(JSON.stringify({ error: 'tts not configured' }), 503);
  let body; try { body = await request.json(); } catch { return cors(JSON.stringify({ error: 'Invalid JSON' }), 400); }
  const text = (body.text || '').toString().slice(0, 200);
  const voice = (body.voice || 'autumn').toString();
  if (!text) return cors(JSON.stringify({ error: 'text required' }), 400);
  try {
    const res = await fetch('https://api.groq.com/openai/v1/audio/speech', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${env.GROQ_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'canopylabs/orpheus-v1-english', input: text, voice, response_format: 'wav' }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      return cors(JSON.stringify({ error: 'tts provider error', detail: detail.slice(0, 300) }), 502);
    }
    const buf = await res.arrayBuffer();
    return new Response(buf, { status: 200, headers: { 'Content-Type': 'audio/wav', 'Access-Control-Allow-Origin': '*' } });
  } catch (e) {
    return cors(JSON.stringify({ error: String(e) }), 500);
  }
}

/* ── Cross-device sync ─────────────────────────────────────────────
   Backups live in the PLANS KV namespace, guarded by a per-account sync
   code: the first push registers the code, every later push/pull must
   present the same one. No code, no data. */
async function handleSync(request, env, url) {
  if (!env.PLANS) return cors(JSON.stringify({ error: 'sync not configured' }), 503);
  const path = url.pathname.replace(/\/+$/, '');

  if (path === '/sync/put' && request.method === 'POST') {
    let b; try { b = await request.json(); } catch { return cors(JSON.stringify({ error: 'bad json' }), 400); }
    const email = (b.email || '').toLowerCase().trim();
    const token = (b.token || '').trim();
    if (!email || token.length < 6 || typeof b.data !== 'object' || !b.data) {
      return cors(JSON.stringify({ error: 'email, sync code (6+ chars) and data required' }), 400);
    }
    const stored = await env.PLANS.get('synctok:' + email);
    if (stored && stored !== token) return cors(JSON.stringify({ error: 'wrong sync code' }), 403);
    if (!stored) await env.PLANS.put('synctok:' + email, token);
    await env.PLANS.put('syncdata:' + email, JSON.stringify({ at: Date.now(), data: b.data }));
    return cors(JSON.stringify({ ok: true, at: Date.now() }));
  }

  if (path === '/sync/get' && request.method === 'GET') {
    const email = (url.searchParams.get('email') || '').toLowerCase().trim();
    const token = (url.searchParams.get('token') || '').trim();
    const stored = await env.PLANS.get('synctok:' + email);
    if (!stored || stored !== token) return cors(JSON.stringify({ error: 'wrong sync code' }), 403);
    const raw = await env.PLANS.get('syncdata:' + email);
    return cors(raw || JSON.stringify({ at: 0, data: null }));
  }

  return cors(JSON.stringify({ error: 'not found' }), 404);
}

async function handlePay(request, env, url) {
  const path = url.pathname.replace(/\/+$/, '');
  const appUrl = env.APP_URL || 'https://void-v2-1.onrender.com';

  if (path === '/pay/status' && request.method === 'GET') {
    const email = (url.searchParams.get('email') || '').toLowerCase();
    let plan = 'free';
    if (email && env.PLANS) plan = (await env.PLANS.get('plan:' + email)) || 'free';
    return cors(JSON.stringify({ plan }));
  }

  if (path === '/pay/create' && request.method === 'POST') {
    let b; try { b = await request.json(); } catch { return cors(JSON.stringify({ error: 'bad json' }), 400); }
    const email = (b.email || '').toLowerCase();
    const plan = b.plan === 'max' ? 'max' : 'pro';
    if (!email) return cors(JSON.stringify({ error: 'email required' }), 400);
    try {
      if (!env.STRIPE_SECRET_KEY) return cors(JSON.stringify({ error: 'payments not configured yet' }), 503);
      const price = env['STRIPE_PRICE_' + plan.toUpperCase()] || PRICE_FALLBACK[plan];
      const form = new URLSearchParams();
      form.set('mode', 'subscription');
      form.set('line_items[0][price]', price);
      form.set('line_items[0][quantity]', '1');
      form.set('customer_email', email);
      form.set('success_url', `${appUrl}/?upgraded=${plan}`);
      form.set('cancel_url', `${appUrl}/?canceled=1`);
      form.set('metadata[email]', email);
      form.set('metadata[plan]', plan);
      form.set('subscription_data[metadata][email]', email);
      form.set('subscription_data[metadata][plan]', plan);
      const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString(),
      });
      const data = await r.json();
      if (!r.ok) return cors(JSON.stringify({ error: data.error?.message || 'stripe error' }), 502);
      return cors(JSON.stringify({ url: data.url }));
    } catch (e) { return cors(JSON.stringify({ error: String(e) }), 500); }
  }

  if (path === '/pay/stripe-webhook' && request.method === 'POST') {
    const sig = request.headers.get('stripe-signature') || '';
    const raw = await request.text();
    if (!(await verifyStripe(raw, sig, env.STRIPE_WEBHOOK_SECRET))) return cors('bad sig', 400);
    let evt; try { evt = JSON.parse(raw); } catch { return cors('bad json', 400); }
    if (evt.type === 'checkout.session.completed' || evt.type === 'invoice.paid') {
      const obj = evt.data.object;
      const email = (obj.customer_email || obj.metadata?.email || '').toLowerCase();
      const plan = obj.metadata?.plan || 'pro';
      if (email && env.PLANS) await env.PLANS.put('plan:' + email, plan);
    }
    if (evt.type === 'customer.subscription.deleted') {
      const email = (evt.data.object.metadata?.email || '').toLowerCase();
      if (email && env.PLANS) await env.PLANS.put('plan:' + email, 'free');
    }
    return cors(JSON.stringify({ received: true }));
  }

  if (path === '/pay/xendit-webhook' && request.method === 'POST') {
    const token = request.headers.get('x-callback-token') || '';
    if (env.XENDIT_CALLBACK_TOKEN && token !== env.XENDIT_CALLBACK_TOKEN) return cors('bad token', 401);
    let b; try { b = await request.json(); } catch { return cors('bad json', 400); }
    if (b.status === 'PAID' || b.status === 'SETTLED') {
      const email = (b.payer_email || b.metadata?.email || (b.external_id || '').split(':')[1] || '').toLowerCase();
      const plan = b.metadata?.plan || (b.external_id || '').split(':')[2] || 'pro';
      if (email && env.PLANS) await env.PLANS.put('plan:' + email, plan);
    }
    return cors(JSON.stringify({ received: true }));
  }

  return cors(JSON.stringify({ error: 'not found' }), 404);
}

async function verifyStripe(payload, sigHeader, secret) {
  if (!secret) return true;
  try {
    const parts = Object.fromEntries(sigHeader.split(',').map(kv => kv.split('=')));
    const t = parts.t, v1 = parts.v1;
    if (!t || !v1) return false;
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${t}.${payload}`));
    const hex = [...new Uint8Array(mac)].map(b => b.toString(16).padStart(2, '0')).join('');
    return hex === v1;
  } catch { return false; }
}

function cors(body, status = 200) {
  return new Response(body, { status, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
}
