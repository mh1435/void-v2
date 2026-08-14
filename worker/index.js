const PROVIDERS = [
  { id: 'groq', url: 'https://api.groq.com/openai/v1/chat/completions', model: 'llama-3.1-8b-instant', keyEnv: 'GROQ_KEY' },
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

const WORKER_VERSION = 'v9-vision-debug';

// When a request includes an image, only vision-capable models can "see" it.
// Route those to the right model per provider (text-only models silently
// ignore images, which looks like "VOID can't see pictures").
// Groq's Llama-4 Scout is the workhorse fallback when Gemini is rate-limited.
const VISION_MODELS = {
  groq:       'meta-llama/llama-4-scout-17b-16e-instruct',
  openrouter: 'qwen/qwen2.5-vl-72b-instruct:free',
  mistral:    'pixtral-12b-2409',
  together:   'meta-llama/Llama-4-Scout-17B-16E-Instruct',
};

function messagesHaveImage(messages) {
  return messages.some(m => Array.isArray(m.content)
    && m.content.some(p => p && (p.type === 'image_url' || p.type === 'image' || p.image_url)));
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return cors(null, 204);
    const url = new URL(request.url);
    if (url.pathname === '/health') return cors(JSON.stringify({ ok: true, v: WORKER_VERSION }));
    if (url.pathname.startsWith('/pay')) return handlePay(request, env, url);
    if (url.pathname.startsWith('/sync')) return handleSync(request, env, url);
    if (url.pathname.startsWith('/tts')) return handleTTS(request, env);
    if (url.pathname.startsWith('/image-edit')) return handleImageEdit(request, env);
    if (url.pathname.startsWith('/song-id')) return handleSongId(request, env);
    if (url.pathname.startsWith('/transcribe')) return handleTranscribe(request, env);
    if (url.pathname.startsWith('/v1/claude')) return handleClaudeProxy(request);
    if (request.method !== 'POST') return cors(JSON.stringify({ error: 'Method not allowed' }), 405);
    let body;
    try { body = await request.json(); } catch { return cors(JSON.stringify({ error: 'Invalid JSON' }), 400); }
    const messages = body.messages || [];
    const max_tokens = body.max_tokens || 1024;
    const wantStream = !!body.stream;
    const available = PROVIDERS.filter(p => env[p.keyEnv]);

    // Vision requests get their own path: only vision-capable models may answer
    // (a text model would bluff "I can't see images"), with error details
    // returned when every one of them fails so problems are diagnosable.
    if (messagesHaveImage(messages)) {
      const verr = [];
      if (env.GEMINI_KEY) {
        try { return await handleVisionGemini(messages, max_tokens, env); }
        catch (e) { verr.push('gemini-native: ' + String(e).slice(0, 120)); }
      }
      const vorder = available
        .filter(p => VISION_MODELS[p.id] && p.id !== 'gemini')
        .map(p => ({ ...p, model: VISION_MODELS[p.id] }))
        .sort((a, b) => (a.id === 'groq' ? -1 : b.id === 'groq' ? 1 : 0));
      for (const p of vorder) {
        try {
          const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env[p.keyEnv]}`, ...(p.extra || {}) };
          const res = await fetch(p.url, { method: 'POST', headers, body: JSON.stringify({ model: p.model, messages, max_tokens }), signal: AbortSignal.timeout(60000) });
          if (res.ok) return cors(await res.text());
          verr.push(p.id + ': ' + res.status + ' ' + (await res.text().catch(() => '')).slice(0, 160));
        } catch (e) { verr.push(p.id + ': ' + String(e).slice(0, 120)); }
      }
      return cors(JSON.stringify({ error: 'vision providers failed', detail: verr }), 502);
    }

    const order = shuffle(available);
    for (const p of order) {
      try {
        const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env[p.keyEnv]}`, ...(p.extra || {}) };
        const res = await fetch(p.url, { method: 'POST', headers, body: JSON.stringify({ model: p.model, messages, max_tokens, stream: wantStream }), signal: AbortSignal.timeout(60000) });
        // res.ok only requires the response headers to have arrived, not the
        // (possibly still-streaming) body — so it's still safe to fall back
        // to the next provider below without ever having sent bytes to the client.
        if (res.ok) return wantStream ? streamResponse(res) : cors(await res.text());
        if (res.status === 429) continue;
      } catch { continue; }
    }
    try {
      const res = await fetch('https://text.pollinations.ai/openai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'openai', messages, max_tokens, stream: wantStream }), signal: AbortSignal.timeout(60000) });
      if (res.ok) return wantStream ? streamResponse(res) : cors(await res.text());
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

/* ── Image editing (reference-image generation) ─────────────────────
   Reuses the GEMINI_KEY secret already configured for chat — no separate
   key needed. Gemini's image-capable model can take a user photo plus a
   text prompt and return an edited/restyled image. */
async function handleImageEdit(request, env) {
  if (request.method !== 'POST') return cors(JSON.stringify({ error: 'Method not allowed' }), 405);
  if (!env.GEMINI_KEY) return cors(JSON.stringify({ error: 'image editing not configured' }), 503);
  let body; try { body = await request.json(); } catch { return cors(JSON.stringify({ error: 'Invalid JSON' }), 400); }
  const prompt = (body.prompt || '').toString().slice(0, 800);
  const imageData = (body.image || '').toString();
  const mimeType = (body.mimeType || 'image/jpeg').toString();
  if (!prompt || !imageData) return cors(JSON.stringify({ error: 'prompt and image required' }), 400);
  try {
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent', {
      method: 'POST',
      headers: { 'x-goog-api-key': env.GEMINI_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data: imageData } }] }],
        generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
      }),
      signal: AbortSignal.timeout(45000),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      return cors(JSON.stringify({ error: 'image edit provider error', detail: detail.slice(0, 300) }), 502);
    }
    const data = await res.json();
    const parts = data?.candidates?.[0]?.content?.parts || [];
    const imgPart = parts.find(p => p.inline_data || p.inlineData);
    const inline = imgPart?.inline_data || imgPart?.inlineData;
    if (!inline?.data) return cors(JSON.stringify({ error: 'no image returned' }), 502);
    return cors(JSON.stringify({ mimeType: inline.mime_type || inline.mimeType || 'image/png', data: inline.data }));
  } catch (e) {
    return cors(JSON.stringify({ error: String(e) }), 500);
  }
}

