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

    const url = new URL(request.url);
    // ── Payments live under /pay/* ──────────────────────────────────────────
    if (url.pathname.startsWith('/pay')) return handlePay(request, env, url);

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

/* ===========================================================================
   PAYMENTS  —  Stripe (worldwide cards) + Xendit (TNG / GrabPay / FPX / cards)
   Plan status is stored in KV (binding: PLANS) keyed by  plan:<email>.
   Secrets (Cloudflare → Settings → Variables, type "Secret"):
     STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_PRO, STRIPE_PRICE_MAX
     XENDIT_SECRET_KEY, XENDIT_CALLBACK_TOKEN
   Plain var: APP_URL = https://void-v2-1.onrender.com
   =========================================================================== */

const PLAN_AMOUNT_MYR = { pro: 23, max: 69 }; // ~ $5 / $15

async function handlePay(request, env, url) {
  const path = url.pathname.replace(/\/+$/, '');
  const appUrl = env.APP_URL || 'https://void-v2-1.onrender.com';

  // GET /pay/status?email=  → { plan }
  if (path === '/pay/status' && request.method === 'GET') {
    const email = (url.searchParams.get('email') || '').toLowerCase();
    let plan = 'free';
    if (email && env.PLANS) plan = (await env.PLANS.get('plan:' + email)) || 'free';
    return cors(JSON.stringify({ plan }));
  }

  // POST /pay/create  { email, plan, method }  → { url }
  if (path === '/pay/create' && request.method === 'POST') {
    let b; try { b = await request.json(); } catch { return cors(JSON.stringify({ error: 'bad json' }), 400); }
    const email = (b.email || '').toLowerCase();
    const plan = b.plan === 'max' ? 'max' : 'pro';
    const method = b.method === 'ewallet' ? 'ewallet' : 'card';
    if (!email) return cors(JSON.stringify({ error: 'email required' }), 400);

    try {
      if (method === 'card') {
        if (!env.STRIPE_SECRET_KEY) return cors(JSON.stringify({ error: 'card payments not configured yet' }), 503);
        const price = env['STRIPE_PRICE_' + plan.toUpperCase()];
        if (!price) return cors(JSON.stringify({ error: 'stripe price not set' }), 503);
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
      } else {
        // Xendit hosted invoice — shows every method you've enabled (TNG, GrabPay,
        // ShopeePay, FPX online banking, cards…). No payment_methods filter so all show.
        if (!env.XENDIT_SECRET_KEY) return cors(JSON.stringify({ error: 'e-wallet payments not configured yet' }), 503);
        const payload = {
          external_id: `void:${email}:${plan}:${Date.now()}`,
          amount: PLAN_AMOUNT_MYR[plan],
          currency: 'MYR',
          payer_email: email,
          description: `VOID ${plan.toUpperCase()} subscription`,
          success_redirect_url: `${appUrl}/?upgraded=${plan}`,
          failure_redirect_url: `${appUrl}/?canceled=1`,
          metadata: { email, plan },
        };
        const r = await fetch('https://api.xendit.co/v2/invoices', {
          method: 'POST',
          headers: { 'Authorization': 'Basic ' + btoa(env.XENDIT_SECRET_KEY + ':'), 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await r.json();
        if (!r.ok) return cors(JSON.stringify({ error: data.message || 'xendit error' }), 502);
        return cors(JSON.stringify({ url: data.invoice_url }));
      }
    } catch (e) {
      return cors(JSON.stringify({ error: String(e) }), 500);
    }
  }

  // POST /pay/stripe-webhook  — verify signature, then grant plan
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

  // POST /pay/xendit-webhook — verify callback token, then grant plan
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

// Verify Stripe webhook signature (HMAC-SHA256 over `${t}.${payload}`)
async function verifyStripe(payload, sigHeader, secret) {
  if (!secret) return true; // no secret set yet → don't block during setup
  try {
    const parts = Object.fromEntries(sigHeader.split(',').map(kv => kv.split('=')));
    const t = parts.t, v1 = parts.v1;
    if (!t || !v1) return false;
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${t}.${payload}`));
    const hex = [...new Uint8Array(mac)].map(b => b.toString(16).padStart(2, '0')).join('');
    return hex === v1;
  } catch { return false; }
}

function cors(body, status = 200) {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