/* ── Vision via Gemini's native API ──────────────────────────────────
   Converts OpenAI-style messages (text + image_url data URIs) into Gemini
   contents and returns an OpenAI-shaped completion. The client's streaming
   reader already falls back to plain JSON when the response isn't SSE. */
async function handleVisionGemini(messages, max_tokens, env) {
  const contents = [];
  let systemText = '';
  for (const m of messages) {
    if (m.role === 'system') {
      systemText += (typeof m.content === 'string' ? m.content : '') + '\n';
      continue;
    }
    const role = m.role === 'assistant' ? 'model' : 'user';
    const parts = [];
    if (Array.isArray(m.content)) {
      for (const p of m.content) {
        if (p.type === 'image_url') {
          const u = p.image_url?.url || '';
          const b64 = u.split(',')[1] || '';
          const mime = (u.match(/^data:([^;]+);/) || [])[1] || 'image/jpeg';
          if (b64) parts.push({ inline_data: { mime_type: mime, data: b64 } });
        } else if (p.type === 'text' && p.text) {
          parts.push({ text: p.text });
        }
      }
    } else if (m.content != null && String(m.content).length) {
      parts.push({ text: String(m.content) });
    }
    if (parts.length) contents.push({ role, parts });
  }
  const body = { contents, generationConfig: { maxOutputTokens: max_tokens } };
  if (systemText.trim()) body.system_instruction = { parts: [{ text: systemText.trim() }] };
  const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
    method: 'POST',
    headers: { 'x-goog-api-key': env.GEMINI_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(45000),
  });
  if (!res.ok) throw new Error('gemini vision ' + res.status);
  const data = await res.json();
  const text = (data?.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('').trim();
  if (!text) throw new Error('gemini vision empty');
  return cors(JSON.stringify({ choices: [{ message: { role: 'assistant', content: text } }] }));
}

/* ── Claude (Anthropic) bring-your-own-key proxy ──────────────────────
   Anthropic's API rejects direct browser calls (no CORS allow-list for
   arbitrary web origins), so the client can't call api.anthropic.com
   itself — this worker does it server-to-server instead. The user's own
   key rides along in the Authorization header exactly like every other
   OpenAI-compatible provider the client already calls directly; it's
   never stored, just relayed for this one request. Converts both
   directions (OpenAI-shaped request in, OpenAI-shaped response out) so
   the client's existing callOpenAICompatStream() needs zero special-casing. */
async function handleClaudeProxy(request) {
  if (request.method !== 'POST') return cors(JSON.stringify({ error: 'Method not allowed' }), 405);
  const auth = request.headers.get('Authorization') || '';
  const apiKey = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!apiKey) return cors(JSON.stringify({ error: { message: 'Claude API key missing' } }), 401);

  let body; try { body = await request.json(); } catch { return cors(JSON.stringify({ error: { message: 'Invalid JSON' } }), 400); }
  const messages = body.messages || [];
  const system = messages.find(m => m.role === 'system');
  const claudeMessages = messages.filter(m => m.role !== 'system').map(m => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: Array.isArray(m.content)
      ? m.content.map(p => p.type === 'image_url'
          ? { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: (p.image_url?.url || '').split(',')[1] || '' } }
          : { type: 'text', text: p.text || '' })
      : String(m.content ?? ''),
  }));

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: body.model || 'claude-sonnet-4-5-20250929',
        max_tokens: body.max_tokens || 1024,
        ...(system ? { system: system.content } : {}),
        messages: claudeMessages,
      }),
      signal: AbortSignal.timeout(60000),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data) {
      return cors(JSON.stringify({ error: { message: data?.error?.message || `Claude ${res.status}` } }), res.status || 502);
    }
    const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    return cors(JSON.stringify({ choices: [{ message: { role: 'assistant', content: text } }] }));
  } catch (e) {
    return cors(JSON.stringify({ error: { message: String(e) } }), 502);
  }
}

/* ── Song recognition (Shazam-style, fully in-app) ───────────────────
   The app records ~10 s of audio and sends it here; we forward it to
   AudD's recognition API. Set an AUDD_TOKEN secret (free key from
   audd.io) for reliable use — without one AudD allows a small number of
   trial requests. */
async function handleSongId(request, env) {
  if (request.method !== 'POST') return cors(JSON.stringify({ error: 'Method not allowed' }), 405);
  let body; try { body = await request.json(); } catch { return cors(JSON.stringify({ error: 'Invalid JSON' }), 400); }
  const audioB64 = (body.audio || '').toString();
  if (!audioB64) return cors(JSON.stringify({ error: 'audio required' }), 400);
  if (audioB64.length > 4_000_000) return cors(JSON.stringify({ error: 'audio too large' }), 413);
  try {
    const bytes = Uint8Array.from(atob(audioB64), c => c.charCodeAt(0));
    const form = new FormData();
    form.set('file', new Blob([bytes], { type: body.mimeType || 'audio/webm' }), 'clip.webm');
    if (env.AUDD_TOKEN) form.set('api_token', env.AUDD_TOKEN);
    form.set('return', 'spotify');
    const res = await fetch('https://api.audd.io/', { method: 'POST', body: form, signal: AbortSignal.timeout(25000) });
    const data = await res.json().catch(() => null);
    if (!data) return cors(JSON.stringify({ error: 'recognition failed' }), 502);
    if (data.status === 'success' && data.result) {
      return cors(JSON.stringify({
        found: true,
        title: data.result.title || '',
        artist: data.result.artist || '',
        album: data.result.album || '',
        link: data.result.song_link || '',
      }));
    }
    if (data.status === 'error') {
      return cors(JSON.stringify({ found: false, error: data.error?.error_message || 'recognition error' }));
    }
    return cors(JSON.stringify({ found: false }));
  } catch (e) {
    return cors(JSON.stringify({ error: String(e) }), 500);
  }
}

/* ── Audio transcription (lectures / voice notes) ────────────────────
   Reuses GROQ_KEY: Whisper large v3 turns a recording into text the app
   can summarize, quiz on, or turn into a cheat sheet. */
async function handleTranscribe(request, env) {
  if (request.method !== 'POST') return cors(JSON.stringify({ error: 'Method not allowed' }), 405);
  if (!env.GROQ_KEY) return cors(JSON.stringify({ error: 'transcription not configured' }), 503);
  let body; try { body = await request.json(); } catch { return cors(JSON.stringify({ error: 'Invalid JSON' }), 400); }
  const audioB64 = (body.audio || '').toString();
  if (!audioB64) return cors(JSON.stringify({ error: 'audio required' }), 400);
  if (audioB64.length > 33_000_000) return cors(JSON.stringify({ error: 'audio too large (24 MB max)' }), 413);
  try {
    const bytes = Uint8Array.from(atob(audioB64), c => c.charCodeAt(0));
    const name = (body.name || 'audio.m4a').toString().replace(/[^\w.-]/g, '_');
    const form = new FormData();
    form.set('file', new Blob([bytes], { type: body.mimeType || 'audio/mp4' }), name);
    form.set('model', 'whisper-large-v3');
    form.set('response_format', 'json');
    const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${env.GROQ_KEY}` },
      body: form,
      signal: AbortSignal.timeout(60000),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      return cors(JSON.stringify({ error: 'transcription provider error', detail: detail.slice(0, 300) }), 502);
    }
    const data = await res.json();
    return cors(JSON.stringify({ text: (data.text || '').trim() }));
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

// Pipes an upstream SSE chat-completions stream straight through to the
// client as it arrives, instead of buffering the whole reply first.
function streamResponse(res) {
  return new Response(res.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
