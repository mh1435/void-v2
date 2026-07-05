/* =========================================================
   VOID // CORE APPLICATION LOGIC
   ========================================================= */

const App = {
  settings: {
    theme: 'frost',
    apiKey: '', model: 'meta-llama/llama-3.2-3b-instruct:free',
    geminiKey: '', geminiModel: 'gemini-2.5-flash',
    groqKey: '', groqModel: 'llama-3.3-70b-versatile',
    togetherKey: '', togetherModel: 'meta-llama/Llama-3.2-70B-Instruct-Turbo',
    mistralKey: '', mistralModel: 'mistral-large-latest',
    providerOrder: ['gemini', 'groq', 'openrouter'],
    mapProvider: 'google',
    lang: 'en',
    responseMode: 'standard',
    reducedMotion: false,
    voiceEnabled: true, voiceRate: 1.0, voicePitch: 1.0, voiceName: '',
    voiceEngine: 'device', realisticVoice: 'autumn',
    wakeWord: false,
    floatingAssistantEnabled: false,
    haptic: true,
    accentColor: '', accentColor2: '',
    persona: '',
    autoMemory: true,
    briefEnabled: false, briefTime: '08:00', briefFiredDate: '',
  },
  tasks: [],
  commands: [],
  memoryFacts: [],   // auto-extracted facts about the user, persisted per account
  bookmarks: [],     // starred assistant messages
  documents: [],     // created/edited documents, per account
  gems: [],          // user-created custom assistants (like Gemini Gems)
  githubToken: '',   // user's GitHub PAT — device-only, never synced
  githubUser: null,  // { login, ... } once connected
  githubRepos: [],
  githubFile: null,  // { owner, repo, path, sha, content } — the file currently open for editing
  chatHistory: [],   // messages of the ACTIVE chat (reference into chats[].messages)
  chats: [],         // [{ id, title, messages:[], updatedAt }]
  currentChatId: null,
  msgCount: 0,
  location: null,
  hubDetailReturnTab: 'tab-gamehub',
  currentUser: null,
  liveContext: { city: null, country: null, lat: null, lon: null, weather: null, weatherIcon: null, temp: null, localTime: null, timezone: null },
};

const VOID_SYSTEM = `You are VOID, an intelligent AI assistant built into the VOID app. You have access to the following capabilities:
- Multi-provider AI chat (Gemini, Groq, OpenRouter, Together, Mistral, Pollinations)
- Real-time weather: the user's current location's weather is auto-injected as LIVE CONTEXT below (when available), and if they ask about weather in a different city, real data for that city is injected as a WEATHER LOOKUP block below
- Location & time awareness: the user's approximate city, country, local time, and today's date are auto-detected and injected as LIVE CONTEXT below (when available)
- Study Mode: immersive ambient video environments for focus and deep work
- Voice output: read responses aloud via text-to-speech
- MLBB Game Hub: hero guides, builds, counters, and meta (only when the user asks about it)
- Floating assistant overlay: accessible over other apps
- Custom commands and task lists
- Knowledge lookups: "who is X" / "what is X" / "tell me about X" pull a real Wikipedia summary, injected as a KNOWLEDGE LOOKUP block below
- /define <word>, /price <coin>, /image <prompt>, /convert <amount> <from> to <to>, /brief (daily briefing) quick commands
- Opening other apps/sites on request ("open spotify", "navigate to X", "play X on youtube")

Rules:
- NEVER proactively mention MLBB, gaming, or hero builds unless the user brings it up first
- Match your response length to the question — short question = short answer, complex question = detailed answer
- If asked what you can do, describe the capabilities above naturally
- Be direct, useful, and conversational
- CRITICAL: If a LIVE CONTEXT, WEATHER LOOKUP, or KNOWLEDGE LOOKUP block appears below, that data is real and current — use it directly to answer. NEVER say "I'm just a language model", "I don't have access to real-time information", or suggest the user check a website instead — you DO have this data when it's provided below. Only say data is unavailable if no such block was given for that request.`;

/* Share-to-VOID: MainActivity delivers text shared from other apps here.
   Registered at parse time so cold-start retries from the native side land. */
window.__voidReceiveShare = (text) => {
  App.pendingShare = text;
  applyPendingShare();
};
function applyPendingShare() {
  if (!App.pendingShare) return;
  const input = document.getElementById('chat-input');
  if (!input) return;
  try { switchTab('tab-chat'); } catch (_) {}
  input.value = App.pendingShare;
  input.dispatchEvent(new Event('input'));
  App.pendingShare = null;
}

/* Personas — selectable modes that reshape how VOID responds */
const PERSONAS = [
  { id: '',          label: 'Default',    emoji: '🌀', prompt: '' },
  { id: 'tutor',     label: 'Tutor',      emoji: '📚', prompt: 'PERSONA: You are in TUTOR mode. Explain step by step, check understanding, use simple examples, and encourage the user. Never just give the answer to homework-style questions — guide them to it.' },
  { id: 'coder',     label: 'Coder',      emoji: '💻', prompt: 'PERSONA: You are in CODER mode. Be precise and technical. Prefer code examples over prose, mention edge cases, and keep explanations tight. Assume the user is a developer.' },
  { id: 'translator',label: 'Translator', emoji: '🌐', prompt: 'PERSONA: You are in TRANSLATOR mode. When given text, translate it. If the target language is not specified, ask once, then remember it. Show only the translation plus a short pronunciation hint when useful.' },
  { id: 'listener',  label: 'Listener',   emoji: '💙', prompt: 'PERSONA: You are in LISTENER mode. Be warm, calm, and supportive. Listen more than you advise. Never lecture. You are not a therapist and say so if things get serious, suggesting professional help.' },
  { id: 'roast',     label: 'Roast',      emoji: '🔥', prompt: 'PERSONA: You are in ROAST mode. Be playfully savage and witty with the user — clever burns, never genuinely cruel, never slurs or attacks on protected traits. Keep it fun.' },
];

const IMAGE_STYLES = [
  { id: '',                                                     emoji: '🎨', label: 'No style' },
  { id: 'photorealistic, highly detailed, 8k',                  emoji: '📷', label: 'Realistic' },
  { id: 'anime style, vibrant colors, studio quality',          emoji: '🌸', label: 'Anime' },
  { id: '3d render, octane render, cinematic lighting',         emoji: '🧊', label: '3D Render' },
  { id: 'pixel art, 16-bit, retro game style',                  emoji: '👾', label: 'Pixel Art' },
  { id: 'cinematic still, dramatic lighting, film grain',       emoji: '🎬', label: 'Cinematic' },
];

const LANG_NAMES = {
  en:'English', ar:'Arabic', ms:'Malay', id:'Indonesian', tl:'Filipino',
  th:'Thai', vi:'Vietnamese', zh:'Chinese', ko:'Korean', ja:'Japanese',
  tr:'Turkish', ru:'Russian', es:'Spanish', pt:'Portuguese',
  fr:'French', de:'German', it:'Italian', nl:'Dutch',
};

const STT_LANG_MAP = {
  en:'en-US', ar:'ar-SA', ms:'ms-MY', id:'id-ID', tl:'fil-PH',
  th:'th-TH', vi:'vi-VN', zh:'zh-CN', ko:'ko-KR', ja:'ja-JP',
  tr:'tr-TR', ru:'ru-RU', es:'es-ES', pt:'pt-BR', fr:'fr-FR',
  de:'de-DE', it:'it-IT', nl:'nl-NL',
};

function getSTTLang() {
  return STT_LANG_MAP[getActiveLang()] || 'en-US';
}

function getActiveLang() {
  const s = App.settings.lang;
  if (!s || s === 'auto') return 'en';
  return s;
}

function buildSystemPrompt(extraCtx) {
  const s = App.settings.lang;
  let inject;
  if (s && s !== 'auto' && s !== 'en') {
    const name = LANG_NAMES[s] || 'English';
    inject = `\n\nLANGUAGE: Prefer ${name}, but if the user clearly writes in another language, reply in THAT language. Always match the language the user wrote in.`;
  } else {
    inject = `\n\nLANGUAGE: Detect the language of the user's latest message and ALWAYS reply in that exact same language (English → English, Arabic → العربية, etc.). Mirror the user's language and script; never switch on your own.`;
  }
  let liveCtx = '';
  if (App.liveContext.city) {
    const now = new Date();
    const DAYS_FULL = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const MONTHS_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const dateStr = `${DAYS_FULL[now.getDay()]}, ${MONTHS_FULL[now.getMonth()]} ${now.getDate()} ${now.getFullYear()}`;
    liveCtx = `\n\nLIVE CONTEXT (auto-detected, may not be 100% accurate):\n- User location: ${App.liveContext.city}, ${App.liveContext.country}\n- Local time: ${App.liveContext.localTime || ''}\n- Current weather: ${App.liveContext.weather || 'unavailable'}\n- Today's date: ${dateStr}`;
  }
  const pid = App.settings.persona || '';
  let personaCtx = '';
  if (pid.startsWith('gem:')) {
    const gem = App.gems.find(g => g.id === pid);
    if (gem && gem.instructions) personaCtx = `\n\nYou are "${gem.name}", a custom assistant created by the user. Follow these instructions above all: ${gem.instructions}`;
  } else {
    const persona = PERSONAS.find(p => p.id === pid);
    if (persona && persona.prompt) personaCtx = `\n\n${persona.prompt}`;
  }
  return VOID_SYSTEM + personaCtx + inject + liveCtx + memoryContext() + (extraCtx || '');
}

// Detect "weather in <city>" style questions so we can fetch real data for ANY city, not just the user's own.
function extractWeatherCity(text) {
  const m = text.match(/\b(?:weather|temperature|temp|forecast|how (?:hot|cold|warm)(?: is it)?)\b[\s\S]*?\b(?:in|for|at)\s+([a-zA-ZÀ-ɏ؀-ۿ'\- ]{2,40})/i);
  if (!m) return null;
  let city = m[1].trim().replace(/\b(today|now|right now|currently|tomorrow|tonight|this week|please)\b/gi, '').trim();
  city = city.replace(/[?.!,]+$/, '').trim();
  return city.length >= 2 ? city : null;
}

async function fetchWeatherForCity(city) {
  try {
    const wr = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=%C+%t+(feels+%f)`);
    if (wr.ok) {
      const w = (await wr.text()).trim();
      if (w && !w.includes('<') && w.length < 60 && !/unknown location/i.test(w)) return w;
    }
  } catch(_) {}
  return null;
}

async function getWeatherLookupCtx(text) {
  const city = extractWeatherCity(text);
  if (!city) return '';
  const w = await fetchWeatherForCity(city);
  if (!w) return '';
  return `\n\nWEATHER LOOKUP for "${city}": ${w}. This is real current data — use it directly to answer.`;
}

// "who is X" / "what is X" / "tell me about X" — ground the reply in a real Wikipedia summary
// instead of letting the model guess from training data.
function extractKnowledgeQuery(text) {
  const m = text.match(/^(?:who|what)\s+(?:is|are|was|were)\s+(.+?)\??$|^tell me about\s+(.+?)\??$/i);
  if (!m) return null;
  const q = (m[1] || m[2] || '').trim();
  return q.length >= 2 && q.length <= 80 ? q : null;
}

async function getKnowledgeLookupCtx(text) {
  const q = extractKnowledgeQuery(text);
  if (!q) return { ctx: '', source: null };
  try {
    const r = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q.replace(/\s+/g, '_'))}`);
    if (!r.ok) return { ctx: '', source: null };
    const d = await r.json();
    if (!d.extract) return { ctx: '', source: null };
    const url = d.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(q.replace(/\s+/g, '_'))}`;
    return { ctx: `\n\nKNOWLEDGE LOOKUP for "${q}" (Wikipedia): ${d.extract}`, source: { label: 'Wikipedia', url } };
  } catch(_) { return { ctx: '', source: null }; }
}

// Natural-language image-generation intent ("draw me a dragon", "generate an
// image of a sunset", "make a picture of..."). Deliberately narrow so it
// only fires on clear requests, not every mention of the word "image".
function extractImageGenPrompt(text) {
  const m = text.trim().match(/^(?:hey\s+void[,\s]+)?(?:can you |could you |please )?(?:draw|paint|sketch)(?:\s+me)?\s+(.+)$/i)
    || text.trim().match(/^(?:hey\s+void[,\s]+)?(?:can you |could you |please )?(?:generate|create|make)(?:\s+me)?\s+(?:an?|the)\s+(?:image|picture|photo|illustration|drawing)\s+of\s+(.+)$/i)
    || text.trim().match(/^(?:hey\s+void[,\s]+)?imagine\s+(.+)$/i);
  if (!m) return null;
  const prompt = m[1].trim().replace(/[?.!]+$/, '').trim();
  return prompt.length >= 2 && prompt.length <= 300 ? prompt : null;
}

// Skip the intent-classification round-trip for messages that are obviously
// plain conversation or questions, so "hi" / "explain recursion" stay instant.
// Anything else (a bare description like "a wolf howling at the moon", or
// "make me a logo") gets classified so VOID can act without a slash command.
function looksLikePlainChat(text) {
  const t = text.trim().toLowerCase();
  if (t.length < 3) return true;
  if (t.endsWith('?')) return true;
  if (/^(hi|hey|hello|yo|sup|gm|hiya|thanks|thank you|thx|ok|okay|k|yes|no|nope|yeah|yep|nice|cool|great|awesome|lol|haha|lmao|good morning|good night|good evening)\b/.test(t)) return true;
  if (/^(what|whats|what's|who|whos|who's|why|how|hows|how's|when|where|which|whose|is|are|am|was|were|do|does|did|can|could|would|will|should|explain|tell me|describe|summarize|summarise|translate|define|help|list|compare|give me a summary|what do you|how do|how does|why is|why do)\b/.test(t)) return true;
  return false;
}

// AI intent router: decides whether a message wants a picture, a written
// document, or is just normal chat — so users never need a slash command.
// Returns { type: 'image'|'document'|'chat', prompt } or null on failure.
async function classifyIntent(text) {
  const reply = await quickAI(
    'You route messages for an assistant that can (a) create an IMAGE, (b) write a DOCUMENT/file, or (c) just CHAT. ' +
    'Reply with ONLY one line:\n' +
    '`IMAGE | <subject>` if the user wants a picture, logo, artwork, or photo created.\n' +
    '`DOCUMENT | <what>` if they want a written document or file produced (resume, cover letter, essay, report, letter, proposal, etc.).\n' +
    '`CHAT` for everything else — questions, explanations, summaries, coding help, translations, or normal conversation.\n' +
    'Rule: if they ask you to explain, describe, summarize, or answer in words, that is CHAT, not IMAGE or DOCUMENT. ' +
    'Examples:\n"a wolf howling at the moon" -> IMAGE | a wolf howling at the moon\n' +
    '"make me a logo for a coffee shop" -> IMAGE | a logo for a coffee shop\n' +
    '"write a cover letter for a nurse role" -> DOCUMENT | a cover letter for a nurse role\n' +
    '"explain how photosynthesis works" -> CHAT\n"summarize this article" -> CHAT',
    text);
  if (!reply) return null;
  const line = reply.trim().split('\n')[0];
  let mm = line.match(/^\s*IMAGE\s*\|\s*(.+)$/i);
  if (mm) return { type: 'image', prompt: mm[1].trim().replace(/[."']+$/, '').trim() };
  mm = line.match(/^\s*DOCUMENT\s*\|\s*(.+)$/i);
  if (mm) return { type: 'document', prompt: mm[1].trim() };
  return { type: 'chat' };
}

// GitHub-ish wording — only messages matching this get a GitHub-intent check,
// and only when a GitHub account is connected.
const GH_HINT = /\b(repo|repos|repositor|github|scaffold|commit|publish|push (?:this|it|that|the|to|my)|create (?:a |an |the )?(?:new )?repo|make (?:a |an |the )?(?:new )?repo)\b/i;

// Turn a plain-language GitHub request into a structured action.
async function classifyGitHubIntent(text) {
  const repoList = App.githubRepos.map(r => r.full_name).slice(0, 30).join(', ');
  const reply = await quickAI(
    'You convert a message into ONE GitHub action. Reply with ONLY one line, one of:\n' +
    'CREATE_REPO | <repo-name>\n' +
    'SCAFFOLD | <owner/repo> | <what to build>\n' +
    'PUSH | <owner/repo> | <file path>\n' +
    'LIST\n' +
    'NONE\n' +
    (App.githubUser ? `The user is @${App.githubUser.login}; for "my repo X" or a bare repo name use ${App.githubUser.login}/X. ` : '') +
    (repoList ? `Their existing repos: ${repoList}. ` : '') +
    'Use SCAFFOLD when they want a whole project/app built. Use PUSH to commit the last reply to a file. ' +
    'If it is not a GitHub request, reply NONE.',
    text);
  if (!reply) return { action: 'none' };
  const line = reply.trim().split('\n')[0].trim();
  let m = line.match(/^CREATE_REPO\s*\|\s*(.+)$/i);
  if (m) return { action: 'create_repo', name: m[1].trim().replace(/\s+/g, '-') };
  m = line.match(/^SCAFFOLD\s*\|\s*([^|]+?)\s*\|\s*(.+)$/i);
  if (m) return { action: 'scaffold', repo: m[1].trim(), desc: m[2].trim() };
  m = line.match(/^PUSH\s*\|\s*([^|]+?)\s*\|\s*(.+)$/i);
  if (m) return { action: 'push', repo: m[1].trim(), path: m[2].trim().replace(/^\/+/, '') };
  if (/^LIST/i.test(line)) return { action: 'list' };
  return { action: 'none' };
}

// Web-search grounding for current-events style questions ("news about X",
// "latest on X", "what's happening with X today"). Uses DuckDuckGo's free
// Instant Answer API — no key. Best-effort: many queries return nothing,
// in which case this contributes no context and the model answers normally.
function extractWebSearchQuery(text) {
  const m = text.match(/\b(?:news (?:about|on)|latest (?:on|news about)|what'?s happening (?:with|in)|current(?:ly)? .* (?:with|on))\s+(.+?)\??$/i);
  if (!m) return null;
  const q = m[1].trim().replace(/[?.!,]+$/, '').trim();
  return q.length >= 2 && q.length <= 80 ? q : null;
}
async function getWebSearchCtx(text) {
  const q = extractWebSearchQuery(text);
  if (!q) return { ctx: '', source: null };
  try {
    const r = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1&skip_disambig=1`);
    if (!r.ok) return { ctx: '', source: null };
    const d = await r.json();
    const summary = d.AbstractText || d.Answer || (d.RelatedTopics || []).map(t => t.Text).filter(Boolean).slice(0, 3).join(' | ');
    if (!summary) return { ctx: '', source: null };
    let source = null;
    if (d.AbstractURL) {
      try { source = { label: new URL(d.AbstractURL).hostname.replace(/^www\./, ''), url: d.AbstractURL }; } catch (_) {}
    }
    return { ctx: `\n\nWEB LOOKUP for "${q}": ${summary.slice(0, 600)}${d.AbstractURL ? ` (source: ${d.AbstractURL})` : ''}`, source };
  } catch (_) { return { ctx: '', source: null }; }
}

/* ============ Open other apps (like Gemini's app-opening) ============ */
// Named apps VOID can hand off to — resolves via https:// deep links (Android routes
// installed apps' verified App Links automatically) or custom URI schemes.
const APP_LAUNCH_MAP = [
  { keys: ['whatsapp'],                     url: 'https://wa.me/',                    label: 'WhatsApp' },
  { keys: ['youtube'],                      url: 'https://youtube.com',               label: 'YouTube' },
  { keys: ['instagram'],                    url: 'https://instagram.com',             label: 'Instagram' },
  { keys: ['twitter', 'x app'],             url: 'https://twitter.com',               label: 'X (Twitter)' },
  { keys: ['facebook'],                     url: 'https://facebook.com',              label: 'Facebook' },
  { keys: ['tiktok'],                       url: 'https://www.tiktok.com',            label: 'TikTok' },
  { keys: ['spotify'],                      url: 'https://open.spotify.com',          label: 'Spotify' },
  { keys: ['maps', 'google maps'],          url: 'https://maps.google.com',           label: 'Maps' },
  { keys: ['gmail', 'email'],               url: 'https://mail.google.com',           label: 'Gmail' },
  { keys: ['play store', 'google play'],    url: 'https://play.google.com/store',     label: 'Play Store' },
  { keys: ['telegram'],                     url: 'https://t.me',                      label: 'Telegram' },
  { keys: ['discord'],                      url: 'https://discord.com/app',           label: 'Discord' },
  { keys: ['reddit'],                       url: 'https://reddit.com',                label: 'Reddit' },
  { keys: ['netflix'],                      url: 'https://netflix.com',               label: 'Netflix' },
  { keys: ['amazon'],                       url: 'https://amazon.com',                label: 'Amazon' },
];

function detectAppAction(text) {
  const t = text.trim();
  let m;

  if ((m = t.match(/\b(?:play|search)\s+(.+?)\s+on\s+youtube\b/i))) {
    return { label: `YouTube search: ${m[1]}`, url: `https://www.youtube.com/results?search_query=${encodeURIComponent(m[1])}` };
  }
  if ((m = t.match(/\b(?:navigate|directions?)\s+to\s+(.+)/i))) {
    return { label: `Directions to ${m[1]}`, url: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(m[1])}` };
  }
  if ((m = t.match(/\bfind\s+(.+?)\s+near me\b/i))) {
    return { label: `${m[1]} near you`, url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(m[1] + ' near me')}` };
  }
  if ((m = t.match(/^google\s+(.{2,80})$/i))) {
    return { label: `Google search: ${m[1]}`, url: `https://www.google.com/search?q=${encodeURIComponent(m[1])}` };
  }
  if ((m = t.match(/\b(?:open|launch|start)\s+(?:the\s+)?([a-z0-9 .]{2,30}?)(?:\s+app)?[.?!]?$/i))) {
    const q = m[1].trim().toLowerCase();
    for (const entry of APP_LAUNCH_MAP) {
      if (entry.keys.some(k => q.includes(k))) return { label: `Opening ${entry.label}`, url: entry.url };
    }
  }
  return null;
}

async function initLiveContext() {
  // Try GPS — if permission was already granted (in-app or via Android Settings)
  // this resolves with a real fix; if not/denied, the error callback fires and
  // we fall through to IP-based location instead.
  if (navigator.geolocation) {
    await new Promise(resolve => {
      navigator.geolocation.getCurrentPosition(async pos => {
        try {
          const lat = pos.coords.latitude, lon = pos.coords.longitude;
          App.liveContext.lat = lat;
          App.liveContext.lon = lon;
          App.liveContext.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          const gr = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
          if (gr.ok) {
            const gd = await gr.json();
            App.liveContext.city    = gd.city || gd.locality || gd.principalSubdivision || '';
            App.liveContext.country = gd.countryName || '';
          }
        } catch(_) {}
        resolve();
      }, () => resolve(),
      { timeout: 6000, maximumAge: 300000 }); // cached fix up to 5min old is fine, otherwise wait up to 6s for a fresh one
    });
  }

  // Fall back to IP-based if GPS didn't give a city (no permission, or it timed out)
  if (!App.liveContext.city) {
    try {
      // ip-api.com's free tier is HTTP-only (403s on HTTPS) and would get
      // mixed-content-blocked from this HTTPS app anyway — ipwho.is is free,
      // keyless, and HTTPS-native.
      const r = await fetch('https://ipwho.is/');
      if (r.ok) {
        const d = await r.json();
        if (d.success !== false && d.city) {
          App.liveContext.city     = d.city;
          App.liveContext.country  = d.country;
          App.liveContext.lat      = d.latitude;
          App.liveContext.lon      = d.longitude;
          App.liveContext.timezone = d.timezone?.id || '';
        }
      }
    } catch(_) {}
  }

  if (!App.liveContext.city) return;

  // Local time
  try {
    const tz = App.liveContext.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    App.liveContext.localTime = new Date().toLocaleTimeString('en-US', { timeZone: tz, hour: '2-digit', minute: '2-digit' });
  } catch(_) {}

  // Weather — validate response is plain text, not HTML
  try {
    const wr = await fetch(`https://wttr.in/${encodeURIComponent(App.liveContext.city)}?format=%c%t`);
    if (wr.ok) {
      const w = (await wr.text()).trim();
      if (w && !w.includes('<') && w.length < 30) App.liveContext.weather = w;
    }
  } catch(_) {}
}

// After deploying worker/index.js, paste your Worker URL here.
// The Worker handles all provider routing — model field is ignored server-side.
const VOID_CORE_API = { url: 'https://void-proxy.mohamadhacothman1.workers.dev', key: '', model: '' };

/* ============ Boot ============ */

document.addEventListener('DOMContentLoaded', () => {
  setupLogin();
});

/* ============ Login System (multi-step) ============ */

function setupLogin() {
  const modal = document.getElementById('login-modal');

  const saved = localStorage.getItem('void_current_user');
  if (saved) {
    App.currentUser = saved;
    if (modal) modal.style.display = 'none';
    bootApp();
    return;
  }

  if (modal) modal.style.display = 'flex';

  let pendingCode = '';
  let pendingEmail = '';

  const emailInput  = document.getElementById('login-email-input');
  const sendBtn     = document.getElementById('login-send-code-btn');
  const step1       = document.getElementById('login-step-1');
  const step2       = document.getElementById('login-step-2');
  const toLabel     = document.getElementById('login-to-label');
  const demoHint    = document.getElementById('login-demo-hint');
  const verifyBtn   = document.getElementById('login-verify-btn');
  const backBtn     = document.getElementById('login-back-btn');
  const error1      = document.getElementById('login-error-1');
  const error2      = document.getElementById('login-error-2');
  const codeDigits  = document.querySelectorAll('.login-code-digit');

  function sendCode() {
    const email = (emailInput?.value || '').trim();
    if (!email || !email.includes('@')) {
      if (error1) error1.textContent = 'Please enter a valid email address.';
      return;
    }
    if (error1) error1.textContent = '';
    pendingEmail = email;
    pendingCode  = String(Math.floor(100000 + Math.random() * 900000));

    if (toLabel) toLabel.textContent = email;
    if (demoHint) demoHint.textContent = `Demo: your code is ${pendingCode}`;

    if (step1) step1.style.display = 'none';
    if (step2) step2.style.display = 'flex';
    codeDigits.forEach(d => { d.value = ''; });
    if (codeDigits[0]) codeDigits[0].focus();
  }

  function verify() {
    const entered = Array.from(codeDigits).map(d => d.value).join('');
    if (entered !== pendingCode) {
      if (error2) error2.textContent = 'Incorrect code — try again.';
      return;
    }
    if (error2) error2.textContent = '';
    App.currentUser = pendingEmail;
    localStorage.setItem('void_current_user', pendingEmail);
    if (modal) modal.style.display = 'none';

    const profileKey = `void_profile_${pendingEmail}`;
    if (!localStorage.getItem(profileKey)) {
      showOnboarding();
    } else {
      bootApp();
    }
  }

  if (sendBtn) sendBtn.addEventListener('click', sendCode);
  if (emailInput) emailInput.addEventListener('keydown', e => {
    if (error1) error1.textContent = '';
    if (e.key === 'Enter') sendCode();
  });
  if (verifyBtn) verifyBtn.addEventListener('click', verify);
  if (backBtn) backBtn.addEventListener('click', () => {
    if (step2) step2.style.display = 'none';
    if (step1) step1.style.display = 'flex';
    if (error2) error2.textContent = '';
  });

  codeDigits.forEach((input, i, all) => {
    input.addEventListener('input', () => {
      input.value = input.value.replace(/\D/g, '').slice(-1);
      if (input.value && i < all.length - 1) all[i + 1].focus();
      if (Array.from(all).every(d => d.value.length === 1)) verify();
    });
    input.addEventListener('keydown', e => {
      if (e.key === 'Backspace' && !input.value && i > 0) all[i - 1].focus();
    });
    input.addEventListener('paste', e => {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 6);
      all.forEach((d, j) => { d.value = text[j] || ''; });
      const next = all[Math.min(text.length, 5)];
      if (next) next.focus();
      if (text.length === 6) verify();
    });
  });
}

/* ============ Onboarding (first-time user) ============ */

function showOnboarding() {
  const modal = document.getElementById('onboard-modal');
  if (modal) modal.style.display = 'flex';

  const steps = [
    document.getElementById('onboard-step-1'),
    document.getElementById('onboard-step-2'),
    document.getElementById('onboard-step-3'),
  ];

  const nameInput     = document.getElementById('onboard-name-input');
  const callsignInput = document.getElementById('onboard-callsign-input');
  const nameNext      = document.getElementById('onboard-name-next');
  const callsignNext  = document.getElementById('onboard-callsign-next');
  const callsignBack  = document.getElementById('onboard-callsign-back');
  const themeBack     = document.getElementById('onboard-theme-back');
  const finishBtn     = document.getElementById('onboard-finish-btn');

  let profile = { name: '', callsign: '', theme: 'frost' };

  function goStep(n) {
    steps.forEach((s, i) => { if (s) s.style.display = i === n ? 'flex' : 'none'; });
  }

  if (nameNext) nameNext.addEventListener('click', () => {
    const name = nameInput?.value.trim();
    if (!name) { nameInput?.focus(); return; }
    profile.name = name;
    if (callsignInput) callsignInput.placeholder = name;
    goStep(1);
    callsignInput?.focus();
  });
  if (nameInput) nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') nameNext?.click(); });

  if (callsignNext) callsignNext.addEventListener('click', () => {
    profile.callsign = callsignInput?.value.trim() || profile.name;
    goStep(2);
  });
  if (callsignBack) callsignBack.addEventListener('click', () => goStep(0));
  if (themeBack) themeBack.addEventListener('click', () => goStep(1));

  document.querySelectorAll('.onboard-theme-opt').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('.onboard-theme-opt').forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      profile.theme = opt.dataset.theme;
    });
  });

  if (finishBtn) finishBtn.addEventListener('click', () => {
    const profileKey = `void_profile_${App.currentUser}`;
    localStorage.setItem(profileKey, JSON.stringify(profile));
    App.settings.theme = profile.theme;
    if (modal) modal.style.display = 'none';
    bootApp();
  });
}

function bootApp() {
  loadSettings();
  applyTheme(App.settings.theme);
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
    if (App.settings.theme === 'auto') applyTheme('auto');
  });
  setupNav();
  setupSettingsPanels();
  setupThemePicker();
  setupChat();
  setupMessageActions();
  setupGameHub();
  setupVoice();
  setupCommandsPanel();
  setupTasksPanel();
  setupPreferencesPanel();
  setupProviderPicker();
  setupPersonaPicker();
  setupImageStylePicker();
  setupPlusMenu();
  setupChatMenu();
  setupSyncPanel();
  setupMemoryPanel();
  setupDocFormatPicker();
  setupDocumentsPanel();
  setupGemsPanel();
  setupGitHubPanel();
  setupGitHubPushSheet();
  setupStudyMode();
  setupNavDrawer();
  setupClonedPanels();
  refreshPlanUI();
  handlePaymentReturn();
  verifyPlanFromServer();
  loadTasks();
  loadCommands();
  loadChats();
  loadMemoryFacts();
  loadBookmarks();
  loadDocuments();
  loadGems();
  loadGitHub();
  updateUserDisplay();
  initLiveContext();
  initQuoteWidget();
  checkForAppUpdate();
  applyPendingShare();
  maybeStartTour();
}

/* ============ First-run feature tour ============ */

const TOUR_STEPS = [
  { sel: '#plus-btn', title: 'Quick actions', body: 'Tap + to attach an image, switch chat modes, go hands-free with Live voice, or change AI providers.' },
  { sel: '#chat-menu-btn', title: 'Chat options', body: 'Share, export, rename, or delete the current chat from here.' },
  { sel: '.tab-pill[data-target="tab-gamehub"]', title: 'Workspace', body: 'MLBB hero guides and Study Mode — with a Pomodoro timer and focus stats — live here.' },
];

function maybeStartTour() {
  if (!App.currentUser) return;
  const key = userKey('tourDone');
  if (localStorage.getItem(key)) return;
  setTimeout(() => startFeatureTour(key), 900);
}

function startFeatureTour(doneKey) {
  let i = 0;
  const scrim = document.createElement('div');
  scrim.className = 'tour-scrim';
  const card = document.createElement('div');
  card.className = 'tour-card';
  document.body.appendChild(scrim);
  document.body.appendChild(card);
  scrim.addEventListener('click', () => finish());

  function finish() {
    scrim.remove(); card.remove();
    try { localStorage.setItem(doneKey, '1'); } catch (_) {}
  }

  function show() {
    const step = TOUR_STEPS[i];
    const el = step && document.querySelector(step.sel);
    if (!step) { finish(); return; }
    if (!el) { i++; show(); return; }
    const r = el.getBoundingClientRect();
    scrim.style.setProperty('--hx', (r.left + r.width / 2) + 'px');
    scrim.style.setProperty('--hy', (r.top + r.height / 2) + 'px');
    scrim.style.setProperty('--hr', (Math.max(r.width, r.height) / 2 + 14) + 'px');
    const below = r.top < window.innerHeight * 0.5;
    card.style.top = below ? (r.bottom + 12) + 'px' : '';
    card.style.bottom = below ? '' : (window.innerHeight - r.top + 12) + 'px';
    card.style.left = Math.max(12, Math.min(window.innerWidth - 244, r.left)) + 'px';
    card.innerHTML = `
      <div class="tour-title">${escapeHTML(step.title)}</div>
      <div class="tour-body">${escapeHTML(step.body)}</div>
      <div class="tour-actions">
        <button class="tour-skip" type="button">Skip</button>
        <span class="tour-progress">${i + 1}/${TOUR_STEPS.length}</span>
        <button class="tour-next" type="button">${i === TOUR_STEPS.length - 1 ? 'Done' : 'Next'}</button>
      </div>`;
    card.querySelector('.tour-skip').addEventListener('click', finish);
    card.querySelector('.tour-next').addEventListener('click', () => { i++; show(); });
  }
  show();
}

// Web (JS/CSS/HTML) changes apply instantly on next launch — no APK needed.
// Native changes (Java, icons, permissions) are baked into the APK and can't
// hot-update; this checks GitHub's auto-published "latest" release so the
// user knows when a fresh APK install is actually needed.
async function checkForAppUpdate() {
  if (!window.Capacitor?.isNativePlatform?.()) return;
  try {
    const r = await fetch('https://api.github.com/repos/mh1435/void-v2/releases/tags/latest');
    if (!r.ok) return;
    const d = await r.json();
    const published = d.published_at;
    const asset = (d.assets || []).find(a => a.name === 'VOID-latest.apk');
    if (!published || !asset) return;
    const seen = localStorage.getItem('void_apk_seen_release');
    if (seen === null) { localStorage.setItem('void_apk_seen_release', published); return; } // fresh install — already current
    if (seen === published) return;
    showUpdateBanner(asset.browser_download_url, published);
  } catch (_) {}
}

function showUpdateBanner(url, published) {
  if (document.getElementById('void-update-banner')) return;
  const bar = document.createElement('div');
  bar.id = 'void-update-banner';
  bar.style.cssText = 'position:fixed;left:10px;right:10px;top:calc(var(--safe-top,0px) + 8px);z-index:9999;'
    + 'background:#16161f;border:1px solid rgba(124,111,255,0.35);border-radius:12px;padding:10px 12px;'
    + 'display:flex;align-items:center;gap:10px;box-shadow:0 8px 24px rgba(0,0,0,0.4);';
  bar.innerHTML = `
    <span style="flex:1;font-size:12.5px;color:#e8e8f0;line-height:1.4;">A new VOID app build is available.</span>
    <button id="void-update-get" style="background:#7c6fff;color:#0d0d10;border:none;border-radius:8px;padding:7px 12px;font-size:12px;font-weight:700;cursor:pointer;">Get it</button>
    <button id="void-update-dismiss" style="background:transparent;border:none;color:#6b6b80;font-size:16px;padding:2px 4px;cursor:pointer;">✕</button>
  `;
  document.body.appendChild(bar);
  document.getElementById('void-update-get').addEventListener('click', () => window.open(url, '_blank'));
  document.getElementById('void-update-dismiss').addEventListener('click', () => {
    localStorage.setItem('void_apk_seen_release', published);
    bar.remove();
  });
}

/* ============ Settings persistence (localStorage) ============ */

function userKey(suffix) {
  return `void_${suffix}_${App.currentUser || 'guest'}`;
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(userKey('settings'));
    if (raw) App.settings = { ...App.settings, ...JSON.parse(raw) };
  } catch(e) {}
}

function saveSettings() {
  try {
    localStorage.setItem(userKey('settings'), JSON.stringify(App.settings));
    return true;
  } catch(e) { return false; }
}

/* ============ Theme ============ */

function resolveThemeForSystem(name) {
  if (name !== 'auto') return name;
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'frost';
}

const LIGHT_THEMES = ['light', 'cream', 'paper', 'softgray'];

function applyTheme(name) {
  App.settings.theme = name;
  const resolved = resolveThemeForSystem(name);
  document.documentElement.setAttribute('data-theme', resolved === 'frost' ? '' : resolved);
  // shared flag so every [data-light] override applies to all light variants
  if (LIGHT_THEMES.includes(resolved)) document.documentElement.setAttribute('data-light', '1');
  else document.documentElement.removeAttribute('data-light');
  document.querySelectorAll('.theme-swatch').forEach(d => {
    d.classList.toggle('active', d.dataset.theme === name);
  });
  applyAccentColor(App.settings.accentColor, App.settings.accentColor2);
}

// Lighten a hex color toward white by `amt` (0-1) — used to derive a matching
// gradient partner for any accent so buttons/toggles never clash with a fixed color.
function lightenHex(hex, amt) {
  const n = hex.replace('#', '');
  const r = parseInt(n.slice(0, 2), 16), g = parseInt(n.slice(2, 4), 16), b = parseInt(n.slice(4, 6), 16);
  const mix = (c) => Math.round(c + (255 - c) * amt);
  return `#${[mix(r), mix(g), mix(b)].map(v => v.toString(16).padStart(2, '0')).join('')}`;
}

function applyAccentColor(hex, hex2) {
  const root = document.documentElement;
  if (!hex) {
    root.style.removeProperty('--accent');
    root.style.removeProperty('--accent-soft');
    root.style.removeProperty('--accent-2');
  } else {
    const n = hex.replace('#', '');
    const r = parseInt(n.slice(0, 2), 16), g = parseInt(n.slice(2, 4), 16), b = parseInt(n.slice(4, 6), 16);
    root.style.setProperty('--accent', hex);
    root.style.setProperty('--accent-soft', `rgba(${r},${g},${b},0.14)`);
    // Every accent gets a matching gradient partner — curated for presets (hex2),
    // auto-derived (lightened) for custom colors — so gradients never clash.
    root.style.setProperty('--accent-2', hex2 || lightenHex(hex, 0.32));
  }
  document.querySelectorAll('.accent-swatch').forEach(s => {
    s.classList.toggle('active', (s.dataset.accent || '') === (hex || ''));
  });
  const customColor = document.getElementById('accent-color-custom');
  if (customColor && hex) customColor.value = hex;
}

function setupThemePicker() {
  document.querySelectorAll('.theme-swatch').forEach(swatch => {
    swatch.addEventListener('click', () => {
      applyTheme(swatch.dataset.theme);
      saveSettings();
    });
  });
}

/* ============ Top-level nav ============ */

function setupNav() {
  document.querySelectorAll('.tab-pill').forEach(pill => {
    pill.addEventListener('click', () => switchTab(pill.dataset.target));
  });

  const openSettingsBtn = document.getElementById('open-settings-btn');
  if (openSettingsBtn) openSettingsBtn.addEventListener('click', openNavDrawer);

  document.getElementById('close-settings-btn').addEventListener('click', () => {
    document.getElementById('view-settings').classList.remove('active');
    document.getElementById('view-main').classList.add('active');
  });

  document.getElementById('hub-detail-back-btn').addEventListener('click', () => {
    switchTab(App.hubDetailReturnTab);
    if (App.hubDetailReturnTab === 'tab-gamehub') {
      showGamingView();
      openMLBBContent();
    }
  });

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', logoutUser);
}

function showWorkspaceLanding() {
  const landing = document.getElementById('workspace-landing');
  const picker = document.getElementById('games-picker-view');
  const mlbb = document.getElementById('mlbb-content-view');
  if (landing) landing.style.display = '';
  if (picker) picker.style.display = 'none';
  if (mlbb) mlbb.style.display = 'none';
}

function showGamingView() {
  const landing = document.getElementById('workspace-landing');
  const picker = document.getElementById('games-picker-view');
  if (landing) landing.style.display = 'none';
  if (picker) picker.style.display = '';
}

function switchTab(targetId) {
  document.querySelectorAll('.view-tab').forEach(t => t.classList.remove('active'));
  document.getElementById(targetId).classList.add('active');

  if (targetId === 'tab-chat' || targetId === 'tab-gamehub') {
    document.querySelectorAll('.tab-pill').forEach(p => {
      p.classList.toggle('active', p.dataset.target === targetId);
    });
  }

  if (targetId === 'tab-gamehub') showWorkspaceLanding();
  updateAppChromeForTab(targetId);
}

function switchTabRaw(targetId) {
  document.querySelectorAll('.view-tab').forEach(t => t.classList.remove('active'));
  document.getElementById(targetId).classList.add('active');
  updateAppChromeForTab(targetId);
}

// Sub-pages (drill-downs) bring their own back+title header, so the top-level
// VOID/INTELLIGENCE/WORKSPACE bar hides for them instead of stacking two headers.
const SUB_PAGE_TABS = ['tab-hub-detail', 'tab-study-grid', 'trivia-view'];
function updateAppChromeForTab(targetId) {
  const chatMenuBtn = document.getElementById('chat-menu-btn');
  const wordmark = document.getElementById('workspace-wordmark');
  const isChat = targetId === 'tab-chat';
  if (chatMenuBtn) {
    // display:none on Workspace so it doesn't reserve phantom width next to
    // the wordmark — that reserved space was crowding VOID into the pill.
    chatMenuBtn.style.display = isChat ? '' : 'none';
    chatMenuBtn.style.pointerEvents = isChat ? '' : 'none';
  }
  // The VOID wordmark fills that same left slot on Workspace (where the
  // chat-options menu doesn't apply) — never both at once.
  if (wordmark) wordmark.style.display = (!isChat && targetId === 'tab-gamehub') ? '' : 'none';
  document.getElementById('chat-menu')?.classList.remove('open');

  const appHeader = document.getElementById('app-hud-header');
  if (appHeader) appHeader.style.display = SUB_PAGE_TABS.includes(targetId) ? 'none' : '';
}

/* ============ Settings panel navigation ============ */

function setupSettingsPanels() {
  document.querySelectorAll('[data-open-panel]').forEach(item => {
    item.addEventListener('click', () => openSettingsPanel(item.dataset.openPanel));
  });

  const haptic = document.getElementById('haptic-toggle');
  if (haptic) {
    haptic.checked = App.settings.haptic !== false;
    haptic.addEventListener('change', () => {
      App.settings.haptic = haptic.checked;
      saveSettings();
      if (haptic.checked && navigator.vibrate) navigator.vibrate(15);
    });
  }

  document.querySelectorAll('.settings-panel').forEach(panel => {
    const closeBtn = panel.querySelector('.panel-close-btn, [data-close-panel]');
    if (closeBtn) closeBtn.addEventListener('click', closeSettingsPanel);
  });

  const saveKeysBtn = document.getElementById('save-keys-btn');
  if (saveKeysBtn) {
    saveKeysBtn.addEventListener('click', () => {
      App.settings.geminiKey = document.getElementById('input-gemini-key').value.trim() || App.settings.geminiKey;
      App.settings.groqKey = document.getElementById('input-groq-key').value.trim() || App.settings.groqKey;
      App.settings.apiKey = document.getElementById('input-api-key').value.trim() || App.settings.apiKey;
      App.settings.togetherKey = document.getElementById('input-together-key').value.trim() || App.settings.togetherKey;
      App.settings.mistralKey = document.getElementById('input-mistral-key').value.trim() || App.settings.mistralKey;
      const ok = saveSettings();
      flashButton(saveKeysBtn, ok ? 'SAVED' : 'FAILED');
      updateModelIndicator();
    });
  }

  const saveModelsBtn = document.getElementById('save-models-btn');
  if (saveModelsBtn) {
    saveModelsBtn.addEventListener('click', () => {
      App.settings.geminiModel = document.getElementById('input-gemini-model').value.trim();
      App.settings.groqModel = document.getElementById('input-groq-model').value.trim();
      App.settings.model = document.getElementById('input-model').value.trim();
      App.settings.togetherModel = document.getElementById('input-together-model').value.trim();
      App.settings.mistralModel = document.getElementById('input-mistral-model').value.trim();
      saveSettings();
      flashButton(saveModelsBtn, 'SAVED');
    });
  }
}

/* ============ VOID Pro — plans, gating, checkout ============ */

const PLAN_RANK = { free: 0, pro: 1, max: 2 };
const FREE_DAILY_LIMIT = 50;
const FREE_STUDY_LIMIT = 5;

function getPlan() { return (App.currentUser && localStorage.getItem(userKey('plan'))) || 'free'; }
function isPro() { return getPlan() !== 'free'; }
function isMax() { return getPlan() === 'max'; }

function setPlan(plan) {
  if (App.currentUser) localStorage.setItem(userKey('plan'), plan);
  refreshPlanUI();
  if (typeof renderStudyGrid === 'function' && document.getElementById('study-loc-grid')) {
    try { renderStudyGrid(STUDY_LOCATIONS); } catch (e) {}
  }
}

function refreshPlanUI() {
  const plan = getPlan();
  document.querySelectorAll('.account-badge').forEach(b => {
    b.textContent = plan.toUpperCase();
    b.classList.toggle('badge-free', plan === 'free');
  });
  hydrateBilling();
}

function hydrateBilling() {
  const plan = getPlan();
  document.querySelectorAll('#panel-billing .plan-card').forEach(card => {
    const p = card.dataset.plan;
    const cur = p === plan;
    card.classList.toggle('current', cur);
    const tag = card.querySelector('.plan-tag'); if (tag) tag.style.display = cur ? '' : 'none';
    const btn = card.querySelector('.plan-action');
    if (btn) {
      btn.disabled = cur;
      btn.textContent = cur ? 'Current plan'
        : (PLAN_RANK[p] > PLAN_RANK[plan] ? 'Upgrade to ' + cap1(p) : 'Switch to ' + cap1(p));
    }
  });
}

// Payments run through the VOID Worker (Stripe for worldwide cards, Xendit for
// TNG/GrabPay/ShopeePay/FPX). Redeem codes (hashed) are the owner override.
const PAY_API = VOID_CORE_API.url;
const PLAN_CODE_HASH = { pro: 2497816122, max: 156928099 };
const MASTER_CODE_HASH = 2584923962;
const PLAN_PRICE = { pro: '$5/mo', max: '$15/mo' };

function djb2(s) { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; return h; }

let pendingPlan = null;
function startCheckout(plan) {
  pendingPlan = plan;
  const modal = document.getElementById('checkout-modal');
  if (!modal) return;
  setEl('checkout-plan', cap1(plan));
  setEl('checkout-price', PLAN_PRICE[plan] || '');
  const codeInput = document.getElementById('checkout-code'); if (codeInput) codeInput.value = '';
  const err = document.getElementById('checkout-error'); if (err) err.style.display = 'none';
  modal.style.display = 'flex';
}
function closeCheckout() { const m = document.getElementById('checkout-modal'); if (m) m.style.display = 'none'; }

// Kick off a real hosted checkout via the Worker, then redirect to the payment page.
async function payWith(method) {
  const err = document.getElementById('checkout-error');
  const show = (msg) => { if (err) { err.textContent = msg; err.style.display = 'block'; } };
  if (!App.currentUser) { show('Sign in first.'); return; }
  show('Opening secure checkout…');
  try {
    const r = await fetch(`${PAY_API}/pay/create`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: App.currentUser, plan: pendingPlan, method }),
    });
    const data = await r.json();
    if (r.ok && data.url) { window.location.href = data.url; return; }
    show(data.error || 'Payments aren’t set up yet — use a code below.');
  } catch (e) {
    show('Network error. Try again or use a code.');
  }
}

// After returning from a hosted payment, confirm the plan with the Worker.
async function verifyPlanFromServer() {
  if (!App.currentUser || !PAY_API) return;
  try {
    const r = await fetch(`${PAY_API}/pay/status?email=${encodeURIComponent(App.currentUser)}`);
    const data = await r.json();
    if (data && data.plan && data.plan !== 'free' && data.plan !== getPlan()) setPlan(data.plan);
  } catch (e) {}
}

function handlePaymentReturn() {
  const params = new URLSearchParams(location.search);
  if (params.get('upgraded')) {
    verifyPlanFromServer();
    history.replaceState({}, '', location.pathname);
  }
}

function tryRedeem() {
  const code = (document.getElementById('checkout-code').value || '').trim().toUpperCase();
  const h = djb2(code);
  const ok = h === MASTER_CODE_HASH || h === PLAN_CODE_HASH[pendingPlan];
  if (ok) {
    setPlan(pendingPlan);
    closeCheckout();
  } else {
    const err = document.getElementById('checkout-error');
    if (err) { err.textContent = 'Invalid code.'; err.style.display = 'block'; }
  }
}

function openBilling() {
  const main = document.getElementById('view-main');
  const settings = document.getElementById('view-settings');
  if (main) main.classList.remove('active');
  if (settings) settings.classList.add('active');
  openSettingsPanel('panel-billing');
}

/* Free daily message gate */
function freeUsageToday() {
  let d = {};
  try { d = JSON.parse(localStorage.getItem(userKey('msgday'))) || {}; } catch (e) {}
  const today = new Date().toDateString();
  if (d.date !== today) d = { date: today, count: 0 };
  return d;
}
function consumeFreeMessage() {
  if (isPro()) return true;
  const d = freeUsageToday();
  if (d.count >= FREE_DAILY_LIMIT) return false;
  d.count++;
  try { localStorage.setItem(userKey('msgday'), JSON.stringify(d)); } catch (e) {}
  return true;
}
function showUpgradePrompt() {
  appendMessage('system', `⚡ You've hit the free limit of ${FREE_DAILY_LIMIT} messages today. Upgrade to Pro for unlimited chats — opening Billing.`);
  setTimeout(openBilling, 400);
}

/* ============ Cloned settings panels (functional) ============ */

const CAP_KEYS = ['voiceEnabled', 'studyMode', 'floatingAssistantEnabled', 'haptic'];

function saveUserProfile(patch) {
  if (!App.currentUser) return;
  const key = `void_profile_${App.currentUser}`;
  let p = {};
  try { p = JSON.parse(localStorage.getItem(key)) || {}; } catch (e) {}
  Object.assign(p, patch);
  try { localStorage.setItem(key, JSON.stringify(p)); } catch (e) {}
}

function hydrateProfilePanel() {
  const prof = getUserProfile() || {};
  const name = prof.name || (App.currentUser ? App.currentUser.split('@')[0] : 'USER');
  setEl('profile-hero-avatar', name.charAt(0).toUpperCase());
  setEl('profile-hero-email', App.currentUser || '');
  const ni = document.getElementById('profile-name-input'); if (ni) ni.value = name;
  const ei = document.getElementById('profile-email-input'); if (ei) ei.value = App.currentUser || '';
}

function renderUsagePanel() {
  const chats = App.chats.length;
  const msgs = App.chats.reduce((n, c) => n + (c.messages ? c.messages.length : 0), 0);
  const studyCount = (typeof STUDY_LOCATIONS !== 'undefined') ? STUDY_LOCATIONS.length : 0;
  let since = localStorage.getItem(userKey('since'));
  if (!since) { since = String(Date.now()); localStorage.setItem(userKey('since'), since); }
  const days = Math.max(1, Math.ceil((Date.now() - Number(since)) / 86400000));
  const grid = document.getElementById('usage-grid');
  if (grid) grid.innerHTML = [
    ['Chats', chats], ['Messages', msgs], ['Locations', studyCount], ['Day' + (days === 1 ? '' : 's'), days],
  ].map(([l, n]) => `<div class="usage-stat"><div class="num">${n}</div><div class="lbl">${l}</div></div>`).join('');
  const cap = 1000, pct = Math.min(100, Math.round((msgs / cap) * 100));
  const fill = document.getElementById('usage-bar-fill'); if (fill) fill.style.width = pct + '%';
  setEl('usage-bar-label', `${msgs} / ${cap} messages used`);
}

function hydrateCapabilities() {
  document.querySelectorAll('.cap-toggle').forEach(t => {
    const k = t.dataset.cap;
    t.checked = (k === 'studyMode') ? (App.settings.studyMode !== false) : (App.settings[k] !== false ? !!App.settings[k] : false);
    if (k === 'voiceEnabled') t.checked = App.settings.voiceEnabled !== false;
    if (k === 'haptic') t.checked = App.settings.haptic !== false;
    if (k === 'studyMode') t.checked = App.settings.studyMode !== false;
    if (k === 'floatingAssistantEnabled') t.checked = !!App.settings.floatingAssistantEnabled;
  });
}

function capCount() {
  return CAP_KEYS.filter(k => k === 'floatingAssistantEnabled' ? !!App.settings[k] : App.settings[k] !== false).length;
}

async function refreshPermissions() {
  const q = async (name) => { try { return (await navigator.permissions.query({ name })).state; } catch (e) { return 'unknown'; } };
  if (navigator.permissions) {
    setEl('perm-mic-status', cap1(await q('microphone')));
    setEl('perm-geo-status', cap1(await q('geolocation')));
  }
  setEl('perm-notif-status', ('Notification' in window) ? cap1(Notification.permission) : 'Unsupported');
}
function cap1(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Unknown'; }

function refreshNotifStatus() {
  const granted = ('Notification' in window) && Notification.permission === 'granted';
  setEl('notif-status', granted ? 'On' : (('Notification' in window) ? cap1(Notification.permission) : 'Unsupported'));
  const btn = document.getElementById('notif-enable-btn'); if (btn) btn.textContent = granted ? 'Enabled' : 'Allow';
  const st = document.getElementById('notif-sound-toggle'); if (st) st.checked = App.settings.notifSound !== false;
}

function syncColorModeSeg() {
  const map = { auto: 'auto', light: 'light', frost: 'frost' };
  const cur = map[App.settings.theme] || '';
  document.querySelectorAll('#colormode-seg .seg-btn').forEach(b => b.classList.toggle('active', b.dataset.theme === cur));
}
function colorModeLabel() {
  return ({ auto: 'System', light: 'Light', frost: 'Dark' })[App.settings.theme] || 'Custom';
}

function applyFontSize(size) {
  if (size && size !== 'default') document.documentElement.setAttribute('data-size', size);
  else document.documentElement.removeAttribute('data-size');
}
function syncFontSizeSeg() {
  const cur = App.settings.fontSize || 'default';
  document.querySelectorAll('#fontsize-seg .seg-btn').forEach(b => b.classList.toggle('active', b.dataset.size === cur));
}

/* Update the value subtitles shown on the settings menu rows */
function refreshSettingsSubvalues() {
  document.querySelectorAll('.menu-item[data-open-panel="panel-capabilities"] .sub').forEach(s => s.textContent = capCount() + ' enabled');
  document.querySelectorAll('.menu-item[data-open-panel="panel-colormode"] .sub').forEach(s => s.textContent = colorModeLabel());
}

function setEl(id, txt) { const el = document.getElementById(id); if (el) el.textContent = txt; }

function setupClonedPanels() {
  applyFontSize(App.settings.fontSize);
  refreshSettingsSubvalues();

  // Profile save
  const saveProf = document.getElementById('profile-save-btn');
  if (saveProf) saveProf.addEventListener('click', () => {
    const name = (document.getElementById('profile-name-input').value || '').trim();
    if (name) { saveUserProfile({ name }); updateUserDisplay(); hydrateProfilePanel(); }
    flashButton(saveProf, 'Saved');
  });

  // Billing — real plan changes
  document.querySelectorAll('#panel-billing .plan-action').forEach(b => b.addEventListener('click', () => {
    const target = b.dataset.plan;
    if (target === getPlan()) return;
    if (target === 'free') { setPlan('free'); flashButton(b, 'Switched to Free'); return; }
    startCheckout(target);
  }));
  // Checkout modal
  const coClose = document.getElementById('checkout-close'); if (coClose) coClose.addEventListener('click', closeCheckout);
  const coScrim = document.getElementById('checkout-scrim'); if (coScrim) coScrim.addEventListener('click', closeCheckout);
  const coRedeem = document.getElementById('checkout-redeem-btn'); if (coRedeem) coRedeem.addEventListener('click', tryRedeem);
  const coCard = document.getElementById('checkout-card-btn'); if (coCard) coCard.addEventListener('click', () => payWith('card'));
  const coWallet = document.getElementById('checkout-ewallet-btn'); if (coWallet) coWallet.addEventListener('click', () => payWith('ewallet'));

  // Capabilities toggles
  document.querySelectorAll('.cap-toggle').forEach(t => t.addEventListener('change', () => {
    const k = t.dataset.cap;
    App.settings[k] = t.checked;
    saveSettings();
    refreshSettingsSubvalues();
    // keep the voice panel toggle and floating button in sync where relevant
    if (k === 'voiceEnabled') { const v = document.getElementById('toggle-voice-enabled'); if (v) v.checked = t.checked; }
  }));

  // Permissions
  const micBtn = document.getElementById('perm-mic-btn');
  if (micBtn) micBtn.addEventListener('click', async () => {
    try { const s = await navigator.mediaDevices.getUserMedia({ audio: true }); s.getTracks().forEach(x => x.stop()); } catch (e) {}
    refreshPermissions();
  });
  const geoBtn = document.getElementById('perm-geo-btn');
  if (geoBtn) geoBtn.addEventListener('click', () => {
    navigator.geolocation && navigator.geolocation.getCurrentPosition(() => refreshPermissions(), () => refreshPermissions());
  });
  const notifPermBtn = document.getElementById('perm-notif-btn');
  if (notifPermBtn) notifPermBtn.addEventListener('click', async () => {
    if ('Notification' in window) { try { await Notification.requestPermission(); } catch (e) {} }
    refreshPermissions();
  });

  // Color mode segmented
  document.querySelectorAll('#colormode-seg .seg-btn').forEach(b => b.addEventListener('click', () => {
    applyTheme(b.dataset.theme); saveSettings(); syncColorModeSeg(); refreshSettingsSubvalues();
  }));

  // Font size segmented
  document.querySelectorAll('#fontsize-seg .seg-btn').forEach(b => b.addEventListener('click', () => {
    App.settings.fontSize = b.dataset.size; saveSettings(); applyFontSize(b.dataset.size); syncFontSizeSeg(); refreshSettingsSubvalues();
  }));

  // Notifications
  const notifEnable = document.getElementById('notif-enable-btn');
  if (notifEnable) notifEnable.addEventListener('click', async () => {
    if ('Notification' in window) { try { await Notification.requestPermission(); } catch (e) {} }
    refreshNotifStatus();
  });
  const notifSound = document.getElementById('notif-sound-toggle');
  if (notifSound) notifSound.addEventListener('change', () => { App.settings.notifSound = notifSound.checked; saveSettings(); });
}

function openSettingsPanel(panelId) {
  document.querySelectorAll('.settings-panel').forEach(p => p.classList.remove('active'));
  const panel = document.getElementById(panelId);
  if (panel) panel.classList.add('active');

  if (panelId === 'panel-keys') {
    setVal('input-gemini-key', App.settings.geminiKey);
    setVal('input-groq-key', App.settings.groqKey);
    setVal('input-api-key', App.settings.apiKey);
    setVal('input-together-key', App.settings.togetherKey);
    setVal('input-mistral-key', App.settings.mistralKey);
  } else if (panelId === 'panel-models') {
    setVal('input-gemini-model', App.settings.geminiModel);
    setVal('input-groq-model', App.settings.groqModel);
    setVal('input-model', App.settings.model);
    setVal('input-together-model', App.settings.togetherModel);
    setVal('input-mistral-model', App.settings.mistralModel);
  } else if (panelId === 'panel-memory') {
    renderMemoryInfo();
    renderMemoryFacts();
  } else if (panelId === 'panel-saved') {
    renderBookmarks();
  } else if (panelId === 'panel-documents') {
    renderDocumentsList();
  } else if (panelId === 'panel-gems') {
    renderGemsList();
  } else if (panelId === 'panel-github') {
    renderGitHubState();
    if (App.githubToken && !App.githubUser) ghVerify().catch(() => {});
  } else if (panelId === 'panel-billing') {
    hydrateBilling();
  } else if (panelId === 'panel-profile') {
    hydrateProfilePanel();
  } else if (panelId === 'panel-usage') {
    renderUsagePanel();
  } else if (panelId === 'panel-capabilities') {
    hydrateCapabilities();
  } else if (panelId === 'panel-permissions') {
    refreshPermissions();
  } else if (panelId === 'panel-colormode') {
    syncColorModeSeg();
    applyAccentColor(App.settings.accentColor, App.settings.accentColor2);
    syncFontSizeSeg();
  } else if (panelId === 'panel-notifications') {
    refreshNotifStatus();
  } else if (panelId === 'panel-sync') {
    showSyncCode();
    const st = document.getElementById('sync-status');
    if (st) st.textContent = '';
  }
}

function closeSettingsPanel() {
  document.querySelectorAll('.settings-panel').forEach(p => p.classList.remove('active'));
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el && val !== undefined && val !== '') el.value = val;
}

function flashButton(btn, text) {
  const original = btn.textContent;
  btn.textContent = text;
  setTimeout(() => { btn.textContent = original; }, 1400);
}

/* ============ Preferences panel ============ */

function setupPreferencesPanel() {
  const mapSel = document.getElementById('select-map-provider');
  const modeSel = document.getElementById('select-response-mode');
  const langSel = document.getElementById('select-lang');
  const motionToggle = document.getElementById('toggle-reduced-motion');
  const gpsBtn = document.getElementById('btn-request-gps');

  if (mapSel) {
    mapSel.value = App.settings.mapProvider;
    mapSel.addEventListener('change', () => { App.settings.mapProvider = mapSel.value; saveSettings(); });
  }
  if (modeSel) {
    modeSel.value = App.settings.responseMode;
    modeSel.addEventListener('change', () => { App.settings.responseMode = modeSel.value; saveSettings(); });
  }
  if (langSel) {
    langSel.value = App.settings.lang;
    langSel.addEventListener('change', () => { App.settings.lang = langSel.value; saveSettings(); });
  }
  document.querySelectorAll('.accent-swatch').forEach(sw => {
    sw.addEventListener('click', () => {
      App.settings.accentColor = sw.dataset.accent || '';
      App.settings.accentColor2 = sw.dataset.accent2 || '';
      applyAccentColor(App.settings.accentColor, App.settings.accentColor2);
      saveSettings();
    });
  });
  const customColor = document.getElementById('accent-color-custom');
  if (customColor) {
    customColor.addEventListener('input', () => {
      App.settings.accentColor = customColor.value;
      App.settings.accentColor2 = ''; // auto-derived from the picked color
      applyAccentColor(App.settings.accentColor);
      saveSettings();
    });
  }
  if (motionToggle) {
    motionToggle.checked = !!App.settings.reducedMotion;
    motionToggle.addEventListener('change', () => {
      App.settings.reducedMotion = motionToggle.checked;
      document.body.classList.toggle('reduced-motion', motionToggle.checked);
      saveSettings();
    });
  }
  if (gpsBtn) {
    gpsBtn.addEventListener('click', () => {
      const statusLine = document.getElementById('gps-status-line');
      if (!navigator.geolocation) {
        if (statusLine) statusLine.textContent = 'GPS::UNSUPPORTED';
        return;
      }
      if (statusLine) statusLine.textContent = 'GPS::ACQUIRING...';
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          App.location = { lat: pos.coords.latitude, lon: pos.coords.longitude };
          if (statusLine) statusLine.textContent = 'GPS::LOCKED';
        },
        () => { if (statusLine) statusLine.textContent = 'GPS::DENIED'; }
      );
    });
  }

  const floatToggle = document.getElementById('toggle-floating-assistant');
  if (floatToggle) {
    floatToggle.checked = !!App.settings.floatingAssistantEnabled;
    floatToggle.addEventListener('change', () => {
      App.settings.floatingAssistantEnabled = floatToggle.checked;
      saveSettings();
      setFloatingAssistant(floatToggle.checked);
    });
  }

  // Also sync the Modules panel toggle
  const capFloatToggle = document.querySelector('.cap-toggle[data-cap="floatingAssistantEnabled"]');
  if (capFloatToggle) {
    capFloatToggle.addEventListener('change', () => {
      setFloatingAssistant(capFloatToggle.checked);
    });
  }

  // Web VoidFloat while VOID is open, native overlay (same VOID theme + pulse) while backgrounded
  if (window.Capacitor?.isNativePlatform?.()) {
    try { Capacitor.Plugins.FloatingPlugin?.stopFloating(); } catch (_) {}
    document.addEventListener('visibilitychange', () => {
      if (!App.settings.floatingAssistantEnabled) return;
      const fp = Capacitor.Plugins.FloatingPlugin;
      if (!fp) return;
      if (document.hidden) {
        VoidFloat.hide();
        try { fp.startFloating(); } catch (_) {}
      } else {
        try { fp.stopFloating(); } catch (_) {}
        VoidFloat.show();
      }
    });
  }

  // Show on boot if previously enabled
  if (App.settings.floatingAssistantEnabled) setFloatingAssistant(true);
}

/* ============ Voice ============ */

function setupVoice() {
  const enabledToggle = document.getElementById('toggle-voice-enabled');
  const rateRange = document.getElementById('voice-rate-range');
  const pitchRange = document.getElementById('voice-pitch-range');
  const rateValue = document.getElementById('voice-rate-value');
  const pitchValue = document.getElementById('voice-pitch-value');
  const nameSelect = document.getElementById('voice-name-select');
  const testBtn = document.getElementById('voice-test-btn');

  const wakeToggle = document.getElementById('toggle-wake-word');
  if (wakeToggle) {
    wakeToggle.checked = !!App.settings.wakeWord;
    wakeToggle.addEventListener('change', () => {
      App.settings.wakeWord = wakeToggle.checked;
      saveSettings();
      if (wakeToggle.checked) {
        appendMessage?.('system', '👂 Wake word on — say "Okay VOID" anytime to start talking.');
        App.startWakeListening?.();
      } else {
        App.stopWakeListening?.();
      }
    });
  }

  if (enabledToggle) {
    enabledToggle.checked = !!App.settings.voiceEnabled;
    enabledToggle.addEventListener('change', () => {
      App.settings.voiceEnabled = enabledToggle.checked;
      saveSettings();
    });
  }
  if (rateRange) {
    rateRange.value = App.settings.voiceRate;
    if (rateValue) rateValue.textContent = App.settings.voiceRate.toFixed(1) + 'x';
    rateRange.addEventListener('input', () => {
      App.settings.voiceRate = parseFloat(rateRange.value);
      if (rateValue) rateValue.textContent = App.settings.voiceRate.toFixed(1) + 'x';
    });
    rateRange.addEventListener('change', saveSettings);
  }
  if (pitchRange) {
    pitchRange.value = App.settings.voicePitch;
    if (pitchValue) pitchValue.textContent = App.settings.voicePitch.toFixed(1);
    pitchRange.addEventListener('input', () => {
      App.settings.voicePitch = parseFloat(pitchRange.value);
      if (pitchValue) pitchValue.textContent = App.settings.voicePitch.toFixed(1);
    });
    pitchRange.addEventListener('change', saveSettings);
  }

  function populateVoices() {
    if (!nameSelect || !window.speechSynthesis) return;
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return;
    nameSelect.innerHTML = voices.map(v => `<option value="${v.name}">${v.name}</option>`).join('');
    if (App.settings.voiceName) nameSelect.value = App.settings.voiceName;
  }
  if (window.speechSynthesis) {
    populateVoices();
    window.speechSynthesis.addEventListener('voiceschanged', populateVoices);
  }
  // Attached once (not inside populateVoices, which can re-run several times
  // as voices load in) so picking a voice never double-fires.
  if (nameSelect) {
    nameSelect.addEventListener('change', () => {
      App.settings.voiceName = nameSelect.value;
      saveSettings();
      speak('This is what I sound like.'); // instant preview of the picked voice
    });
  }

  // Speed presets — Slow/Normal/Fast, kept in sync with the slider both ways
  const speedPresets = document.getElementById('voice-speed-presets');
  function syncSpeedPresets() {
    if (!speedPresets) return;
    speedPresets.querySelectorAll('.seg-btn').forEach(b =>
      b.classList.toggle('active', Math.abs(parseFloat(b.dataset.rate) - App.settings.voiceRate) < 0.05));
  }
  if (speedPresets) {
    speedPresets.querySelectorAll('.seg-btn').forEach(b => {
      b.addEventListener('click', () => {
        App.settings.voiceRate = parseFloat(b.dataset.rate);
        if (rateRange) rateRange.value = App.settings.voiceRate;
        if (rateValue) rateValue.textContent = App.settings.voiceRate.toFixed(1) + 'x';
        syncSpeedPresets();
        saveSettings();
      });
    });
    syncSpeedPresets();
  }
  if (rateRange) rateRange.addEventListener('input', syncSpeedPresets);

  if (testBtn) {
    testBtn.addEventListener('click', () => speak('Void core voice configuration confirmed.'));
  }

  // Voice engine: Device (browser/OS voices, offline) vs Realistic (neural voices, online)
  const engineSeg = document.getElementById('voice-engine-seg');
  const realisticPicker = document.getElementById('realistic-voice-picker');
  const nameRow = document.getElementById('voice-name-row');
  function syncEngineUI() {
    const realistic = App.settings.voiceEngine === 'realistic';
    if (engineSeg) engineSeg.querySelectorAll('.seg-btn').forEach(b => b.classList.toggle('active', b.dataset.engine === App.settings.voiceEngine));
    if (realisticPicker) realisticPicker.style.display = realistic ? '' : 'none';
    if (nameRow) nameRow.style.display = realistic ? 'none' : '';
  }
  if (engineSeg) {
    engineSeg.querySelectorAll('.seg-btn').forEach(b => {
      b.addEventListener('click', () => {
        App.settings.voiceEngine = b.dataset.engine;
        syncEngineUI();
        saveSettings();
      });
    });
  }
  syncEngineUI();

  // Realistic voice chips, grouped Girls/Boys — tap to pick + instantly preview
  const voiceChips = document.querySelectorAll('.voice-chip');
  function syncVoiceChips() {
    voiceChips.forEach(c => c.classList.toggle('active', c.dataset.voice === App.settings.realisticVoice));
  }
  voiceChips.forEach(c => {
    c.addEventListener('click', () => {
      App.settings.realisticVoice = c.dataset.voice;
      syncVoiceChips();
      saveSettings();
      speak('Hey, this is what I sound like.');
    });
  });
  syncVoiceChips();
}

let realisticAudioEl = null;
let realisticGen = 0;
function stopSpeaking() {
  try { window.speechSynthesis?.cancel(); } catch (_) {}
  realisticGen++; // invalidates any in-flight speakRealistic chunk loop
  if (realisticAudioEl) { try { realisticAudioEl.pause(); } catch (_) {} realisticAudioEl = null; }
}

function speak(text) {
  if (!App.settings.voiceEnabled) return;
  stopSpeaking();
  if (App.settings.voiceEngine === 'realistic') { speakRealistic(text); return; }
  if (!window.speechSynthesis) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = App.settings.voiceRate;
  utter.pitch = App.settings.voicePitch;
  if (App.settings.voiceName) {
    const voice = window.speechSynthesis.getVoices().find(v => v.name === App.settings.voiceName);
    if (voice) utter.voice = voice;
  }
  // Live voice mode: once VOID finishes talking, hand the mic back to the user
  utter.onend = () => { if (App.voiceConvo) setTimeout(() => App.startListening?.(), 300); };
  window.speechSynthesis.speak(utter);
}

// Groq's Orpheus TTS caps input at 200 chars, so a full reply is split on
// sentence boundaries into speakable chunks and played back-to-back.
function splitForTTS(text, maxLen = 190) {
  const sentences = text.replace(/\s+/g, ' ').trim().match(/[^.!?]+[.!?]*\s*/g) || [text];
  const chunks = [];
  let cur = '';
  for (const s of sentences) {
    if ((cur + s).length > maxLen) {
      if (cur) chunks.push(cur.trim());
      cur = s.length > maxLen ? s.slice(0, maxLen) : s;
    } else {
      cur += s;
    }
  }
  if (cur.trim()) chunks.push(cur.trim());
  return chunks.slice(0, 12); // cap so a very long reply can't spam dozens of requests
}

async function speakRealistic(text) {
  const myGen = realisticGen; // stopSpeaking() already bumped this before we were called
  const voice = App.settings.realisticVoice || 'autumn';
  const chunks = splitForTTS(text);
  try {
    for (const chunk of chunks) {
      if (myGen !== realisticGen) return; // superseded by a newer speak()/stop
      const res = await fetch(`${VOID_CORE_API.url}/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: chunk, voice }),
      });
      if (!res.ok) throw new Error('tts failed');
      const blob = await res.blob();
      if (myGen !== realisticGen) return;
      await new Promise((resolve, reject) => {
        const audio = new Audio(URL.createObjectURL(blob));
        audio.playbackRate = App.settings.voiceRate || 1.0;
        realisticAudioEl = audio;
        audio.onended = resolve;
        audio.onerror = () => reject(new Error('playback failed'));
        audio.play().catch(reject);
      });
    }
    if (myGen === realisticGen && App.voiceConvo) setTimeout(() => App.startListening?.(), 300);
  } catch (_) {
    if (myGen !== realisticGen) return; // interrupted on purpose — don't fall back
    // offline, worker not yet redeployed, or blocked — fall back to the device voice
    // so speech never just goes silent
    if (window.speechSynthesis) {
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = App.settings.voiceRate;
      window.speechSynthesis.speak(utter);
    }
  }
}

/* ============ Chat ============ */

function setupChat() {
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('send-msg-btn');

  // The browser Web Speech API (webkitSpeechRecognition) only works in standalone
  // Chrome — it's not available inside an Android WebView, which is how this app
  // runs once packaged as an APK. So the native app uses a real Capacitor plugin
  // instead; the web/PWA build keeps using the Web Speech API as before.
  const NativeSTT = window.Capacitor?.isNativePlatform?.() ? window.Capacitor?.Plugins?.SpeechRecognition : null;
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognizer = null;
  let listening = false;
  let nativeSTTPermGranted = false;

  function handleHeardText(text) {
    if (!text) return;
    if (App.voiceConvo) {
      // Live voice mode: send what was heard immediately, hands-free
      input.value = text;
      input.dispatchEvent(new Event('input'));
      sendMessage();
      return;
    }
    input.value = (input.value ? input.value + ' ' : '') + text;
    input.dispatchEvent(new Event('input'));
    App.voiceTriggered = true;
  }

  async function startNativeListening() {
    if (listening) return;
    App.stopWakeListening?.();
    try {
      if (!nativeSTTPermGranted) {
        const perm = await NativeSTT.requestPermissions();
        nativeSTTPermGranted = perm.speechRecognition === 'granted' || perm.speechRecognition === 'limited';
        if (!nativeSTTPermGranted) {
          appendMessage('system', "🎙 Microphone access is off for VOID — enable it in your phone's Settings → Apps → VOID → Permissions to use voice input.");
          return;
        }
      }
      listening = true;
      sendBtn.classList.add('mic-active');
      const result = await NativeSTT.start({ language: getSTTLang(), maxResults: 1, partialResults: false, popup: false });
      listening = false;
      sendBtn.classList.remove('mic-active');
      updateSendMicBtn();
      handleHeardText(result?.matches?.[0]);
      if (App.settings.wakeWord && !App.voiceConvo) setTimeout(() => App.startWakeListening?.(), 600);
    } catch (_) {
      listening = false;
      sendBtn.classList.remove('mic-active');
      updateSendMicBtn();
      if (App.settings.wakeWord && !App.voiceConvo) setTimeout(() => App.startWakeListening?.(), 600);
    }
  }

  if (!NativeSTT && SpeechRecognition) {
    recognizer = new SpeechRecognition();
    recognizer.continuous = false;
    recognizer.interimResults = false;
    recognizer.lang = getSTTLang();
    recognizer.addEventListener('result', (e) => handleHeardText(e.results[0][0].transcript));
    recognizer.addEventListener('end', () => {
      listening = false;
      sendBtn.classList.remove('mic-active');
      updateSendMicBtn();
      if (App.settings.wakeWord && !App.voiceConvo) setTimeout(() => App.startWakeListening?.(), 500);
    });
    recognizer.addEventListener('error', () => {
      listening = false;
      sendBtn.classList.remove('mic-active');
    });
  }

  // Welcome suggestion chips → send that prompt directly
  const box = document.getElementById('messages-box');
  if (box) {
    box.addEventListener('click', (e) => {
      const chip = e.target.closest('.welcome-chip');
      if (!chip) return;
      input.value = chip.dataset.chip || chip.textContent;
      input.dispatchEvent(new Event('input'));
      sendMessage();
    });

    // Scroll-to-bottom button — appears once you've scrolled up a bit
    const scrollBtn = document.getElementById('scroll-bottom-btn');
    if (scrollBtn) {
      box.addEventListener('scroll', () => {
        const away = box.scrollHeight - box.scrollTop - box.clientHeight;
        scrollBtn.classList.toggle('show', away > 250);
      });
      scrollBtn.addEventListener('click', () => {
        const away = box.scrollHeight - box.scrollTop - box.clientHeight;
        // Smooth for short hops; instant when far away so it never crawls
        box.scrollTo({ top: box.scrollHeight, behavior: away > box.clientHeight * 3 ? 'auto' : 'smooth' });
      });
    }

    // Copy button on code blocks (delegated — blocks are added dynamically)
    box.addEventListener('click', (e) => {
      const btn = e.target.closest('.code-copy');
      if (!btn) return;
      const pre = btn.closest('pre');
      if (!pre) return;
      navigator.clipboard?.writeText(pre.querySelector('code')?.textContent || '').catch(() => {});
      btn.textContent = 'Copied ✓';
      setTimeout(() => { btn.textContent = 'Copy'; }, 1400);
    });
  }

  // Shared entry point so speak()/generateAssistantReply can hand the mic back
  App.startListening = () => {
    if (NativeSTT) { startNativeListening(); return; }
    if (!recognizer || listening) return;
    App.stopWakeListening?.();
    try {
      recognizer.lang = getSTTLang();
      recognizer.start();
      listening = true;
      sendBtn.classList.add('mic-active');
    } catch (_) {}
  };

  // Live voice conversation toggle
  const convoBtn = document.getElementById('voice-convo-btn');
  if (convoBtn) {
    convoBtn.addEventListener('click', () => {
      App.voiceConvo = !App.voiceConvo;
      convoBtn.classList.toggle('active', App.voiceConvo);
      document.getElementById('plus-btn')?.classList.toggle('active', App.voiceConvo);
      if (App.voiceConvo) {
        App.stopWakeListening?.();
        appendMessage('system', '🎙 Live voice mode on — just talk. VOID answers out loud and listens again. Tap LIVE to stop.');
        App.startListening();
      } else {
        try { NativeSTT ? NativeSTT.stop() : recognizer?.stop(); } catch (_) {}
        stopSpeaking();
        // Resume passive wake listening once the live conversation ends
        setTimeout(() => App.startWakeListening?.(), 600);
      }
    });
  }

  /* ===== Wake word: "Okay VOID" (like "Okay Google") ===== */
  // A passive, always-on listener. When it hears "okay/hey void", it drops
  // into hands-free Live voice mode — sending anything said in the same breath.
  const WAKE_RE = /\b(?:ok(?:ay)?|hey|hi|yo)\s+void\b[\s,.:;!?-]*(.*)$/i;
  let wakeRecognizer = null, wakeActive = false, wakeCooldown = false, nativeWakeStop = false;

  function activateFromWake(rest) {
    if (wakeCooldown) return;
    wakeCooldown = true; setTimeout(() => { wakeCooldown = false; }, 2500);
    App.stopWakeListening();
    buzz(60);
    if (!App.voiceConvo) {
      App.voiceConvo = true;
      convoBtn?.classList.add('active');
      document.getElementById('plus-btn')?.classList.add('active');
    }
    const cmd = (rest || '').trim().replace(/[.?!]+$/, '').trim();
    if (cmd.length >= 2) {
      input.value = cmd; input.dispatchEvent(new Event('input'));
      sendMessage(); // live mode resumes listening after the reply
    } else {
      appendMessage('system', '🎙 Yes? I\'m listening… (Live voice on — tap LIVE to stop)');
      App.startListening();
    }
  }

  async function startNativeWakeLoop() {
    if (wakeActive) return;
    nativeWakeStop = false; wakeActive = true;
    try {
      const perm = await NativeSTT.requestPermissions();
      if (!(perm.speechRecognition === 'granted' || perm.speechRecognition === 'limited')) { wakeActive = false; return; }
    } catch (_) { wakeActive = false; return; }
    while (App.settings.wakeWord && !nativeWakeStop && !App.voiceConvo && !listening) {
      try {
        const result = await NativeSTT.start({ language: getSTTLang(), maxResults: 4, partialResults: false, popup: false });
        const hit = (result?.matches || []).map(String).find(t => WAKE_RE.test(t));
        if (hit) { activateFromWake(hit.match(WAKE_RE)[1]); break; }
      } catch (_) { await new Promise(r => setTimeout(r, 700)); }
    }
    wakeActive = false;
  }

  App.startWakeListening = () => {
    if (!App.settings.wakeWord || wakeActive || App.voiceConvo || listening) return;
    if (NativeSTT) { startNativeWakeLoop(); return; }
    if (!SpeechRecognition) return;
    wakeActive = true;
    wakeRecognizer = new SpeechRecognition();
    wakeRecognizer.continuous = true;
    wakeRecognizer.interimResults = true;
    wakeRecognizer.lang = getSTTLang();
    wakeRecognizer.addEventListener('result', (e) => {
      const txt = Array.from(e.results).slice(-4).map(r => r[0].transcript).join(' ');
      const m = txt.match(WAKE_RE);
      if (m) activateFromWake(m[1]);
    });
    wakeRecognizer.addEventListener('error', () => {});
    wakeRecognizer.addEventListener('end', () => {
      wakeActive = false;
      if (App.settings.wakeWord && !App.voiceConvo && !listening) setTimeout(() => App.startWakeListening(), 500);
    });
    try { wakeRecognizer.start(); } catch (_) { wakeActive = false; }
  };

  App.stopWakeListening = () => {
    nativeWakeStop = true;
    if (wakeRecognizer) { try { wakeRecognizer.onend = null; wakeRecognizer.stop(); } catch (_) {} wakeRecognizer = null; }
    wakeActive = false;
  };

  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = input.scrollHeight + 'px';
    updateSendMicBtn();
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.value.trim()) sendMessage();
    }
  });

  sendBtn.addEventListener('click', () => {
    if (sendBtn.dataset.mode === 'stop') {
      // Abort the in-flight reply; any text already streamed in is kept.
      try { App.currentAbort?.abort(); } catch (_) {}
      return;
    }
    if (sendBtn.dataset.mode === 'send') {
      sendMessage();
      return;
    }
    if (NativeSTT) {
      if (listening) { NativeSTT.stop().catch(() => {}); return; }
      startNativeListening();
      return;
    }
    if (!recognizer) return;
    if (listening) {
      recognizer.stop();
      return;
    }
    try {
      recognizer.start();
      listening = true;
      sendBtn.classList.add('mic-active');
    } catch(e) {}
  });

  // Image attach — downscaled client-side so vision requests stay small
  const attachBtn = document.getElementById('attach-btn');
  const attachInput = document.getElementById('attach-input');
  const preview = document.getElementById('attach-preview');
  const previewImg = document.getElementById('attach-preview-img');
  if (attachBtn && attachInput) {
    attachBtn.addEventListener('click', () => attachInput.click());
    attachInput.addEventListener('change', () => {
      const file = attachInput.files?.[0];
      attachInput.value = '';
      if (!file) return;
      const img = new Image();
      img.onload = () => {
        const MAX = 1024;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        App.pendingImage = canvas.toDataURL('image/jpeg', 0.85);
        URL.revokeObjectURL(img.src);
        if (previewImg) previewImg.src = App.pendingImage;
        if (preview) preview.style.display = '';
        attachBtn.classList.add('active');
      };
      img.src = URL.createObjectURL(file);
    });
    document.getElementById('attach-remove-btn')?.addEventListener('click', clearPendingImage);
  }

  updateSendMicBtn();
  updateModelIndicator();

  // Begin passive "Okay VOID" wake listening if the user has it enabled.
  if (App.settings.wakeWord) setTimeout(() => App.startWakeListening?.(), 1500);
}

function clearPendingImage() {
  App.pendingImage = null;
  const preview = document.getElementById('attach-preview');
  if (preview) preview.style.display = 'none';
  document.getElementById('attach-btn')?.classList.remove('active');
}

function updateSendMicBtn() {
  const input = document.getElementById('chat-input');
  const btn = document.getElementById('send-msg-btn');
  if (!btn || !input) return;
  const micIcon = btn.querySelector('.btn-icon-mic');
  const sendIcon = btn.querySelector('.btn-icon-send');
  const stopIcon = btn.querySelector('.btn-icon-stop');
  if (App.generating) {
    if (micIcon) micIcon.style.display = 'none';
    if (sendIcon) sendIcon.style.display = 'none';
    if (stopIcon) stopIcon.style.display = '';
    btn.dataset.mode = 'stop';
    return;
  }
  if (stopIcon) stopIcon.style.display = 'none';
  const hasText = input.value.trim().length > 0;
  if (hasText) {
    if (micIcon) micIcon.style.display = 'none';
    if (sendIcon) sendIcon.style.display = '';
    btn.dataset.mode = 'send';
  } else {
    if (micIcon) micIcon.style.display = '';
    if (sendIcon) sendIcon.style.display = 'none';
    btn.dataset.mode = 'mic';
  }
}

function updateModelIndicator() {
  const indicator = document.getElementById('active-model-indicator');
  if (!indicator) return;
  if (VOID_CORE_API.url) { indicator.textContent = 'VOID CORE'; return; }
  const order = App.settings.providerOrder || ['gemini', 'groq', 'openrouter'];
  const labels = {
    gemini: 'GEMINI', groq: 'GROQ', openrouter: 'OPENROUTER',
    together: 'TOGETHER', mistral: 'MISTRAL', pollinations: 'FREE AI'
  };
  const firstConfigured = [...order, 'pollinations'].find(p => {
    if (p === 'gemini') return !!App.settings.geminiKey;
    if (p === 'groq') return !!App.settings.groqKey;
    if (p === 'openrouter') return !!App.settings.apiKey;
    if (p === 'together') return !!App.settings.togetherKey;
    if (p === 'mistral') return !!App.settings.mistralKey;
    if (p === 'pollinations') return true;
    return false;
  });
  indicator.textContent = labels[firstConfigured] || 'FREE AI';
}

/* ============ AI Provider Calls ============ */

async function callGemini(messages) {
  const key = App.settings.geminiKey;
  const model = App.settings.geminiModel || 'gemini-2.5-flash';
  const system = messages.find(m => m.role === 'system');
  const contents = messages.filter(m => m.role !== 'system').map(m => {
    // Content-part arrays (vision) → Gemini's native text + inlineData parts
    const parts = Array.isArray(m.content)
      ? m.content.map(p => p.type === 'image_url'
          ? { inlineData: { mimeType: 'image/jpeg', data: (p.image_url?.url || '').split(',')[1] || '' } }
          : { text: p.text || '' })
      : [{ text: m.content }];
    return { role: m.role === 'assistant' ? 'model' : 'user', parts };
  });
  const body = { contents };
  if (system) body.systemInstruction = { parts: [{ text: system.content }] };
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gemini ${res.status}`);
  }
  const data = await res.json();
  return data.candidates[0].content.parts[0].text;
}

async function callOpenAICompat(url, key, model, messages) {
  const headers = { 'Content-Type': 'application/json' };
  if (key) headers['Authorization'] = `Bearer ${key}`;
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ model, messages, max_tokens: 1024 })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `${res.status}`);
  }
  const data = await res.json();
  return data.choices[0].message.content;
}

// True token-by-token streaming (real ChatGPT/Claude-style live text) via
// standard OpenAI-compatible SSE — onChunk(fullTextSoFar) fires as each
// piece arrives. If the connection drops mid-stream, whatever text already
// arrived is returned as the (truncated) reply instead of being thrown away,
// so the caller never abandons a bubble the user has already started reading.
async function callOpenAICompatStream(url, key, model, messages, onChunk, signal) {
  const headers = { 'Content-Type': 'application/json' };
  if (key) headers['Authorization'] = `Bearer ${key}`;
  const res = await fetch(url, {
    method: 'POST',
    headers,
    signal,
    body: JSON.stringify({ model, messages, max_tokens: 1024, stream: true })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `${res.status}`);
  }
  // A provider (or the Worker before it's redeployed with stream support) may
  // ignore stream:true and send back a normal buffered completion. Detect that
  // by content-type and use the reply as-is rather than throwing it away.
  const ctype = res.headers.get('content-type') || '';
  if (!ctype.includes('text/event-stream')) {
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('empty response');
    onChunk(content);
    return content;
  }
  if (!res.body) throw new Error('no stream body');
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // keep the possibly-incomplete last line for next read
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const payload = trimmed.slice(5).trim();
        if (!payload || payload === '[DONE]') continue;
        try {
          const json = JSON.parse(payload);
          const delta = json.choices?.[0]?.delta?.content || '';
          if (delta) { full += delta; onChunk(full); }
        } catch (_) { /* partial/malformed chunk — skip it */ }
      }
    }
  } catch (streamErr) {
    if (full) return full; // got something real before the drop — keep it
    throw streamErr;
  }
  if (!full) throw new Error('empty stream response');
  return full;
}

// One-shot AI call outside the chat history — used by /translate etc.
async function quickAI(systemPrompt, userText) {
  const msgs = [{ role: 'system', content: systemPrompt }, { role: 'user', content: userText }];
  try { if (VOID_CORE_API.url) return await callOpenAICompat(VOID_CORE_API.url, VOID_CORE_API.key, VOID_CORE_API.model, msgs); } catch (_) {}
  try { return await callPollinations(msgs); } catch (_) {}
  return null;
}

// Tiny haptic tap where it feels right (send, pin, pomodoro done)
function buzz(ms = 35) {
  if (App.settings.haptic !== false && navigator.vibrate) { try { navigator.vibrate(ms); } catch (_) {} }
}

async function callPollinations(messages) {
  const res = await fetch('https://text.pollinations.ai/openai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'openai', messages, max_tokens: 1024 })
  });
  if (!res.ok) throw new Error(`Pollinations ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

let sendMessageInFlight = false;
async function sendMessage() {
  // Guards against a stray double-submit (e.g. a slow tap registering twice
  // on a flaky connection) firing the same command/reply twice.
  if (sendMessageInFlight) return;
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;
  sendMessageInFlight = true;
  try {
  buzz();

  // /define command
  if (text.toLowerCase().startsWith('/define ')) {
    const word = text.slice(8).trim();
    if (word) {
      appendMessage('user', text);
      input.value = ''; input.style.height = 'auto'; updateSendMicBtn();
      try {
        const r = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
        if (r.ok) {
          const data = await r.json();
          const entry = data[0];
          const phonetic = entry.phonetic || '';
          const meanings = entry.meanings || [];
          let defText = `📖 ${entry.word.toUpperCase()}${phonetic ? '  ' + phonetic : ''}\n`;
          meanings.slice(0, 2).forEach(m => {
            defText += `\n[${m.partOfSpeech}]\n`;
            (m.definitions || []).slice(0, 2).forEach((d, i) => {
              defText += `${i + 1}. ${d.definition}\n`;
              if (d.example) defText += `   e.g. "${d.example}"\n`;
            });
          });
          appendMessage('system', defText.trim());
        } else {
          appendMessage('system', `No definition found for "${word}".`);
        }
      } catch(e) {
        appendMessage('system', `Error fetching definition for "${word}".`);
      }
    }
    return;
  }

  // /price command
  if (text.toLowerCase().startsWith('/price ')) {
    const symbol = text.slice(7).trim().toLowerCase();
    if (symbol) {
      appendMessage('user', text);
      input.value = ''; input.style.height = 'auto'; updateSendMicBtn();
      const COIN_MAP = { btc:'bitcoin', eth:'ethereum', sol:'solana', bnb:'binancecoin', xrp:'ripple', ada:'cardano', doge:'dogecoin', dot:'polkadot', matic:'matic-network', avax:'avalanche-2', link:'chainlink', ltc:'litecoin', shib:'shiba-inu', uni:'uniswap', atom:'cosmos' };
      const coinId = COIN_MAP[symbol] || symbol;
      try {
        const r = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(coinId)}&vs_currencies=usd,eur`);
        if (r.ok) {
          const data = await r.json();
          const prices = data[coinId];
          if (prices) {
            appendMessage('system', `💰 ${coinId.toUpperCase()}\nUSD: $${prices.usd?.toLocaleString() || 'N/A'}\nEUR: €${prices.eur?.toLocaleString() || 'N/A'}`);
          } else {
            appendMessage('system', `No price data found for "${symbol}". Try using the full CoinGecko ID (e.g. /price bitcoin).`);
          }
        } else {
          appendMessage('system', `Could not fetch price for "${symbol}".`);
        }
      } catch(e) {
        appendMessage('system', `Error fetching price for "${symbol}".`);
      }
    }
    return;
  }

  // /image command — free, no-key image generation via Pollinations, or
  // image editing (via Gemini) when a reference photo is attached
  if (text.toLowerCase().startsWith('/image ')) {
    const prompt = text.slice(7).trim();
    if (prompt) {
      const refImage = App.pendingImage;
      const userContent = refImage ? [{ type: 'text', text }, { type: 'image_url', image_url: { url: refImage } }] : text;
      App.chatHistory.push({ role: 'user', content: userContent });
      appendMessage('user', userContent, App.chatHistory.length - 1);
      saveChatHistory();
      clearPendingImage();
      input.value = ''; input.style.height = 'auto'; updateSendMicBtn();
      if (refImage) await runImageEdit(prompt, refImage);
      else await runImageGeneration(prompt);
    }
    return;
  }

  // Deep Research — /research <topic>, or natural language ("research X",
  // "do a deep dive on X", "deep research X")
  const researchMatch = text.match(/^\/research\s+(.+)$/i)
    || text.match(/^(?:deep\s+)?research(?:\s+(?:on|about|into))?\s+(.+)$/i)
    || text.match(/^(?:do|run|give me)\s+(?:a\s+)?(?:deep\s+)?(?:research|deep dive|report)\s+(?:on|about|into)\s+(.+)$/i);
  if (researchMatch) {
    const topic = researchMatch[1].trim().replace(/[?.!]+$/, '').trim();
    if (topic.length >= 3) {
      appendMessage('user', text);
      App.chatHistory.push({ role: 'user', content: text });
      input.value = ''; input.style.height = 'auto'; updateSendMicBtn();
      await runDeepResearch(topic);
      return;
    }
  }

  // /doc — write a document from a description, save it, offer export
  if (text.toLowerCase().startsWith('/doc ')) {
    const req = text.slice(5).trim();
    appendMessage('user', text);
    input.value = ''; input.style.height = 'auto'; updateSendMicBtn();
    if (!req) { appendMessage('system', 'Usage: /doc a one-page cover letter for a marketing role'); return; }
    const typingId = appendTyping();
    const doc = await generateDocument(req);
    removeTyping(typingId);
    if (!doc) { appendMessage('system', 'Could not generate that document — try again.'); return; }
    storeDocument(doc.title, doc.content);
    showDocumentMessage(doc.title, doc.content);
    return;
  }

  // /editdoc — revise the document currently being edited (set from Documents panel)
  if (text.toLowerCase().startsWith('/editdoc ')) {
    const instruction = text.slice(9).trim();
    appendMessage('user', text);
    input.value = ''; input.style.height = 'auto'; updateSendMicBtn();
    const base = App.editingDoc;
    if (!base) { appendMessage('system', 'Open a document from Settings → Documents → Edit first.'); return; }
    if (!instruction) { appendMessage('system', 'Tell me what to change, e.g. /editdoc make it more formal'); return; }
    const typingId = appendTyping();
    const revised = await quickAI(
      'You are editing an existing document. Apply the user\'s change and return the FULL updated document as plain text — a title line then the body, no markdown symbols, no commentary.',
      `CURRENT DOCUMENT (title: ${base.title}):\n${base.content}\n\nCHANGE REQUESTED: ${instruction}`);
    removeTyping(typingId);
    if (!revised) { appendMessage('system', 'Could not edit that document — try again.'); return; }
    const lines = revised.trim().split('\n');
    const newTitle = (lines[0] || base.title).replace(/^#+\s*/, '').trim().slice(0, 80) || base.title;
    const newContent = lines.slice(1).join('\n').trim() || revised.trim();
    storeDocument(newTitle, newContent);
    App.editingDoc = App.documents.find(d => d.title === newTitle) || null;
    showDocumentMessage(newTitle, newContent);
    return;
  }

  // /gh — GitHub actions from chat
  if (text.toLowerCase() === '/gh' || text.toLowerCase().startsWith('/gh ')) {
    appendMessage('user', text);
    input.value = ''; input.style.height = 'auto'; updateSendMicBtn();
    const parts = text.slice(3).trim().split(/\s+/);
    const sub = (parts.shift() || 'help').toLowerCase();
    if (!App.githubToken || !App.githubUser) {
      if (sub !== 'help') { appendMessage('system', '🔗 Connect GitHub first: Settings → GitHub, paste a Personal Access Token.'); return; }
    }
    if (sub === 'help' || sub === '') {
      appendMessage('system', [
        '🐙 **GitHub commands**',
        '`/gh repos` — list your repositories',
        '`/gh new <name>` — create a new repo',
        '`/gh scaffold <owner/repo> <what to build>` — generate a whole project & commit it',
        '`/gh ls <owner/repo> [path]` — browse files in a repo',
        '`/gh get <owner/repo> <path>` — open a file to read/edit',
        '`/gh edit <instruction>` — VOID edits the open file',
        '`/gh push <owner/repo> <path>` — commit the last VOID reply to a file',
        '',
        App.githubFile ? `📂 Open: ${App.githubFile.owner}/${App.githubFile.repo}/${App.githubFile.path}` : '',
        App.githubUser ? `Connected as @${App.githubUser.login}.` : 'Not connected yet — Settings → GitHub.',
      ].filter(Boolean).join('\n'));
      return;
    }
    if (sub === 'ls') {
      const full = parts[0] || '';
      const path = parts[1] || '';
      if (!full.includes('/')) { appendMessage('system', 'Usage: /gh ls owner/repo [path]'); return; }
      const [owner, repo] = full.split('/');
      const typingId = appendTyping();
      try {
        const entries = await ghListContents(owner, repo, path);
        removeTyping(typingId);
        appendMessage('system', entries.length
          ? `📂 **${full}${path ? '/' + path : ''}**\n` + entries.map(e => `${e.type === 'dir' ? '📁' : '📄'} ${e.name}`).join('\n')
          : 'Empty folder.');
      } catch (e) { removeTyping(typingId); appendMessage('system', `GitHub error: ${e.message}`); }
      return;
    }
    if (sub === 'get') {
      const full = parts[0] || '';
      const path = parts.slice(1).join(' ');
      if (!full.includes('/') || !path) { appendMessage('system', 'Usage: /gh get owner/repo path/to/file'); return; }
      const [owner, repo] = full.split('/');
      const typingId = appendTyping();
      try {
        const file = await ghGetFile(owner, repo, path);
        App.githubFile = { owner, repo, path: file.path, sha: file.sha, content: file.content };
        removeTyping(typingId);
        showGitHubFileMessage(App.githubFile);
      } catch (e) { removeTyping(typingId); appendMessage('system', `GitHub error: ${e.message}`); }
      return;
    }
    if (sub === 'edit') {
      const instruction = parts.join(' ');
      if (!App.githubFile) { appendMessage('system', 'Open a file first: /gh get owner/repo path'); return; }
      if (!instruction) { appendMessage('system', 'Tell me what to change, e.g. /gh edit add error handling to the fetch call'); return; }
      const typingId = appendTyping();
      try {
        const revised = await quickAI(
          'You are editing a source file. Apply the requested change and return ONLY the complete updated file contents — no markdown fences, no commentary, no explanation. Preserve everything not mentioned.',
          `FILE: ${App.githubFile.path}\n\n${App.githubFile.content}\n\nCHANGE: ${instruction}`);
        removeTyping(typingId);
        if (!revised) { appendMessage('system', 'Could not edit — try again.'); return; }
        // Strip accidental code fences if the model added them.
        let out = revised.trim().replace(/^```[\w-]*\n?/, '').replace(/\n?```$/, '');
        App.githubFile.content = out;
        showGitHubFileMessage(App.githubFile, true);
      } catch (e) { removeTyping(typingId); appendMessage('system', `Edit failed: ${e.message}`); }
      return;
    }
    if (sub === 'scaffold') {
      const full = parts.shift() || '';
      const desc = parts.join(' ');
      if (!full.includes('/') || !desc) { appendMessage('system', 'Usage: /gh scaffold owner/repo a flask todo api with tests'); return; }
      const [owner, repo] = full.split('/');
      const typingId = appendTyping();
      try {
        const reply = await quickAI(
          'You are a senior engineer scaffolding a project. Output a complete, working multi-file project for the request. ' +
          'Format EXACTLY as repeated blocks: a line "=== relative/path/file.ext ===" followed by that file\'s full contents. ' +
          'No commentary before, between, or after the blocks. No markdown code fences. Include a README.md. Keep it to the essential files (aim for 3–8).',
          desc);
        removeTyping(typingId);
        const files = parseMultiFile(reply || '');
        if (!files.length) { appendMessage('system', 'Could not scaffold that — try rephrasing.'); return; }
        pendingProject = { owner, repo, files };
        showProjectMessage(owner, repo, files);
      } catch (e) { removeTyping(typingId); appendMessage('system', `Error: ${e.message}`); }
      return;
    }
    if (sub === 'repos') {
      const typingId = appendTyping();
      try {
        const repos = await ghListRepos();
        removeTyping(typingId);
        appendMessage('system', repos.length
          ? '📦 **Your repos**\n' + repos.slice(0, 25).map(r => `• ${r.full_name}${r.private ? ' 🔒' : ''}`).join('\n')
          : 'No repositories found.');
      } catch (e) { removeTyping(typingId); appendMessage('system', `GitHub error: ${e.message}`); }
      return;
    }
    if (sub === 'new') {
      const name = (parts[0] || '').replace(/\s+/g, '-');
      if (!name) { appendMessage('system', 'Usage: /gh new my-repo-name'); return; }
      const typingId = appendTyping();
      try {
        const repo = await ghCreateRepo(name, true);
        removeTyping(typingId);
        appendMessage('system', `✅ Created **${repo.full_name}** — ${repo.html_url}`);
        ghListRepos().catch(() => {});
      } catch (e) { removeTyping(typingId); appendMessage('system', `GitHub error: ${e.message}`); }
      return;
    }
    if (sub === 'push') {
      let full = parts[0] || '';
      let path = parts[1] || '';
      let content;
      // Bare `/gh push` commits the currently-open (edited) file back to its own path.
      if (!full && App.githubFile) {
        full = `${App.githubFile.owner}/${App.githubFile.repo}`;
        path = App.githubFile.path;
        content = App.githubFile.content;
      } else {
        if (!full.includes('/') || !path) { appendMessage('system', 'Usage: /gh push owner/repo path/to/file — or just /gh push to save the open file'); return; }
        const lastAssistant = [...App.chatHistory].reverse().find(m => m.role === 'assistant');
        content = lastAssistant ? msgText(lastAssistant.content) : '';
      }
      if (!content) { appendMessage('system', 'Nothing to push. Ask something or open a file first.'); return; }
      const [owner, repo] = full.split('/');
      const typingId = appendTyping();
      try {
        const res = await ghPutFile(owner, repo, path, content, `Update ${path} via VOID`);
        removeTyping(typingId);
        appendMessage('system', `✅ Committed to **${full}** → ${res.content?.html_url || path}`);
        // Refresh the open file's sha so a follow-up edit+push works.
        if (App.githubFile && App.githubFile.owner === owner && App.githubFile.repo === repo && App.githubFile.path === path && res.content?.sha) {
          App.githubFile.sha = res.content.sha;
        }
      } catch (e) { removeTyping(typingId); appendMessage('system', `GitHub error: ${e.message}`); }
      return;
    }
    appendMessage('system', 'Unknown /gh command. Try /gh help');
    return;
  }

  // /convert command — "/convert 100 usd to eur"
  if (text.toLowerCase().startsWith('/convert ')) {
    const m = text.slice(9).trim().match(/^([\d.,]+)\s*([a-z]{3})\s*(?:to|in)\s*([a-z]{3})$/i);
    appendMessage('user', text);
    input.value = ''; input.style.height = 'auto'; updateSendMicBtn();
    if (!m) {
      appendMessage('system', 'Usage: /convert 100 usd to eur');
    } else {
      const [, amtStr, from, to] = m;
      const amt = parseFloat(amtStr.replace(/,/g, ''));
      try {
        const r = await fetch(`https://open.er-api.com/v6/latest/${from.toUpperCase()}`);
        if (r.ok) {
          const d = await r.json();
          const rate = d.rates?.[to.toUpperCase()];
          if (rate) {
            appendMessage('system', `💱 ${amt.toLocaleString()} ${from.toUpperCase()} = ${(amt * rate).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${to.toUpperCase()}`);
          } else {
            appendMessage('system', `Unknown currency code "${to.toUpperCase()}".`);
          }
        } else {
          appendMessage('system', `Could not fetch exchange rate for "${from.toUpperCase()}".`);
        }
      } catch(e) {
        appendMessage('system', 'Error fetching exchange rate.');
      }
    }
    return;
  }

  // /brief — daily briefing built from data the app already has
  if (['/brief', '/briefing'].includes(text.toLowerCase().trim())) {
    appendMessage('user', text);
    input.value = ''; input.style.height = 'auto'; updateSendMicBtn();
    const typingId = appendTyping();
    const out = await buildDailyBriefingText();
    removeTyping(typingId);
    appendMessage('system', out);
    return;
  }

  // /help — list every command
  if (text.toLowerCase().trim() === '/help') {
    appendMessage('user', text);
    input.value = ''; input.style.height = 'auto'; updateSendMicBtn();
    appendMessage('system', [
      '🧭 **Just talk to me — no commands needed.**',
      '',
      '🎨 **Images** — "make me a logo of a wolf", "a neon city at night", or attach a photo and say "turn this into pixel art"',
      '📄 **Documents** — "write me a cover letter for a nurse job" → save as .txt / Word / PDF',
      '🔬 **Deep research** — "research the history of coffee" → a sourced, structured report',
      '✦ **Gems** — build your own named assistants in Settings → Gems, pick them from MODE',
      '🐙 **GitHub** — "/gh scaffold you/repo a flask todo api", "/gh get you/repo main.py", then "/gh edit …"',
      '🌦 **Ask anything** — weather, "who is …", news, math, translations — I pull real data automatically',
      '🚀 **Actions** — "open spotify", "navigate to Cairo", "play lofi on youtube"',
      '',
      'Handy shortcuts still work if you like them: `/brief` `/doc` `/image` `/gh` `/qr` `/roll` `/flip` `/pick` `/calc` `/convert` `/define` `/price` `/translate`',
    ].join('\n'));
    return;
  }

  // /calc — safe local calculator
  if (text.toLowerCase().startsWith('/calc ')) {
    const expr = text.slice(6).trim();
    appendMessage('user', text);
    input.value = ''; input.style.height = 'auto'; updateSendMicBtn();
    if (!/^[\d\s+\-*/().,%^eE]+$/.test(expr)) {
      appendMessage('system', 'I can only calculate numbers and + − × ÷ ( ) % ^ here.');
    } else {
      try {
        const result = Function('"use strict";return (' + expr.replace(/\^/g, '**').replace(/,/g, '') + ')')();
        appendMessage('system', `🧮 ${expr} = **${Number.isFinite(result) ? +result.toPrecision(12) : result}**`);
      } catch (_) { appendMessage('system', 'That expression didn\'t compute — check the syntax.'); }
    }
    return;
  }

  // /qr — QR code image (free, no key)
  if (text.toLowerCase().startsWith('/qr ')) {
    const data = text.slice(4).trim();
    if (data) {
      appendMessage('user', text);
      input.value = ''; input.style.height = 'auto'; updateSendMicBtn();
      appendImageMessage(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(data)}`, 'QR code');
    }
    return;
  }

  // /roll, /flip, /pick — quick decisions, all local
  if (text.toLowerCase().trim() === '/flip') {
    appendMessage('user', text);
    input.value = ''; input.style.height = 'auto'; updateSendMicBtn();
    appendMessage('system', `🪙 **${Math.random() < 0.5 ? 'Heads' : 'Tails'}**`);
    return;
  }
  if (/^\/roll(\s|$)/i.test(text.trim())) {
    appendMessage('user', text);
    input.value = ''; input.style.height = 'auto'; updateSendMicBtn();
    const m = text.trim().match(/^\/roll\s*(\d*)d?(\d+)?$/i);
    const count = Math.min(20, parseInt(m?.[1] || '1', 10) || 1);
    const sides = Math.min(1000, parseInt(m?.[2] || '6', 10) || 6);
    const rolls = Array.from({ length: count }, () => 1 + Math.floor(Math.random() * sides));
    appendMessage('system', `🎲 ${count}d${sides}: ${rolls.join(' + ')}${count > 1 ? ` = **${rolls.reduce((a, b) => a + b, 0)}**` : ''}`);
    return;
  }
  if (text.toLowerCase().startsWith('/pick ')) {
    const opts = text.slice(6).split(/[,;]| or /i).map(s => s.trim()).filter(Boolean);
    appendMessage('user', text);
    input.value = ''; input.style.height = 'auto'; updateSendMicBtn();
    appendMessage('system', opts.length >= 2
      ? `🎯 I pick: **${opts[Math.floor(Math.random() * opts.length)]}**`
      : 'Give me at least two options, e.g. /pick pizza, sushi, tacos');
    return;
  }

  // /translate <lang> <text> — routed through the AI so any language works
  if (text.toLowerCase().startsWith('/translate ')) {
    const m = text.slice(11).trim().match(/^(\S+)\s+([\s\S]+)$/);
    appendMessage('user', text);
    input.value = ''; input.style.height = 'auto'; updateSendMicBtn();
    if (!m) { appendMessage('system', 'Usage: /translate spanish Hello, how are you?'); return; }
    const typingId = appendTyping();
    const reply = await quickAI(
      `You are a translator. Translate the user's text into ${m[1]}. Output ONLY the translation, then if the script is non-Latin add one short pronunciation line.`,
      m[2]);
    removeTyping(typingId);
    appendMessage('system', reply || 'Translation failed — try again.');
    return;
  }

  // Natural-language app opening ("open spotify", "navigate to X", "play X on youtube"...)
  const appAction = detectAppAction(text);
  if (appAction) {
    appendMessage('user', text);
    input.value = ''; input.style.height = 'auto'; updateSendMicBtn();
    appendMessage('system', `🚀 ${appAction.label}`);
    window.open(appAction.url, '_blank');
    return;
  }

  // Natural-language image generation ("draw me a dragon", "generate an image of..."),
  // or image editing (via Gemini) when a reference photo is attached
  const imagePrompt = extractImageGenPrompt(text);
  if (imagePrompt) {
    const refImage = App.pendingImage;
    const userContent = refImage ? [{ type: 'text', text }, { type: 'image_url', image_url: { url: refImage } }] : text;
    App.chatHistory.push({ role: 'user', content: userContent });
    appendMessage('user', userContent, App.chatHistory.length - 1);
    saveChatHistory();
    clearPendingImage();
    input.value = ''; input.style.height = 'auto'; updateSendMicBtn();
    if (refImage) await runImageEdit(imagePrompt, refImage);
    else await runImageGeneration(imagePrompt);
    return;
  }

  // Natural-language intent routing — no slash needed. Skipped for messages
  // that clearly read as plain chat/questions, so those stay instant.
  if (!looksLikePlainChat(text)) {
    const refImage = App.pendingImage;
    // Show the user's message + a thinking indicator while we classify.
    const userContent = refImage ? [{ type: 'text', text }, { type: 'image_url', image_url: { url: refImage } }] : text;
    App.chatHistory.push({ role: 'user', content: userContent });
    appendMessage('user', userContent, App.chatHistory.length - 1);
    saveChatHistory();
    input.value = ''; input.style.height = 'auto'; updateSendMicBtn();

    // GitHub natural language — only when an account is connected and the
    // wording is GitHub-ish. Account-changing actions confirm before running.
    if (App.githubToken && App.githubUser && GH_HINT.test(text)) {
      const ghTypingId = appendTyping();
      const gh = await classifyGitHubIntent(text);
      removeTyping(ghTypingId);
      if (gh && gh.action && gh.action !== 'none') { await handleGitHubIntent(gh); return; }
    }

    const typingId = appendTyping();
    const intent = await classifyIntent(text);
    removeTyping(typingId);
    if (intent && intent.type === 'image') {
      clearPendingImage();
      if (refImage) await runImageEdit(intent.prompt || text, refImage);
      else await runImageGeneration(intent.prompt || text);
      return;
    }
    if (intent && intent.type === 'document') {
      const typingId2 = appendTyping();
      const doc = await generateDocument(intent.prompt || text);
      removeTyping(typingId2);
      if (doc) { storeDocument(doc.title, doc.content); showDocumentMessage(doc.title, doc.content); }
      else appendMessage('system', 'Could not generate that — try rephrasing.');
      return;
    }
    // Classified as chat (or classifier failed) — fall through to a normal reply,
    // reusing the message we already pushed above.
    if (!consumeFreeMessage()) { showUpgradePrompt(); return; }
    clearPendingImage();
    await generateAssistantReply(text);
    return;
  }

  if (!consumeFreeMessage()) { showUpgradePrompt(); return; }

  // Attach pending image as OpenAI-style content parts (vision)
  const content = App.pendingImage
    ? [{ type: 'text', text }, { type: 'image_url', image_url: { url: App.pendingImage } }]
    : text;
  clearPendingImage();

  App.chatHistory.push({ role: 'user', content });
  appendMessage('user', content, App.chatHistory.length - 1);
  input.value = '';
  input.style.height = 'auto';
  updateSendMicBtn();

  await generateAssistantReply(text);
  } finally {
    sendMessageInFlight = false;
  }
}

// Runs the provider fallback chain against the current App.chatHistory and appends the
// result. Shared by sendMessage() (new user turn) and regenerateMessageAt() (no new turn).
async function generateAssistantReply(triggerText) {
  const typingId = appendTyping();
  App.generating = true;
  App.currentAbort = new AbortController();
  const abortSignal = App.currentAbort.signal;
  updateSendMicBtn();
  try {
  const weatherCtx = await getWeatherLookupCtx(triggerText || '');
  const knowledge = await getKnowledgeLookupCtx(triggerText || '');
  const web = await getWebSearchCtx(triggerText || '');
  const sources = [knowledge.source, web.source].filter(Boolean);
  // Keep image payloads only on the newest message — older base64 images
  // would balloon every request if re-sent each turn.
  const recent = App.chatHistory.slice(-20).map((m, i, arr) =>
    (i < arr.length - 1 && Array.isArray(m.content))
      ? { role: m.role, content: msgText(m.content) + ' [attached an image earlier]' }
      : m);
  const messages = [{ role: 'system', content: buildSystemPrompt(weatherCtx + knowledge.ctx + web.ctx) }, ...recent];

  let reply = null;
  let lastError = null;
  let streamedLive = false;

  // Real token-by-token streaming: the typing-dots bubble morphs in place
  // into live text the first time a chunk arrives, so there's no flicker
  // between "thinking" and "answering". Non-streaming fallback providers
  // (native Gemini, Pollinations) just skip this and use the old
  // wait-then-playback behavior below.
  const box = document.getElementById('messages-box');
  function onChunk(full) {
    const el = document.getElementById(typingId);
    if (!el) return;
    if (!streamedLive) {
      streamedLive = true;
      el.querySelector('.bubble-body').classList.add('bubble-ai');
    }
    el.querySelector('.bubble-body').textContent = full;
    box.scrollTop = box.scrollHeight;
  }

  // Always try the shared VOID core first
  if (VOID_CORE_API.url) {
    try {
      reply = await callOpenAICompatStream(VOID_CORE_API.url, VOID_CORE_API.key, VOID_CORE_API.model, messages, onChunk, abortSignal);
    } catch(e) { lastError = e; }
  }

  // User hit Stop with nothing streamed yet — don't cascade into other providers.
  if (!reply && !abortSignal.aborted) {
  const order = App.settings.providerOrder || ['gemini', 'groq', 'openrouter'];
  const tryProviders = [...order, 'together', 'mistral', 'pollinations'];
  const tried = new Set();

  for (const p of tryProviders) {
    if (tried.has(p)) continue;
    tried.add(p);
    if (abortSignal.aborted) break;
    try {
      if (p === 'gemini' && App.settings.geminiKey) {
        reply = await callGemini(messages); break;
      } else if (p === 'groq' && App.settings.groqKey) {
        reply = await callOpenAICompatStream('https://api.groq.com/openai/v1/chat/completions',
          App.settings.groqKey, App.settings.groqModel || 'llama-3.3-70b-versatile', messages, onChunk, abortSignal); break;
      } else if (p === 'openrouter' && App.settings.apiKey) {
        reply = await callOpenAICompatStream('https://openrouter.ai/api/v1/chat/completions',
          App.settings.apiKey, App.settings.model || 'meta-llama/llama-3.2-3b-instruct:free', messages, onChunk, abortSignal); break;
      } else if (p === 'together' && App.settings.togetherKey) {
        reply = await callOpenAICompatStream('https://api.together.xyz/v1/chat/completions',
          App.settings.togetherKey, App.settings.togetherModel || 'meta-llama/Llama-3.2-70B-Instruct-Turbo', messages, onChunk, abortSignal); break;
      } else if (p === 'mistral' && App.settings.mistralKey) {
        reply = await callOpenAICompatStream('https://api.mistral.ai/v1/chat/completions',
          App.settings.mistralKey, App.settings.mistralModel || 'mistral-large-latest', messages, onChunk, abortSignal); break;
      } else if (p === 'pollinations') {
        reply = await callPollinations(messages); break;
      }
    } catch(e) { lastError = e; }
  }
  } // end if (!reply) fallback chain

  if (reply) {
    App.chatHistory.push({ role: 'assistant', content: reply, sources });
    saveChatHistory();
    const historyIndex = App.chatHistory.length - 1;
    if (streamedLive) {
      // Upgrade the same bubble in place: real markdown render + action buttons.
      const el = document.getElementById(typingId);
      if (el) {
        el.removeAttribute('id');
        el.dataset.historyIndex = historyIndex;
        el.innerHTML = buildBubbleInnerHTML('assistant', reply, historyIndex, sources);
      } else {
        appendMessage('assistant', reply, historyIndex, sources);
      }
    } else {
      removeTyping(typingId);
      streamInMessage(reply, historyIndex, sources);
    }
    if (App.voiceConvo) {
      App.voiceTriggered = false;
      if (App.settings.voiceEnabled) speak(reply);           // speak() resumes listening when done
      else setTimeout(() => App.startListening?.(), 400);    // voice off — jump straight back to mic
    } else if (App.voiceTriggered) { speak(reply); App.voiceTriggered = false; }
    if (triggerText) maybeExtractMemory(triggerText); // fire-and-forget, doesn't block the reply
    maybeSuggestFollowups(triggerText, reply);        // fire-and-forget too
  } else {
    removeTyping(typingId);
    if (abortSignal.aborted) {
      appendMessage('system', '⏹ Stopped.');
    } else {
      appendMessage('system', `ERROR :: ${lastError ? lastError.message : 'All providers unavailable.'}`);
    }
  }
  } finally {
    App.generating = false;
    App.currentAbort = null;
    updateSendMicBtn();
  }
}

// Typewriter reveal for assistant replies — gives the streaming feel without
// needing SSE support from the Worker. Skipped under reduced motion.
function streamInMessage(text, historyIndex, sources = []) {
  appendMessage('system', App.settings.reducedMotion ? text : '', historyIndex, sources);
  if (App.settings.reducedMotion) return;
  const box = document.getElementById('messages-box');
  const bubble = box.lastElementChild?.querySelector('.bubble-body');
  if (!bubble) return;
  // requestAnimationFrame + time-based progress: one paint per display frame
  // (true 60fps) instead of a fixed setInterval that stutters under load.
  const duration = Math.min(1800, Math.max(500, text.length * 10));
  const start = performance.now();
  let lastN = -1;
  function frame(now) {
    const t = Math.min(1, (now - start) / duration);
    const n = Math.ceil(text.length * t);
    if (n !== lastN) {
      lastN = n;
      bubble.textContent = text.slice(0, n);
      box.scrollTop = box.scrollHeight;
    }
    if (t < 1) requestAnimationFrame(frame);
    else {
      bubble.innerHTML = renderMarkdownLite(text);
      box.scrollTop = box.scrollHeight;
    }
  }
  requestAnimationFrame(frame);
}

// Drops the given assistant reply (and anything after it) from history, then re-asks.
async function regenerateMessageAt(index) {
  if (index == null || !App.chatHistory[index] || App.chatHistory[index].role !== 'assistant') return;
  const old = App.chatHistory[index];
  // Image replies regenerate as a fresh image (new seed), not a new LLM call
  const oldImages = msgImages(old.content);
  if (oldImages.length) {
    const caption = msgText(old.content);
    const promptMatch = caption.match(/^Generated:\s*"([\s\S]+)"$/);
    const prompt = promptMatch ? promptMatch[1] : caption;
    App.chatHistory = App.chatHistory.slice(0, index);
    saveChats();
    renderActiveChat();
    await runImageGeneration(prompt);
    return;
  }
  let triggerText = '';
  for (let i = index - 1; i >= 0; i--) {
    if (App.chatHistory[i].role === 'user') { triggerText = App.chatHistory[i].content; break; }
  }
  App.chatHistory = App.chatHistory.slice(0, index);
  saveChats();
  renderActiveChat();
  await generateAssistantReply(triggerText);
}

// Puts a past user message back into the input box and forks the conversation from
// that point (like ChatGPT/Gemini's edit) — everything after it is dropped.
function editMessageAt(index) {
  if (index == null || !App.chatHistory[index] || App.chatHistory[index].role !== 'user') return;
  const input = document.getElementById('chat-input');
  if (!input) return;
  const text = msgText(App.chatHistory[index].content);
  App.chatHistory = App.chatHistory.slice(0, index);
  saveChats();
  renderActiveChat();
  input.value = text;
  input.style.height = 'auto';
  input.style.height = input.scrollHeight + 'px';
  updateSendMicBtn();
  input.focus();
}

function buildBubbleInnerHTML(role, content, historyIndex, sources = []) {
  const text = msgText(content);
  const images = msgImages(content);
  const isUser = role === 'user';
  // AI-generated images are the actual content and deserve real size; user-attached
  // photo previews stay small since the point is just showing what was sent.
  const imgHTML = images.map(u => isUser
    ? `<img src="${u}" alt="attachment" style="max-width:200px;max-height:200px;border-radius:12px;display:block;margin-bottom:6px;">`
    : `<img src="${u}" alt="generated image" loading="lazy" style="max-width:100%;border-radius:12px;display:block;margin-bottom:6px;">`
  ).join('');
  const sourcesHTML = sources.length
    ? `<div class="bubble-sources">${sources.map(s => `<a href="${s.url}" target="_blank" rel="noopener noreferrer" class="source-chip">🔗 ${escapeHTML(s.label)}</a>`).join('')}</div>`
    : '';

  const time = new Date().toLocaleTimeString('en-US', { hour12: false });
  const label = isUser ? 'YOU' : 'VOID';

  return `
    <div class="bubble-meta">${label} // ${time}</div>
    <div class="bubble-body${isUser ? '' : ' bubble-ai'}">${imgHTML}${renderMarkdownLite(text)}</div>
    ${sourcesHTML}
    <div class="bubble-actions">
      <button class="bubble-act-btn" data-act="copy" aria-label="Copy message">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      </button>${isUser && historyIndex != null ? `
      <button class="bubble-act-btn" data-act="edit" aria-label="Edit message">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
      </button>` : ''}${!isUser && historyIndex != null ? `
      <button class="bubble-act-btn" data-act="regen" aria-label="Regenerate response">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
      </button>` : ''}${!isUser && images.length ? `
      <button class="bubble-act-btn" data-act="download-img" data-img-url="${escapeHTML(images[0])}" aria-label="Download image">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      </button>` : ''}${!isUser ? `
      <button class="bubble-act-btn${App.bookmarks.some(b => b.text === text) ? ' starred' : ''}" data-act="star" aria-label="Save message">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="${App.bookmarks.some(b => b.text === text) ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      </button>` : ''}${!isUser && !images.length && text.length > 40 ? `
      <button class="bubble-act-btn" data-act="savedoc" aria-label="Save as document">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      </button>` : ''}
      <button class="bubble-act-btn" data-act="del" aria-label="Delete message">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </button>
    </div>
  `;
}

function appendMessage(role, content, historyIndex = null, sources = []) {
  const box = document.getElementById('messages-box');
  const welcome = box.querySelector('.matrix-welcome');
  if (welcome) welcome.remove();
  clearFollowupChips(); // stale suggestions don't apply once the conversation moves

  App.msgCount++;
  updateWelcomeStatsLine();

  const el = document.createElement('div');
  el.className = `chat-bubble ${role === 'user' ? 'user' : 'assistant'}`;
  if (historyIndex != null) el.dataset.historyIndex = historyIndex;
  el.innerHTML = buildBubbleInnerHTML(role, content, historyIndex, sources);
  box.appendChild(el);
  box.scrollTop = box.scrollHeight;
  return el;
}

function setupMessageActions() {
  const box = document.getElementById('messages-box');
  if (!box) return;
  box.addEventListener('click', (e) => {
    const btn = e.target.closest('.bubble-act-btn');
    if (!btn) {
      // Tap anywhere else on a bubble (touch devices have no hover) to reveal its actions
      const tapped = e.target.closest('.chat-bubble');
      document.querySelectorAll('.chat-bubble.actions-visible').forEach(b => { if (b !== tapped) b.classList.remove('actions-visible'); });
      if (tapped) tapped.classList.toggle('actions-visible');
      return;
    }
    const bubble = btn.closest('.chat-bubble');
    if (!bubble) return;
    const act = btn.dataset.act;
    const idxAttr = bubble.dataset.historyIndex;
    const index = idxAttr !== undefined ? parseInt(idxAttr, 10) : null;
    const bodyEl = bubble.querySelector('.bubble-body');
    const rawText = (index != null && App.chatHistory[index]) ? msgText(App.chatHistory[index].content) : (bodyEl ? bodyEl.textContent : '');

    if (act === 'copy') {
      navigator.clipboard?.writeText(rawText).catch(() => {});
    } else if (act === 'edit') {
      editMessageAt(index);
    } else if (act === 'del') {
      if (index != null && App.chatHistory[index]) {
        App.chatHistory.splice(index, 1);
        saveChats();
        renderActiveChat();
      } else {
        bubble.remove();
      }
    } else if (act === 'regen') {
      regenerateMessageAt(index);
    } else if (act === 'download-img') {
      downloadImage(btn.dataset.imgUrl);
    } else if (act === 'star') {
      const justSaved = toggleBookmark(rawText);
      btn.classList.toggle('starred', justSaved);
      btn.querySelector('svg').setAttribute('fill', justSaved ? 'currentColor' : 'none');
    } else if (act === 'savedoc') {
      const title = rawText.split('\n')[0].replace(/^#+\s*/, '').trim().slice(0, 60) || 'VOID Document';
      storeDocument(title, rawText);
      openDocFormatPicker(title, rawText, btn);
    }
  });
}

async function downloadImage(url) {
  if (!url) return;
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objUrl;
    a.download = `void-${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(objUrl), 4000);
  } catch (_) {
    // cross-origin fetch blocked or offline — fall back to opening it directly
    window.open(url, '_blank');
  }
}

// AI image generation — free, no-key, via Pollinations. Shared by the /image
// command and natural-language requests ("draw me a dragon"). Shows a typing
// indicator while the image loads, then persists it into chat history like
// any other assistant message (so it survives reload/chat-switch and gets
// the normal copy/star/delete/download actions for free).
function loadImageOnce(url, timeoutMs) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = resolve;
    img.onerror = () => reject(new Error('image failed to load'));
    img.src = url;
    setTimeout(() => reject(new Error('image generation timed out')), timeoutMs);
  });
}

async function runImageGeneration(prompt) {
  const typingId = appendTyping();
  const pollinationsUrl = () => `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=768&height=768&seed=${Math.floor(Math.random() * 1e9)}&nologo=true`;
  try {
    let url = pollinationsUrl();
    try {
      await loadImageOnce(url, 25000);
    } catch (_) {
      // Pollinations occasionally drops a request — one silent retry with a
      // fresh seed before actually giving up on the user.
      url = pollinationsUrl();
      await loadImageOnce(url, 25000);
    }
    removeTyping(typingId);
    const content = [{ type: 'image_url', image_url: { url } }, { type: 'text', text: `Generated: "${prompt}"` }];
    App.chatHistory.push({ role: 'assistant', content });
    saveChatHistory();
    appendMessage('assistant', content, App.chatHistory.length - 1);
  } catch (_) {
    removeTyping(typingId);
    appendMessage('system', `Couldn't generate that image — try rephrasing the prompt or try again in a moment.`);
  }
}

// Image editing / reference-image generation — "make this a pixel art",
// "put a hat on this cat". Uses the attached photo (App.pendingImage) via
// Gemini's image model, proxied through the worker (reuses GEMINI_KEY).
async function runImageEdit(prompt, imageDataUri) {
  const typingId = appendTyping();
  try {
    const m = imageDataUri.match(/^data:([^;]+);base64,(.+)$/);
    if (!m) throw new Error('bad image data');
    const [, mimeType, base64] = m;
    const res = await fetch(`${VOID_CORE_API.url}/image-edit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, image: base64, mimeType }),
      signal: AbortSignal.timeout(45000),
    });
    if (!res.ok) throw new Error('image edit failed');
    const data = await res.json();
    if (!data.data) throw new Error('no image in response');
    const url = `data:${data.mimeType || 'image/png'};base64,${data.data}`;
    removeTyping(typingId);
    const content = [{ type: 'image_url', image_url: { url } }, { type: 'text', text: `Edited: "${prompt}"` }];
    App.chatHistory.push({ role: 'assistant', content });
    saveChatHistory();
    appendMessage('assistant', content, App.chatHistory.length - 1);
  } catch (_) {
    removeTyping(typingId);
    appendMessage('system', `Couldn't edit that image — try a different prompt or try again in a moment.`);
  }
}

function appendImageMessage(url, prompt) {
  const box = document.getElementById('messages-box');
  const welcome = box.querySelector('.matrix-welcome');
  if (welcome) welcome.remove();
  App.msgCount++;
  updateWelcomeStatsLine();
  const time = new Date().toLocaleTimeString('en-US', { hour12: false });
  const el = document.createElement('div');
  el.className = 'chat-bubble assistant';
  el.innerHTML = `
    <div class="bubble-meta">VOID // ${time}</div>
    <div class="bubble-body bubble-ai">
      <img src="${url}" alt="${escapeHTML(prompt)}" loading="lazy" style="max-width:100%;border-radius:10px;display:block;" />
    </div>
  `;
  box.appendChild(el);
  box.scrollTop = box.scrollHeight;
}

function updateWelcomeStatsLine() {
  const line = document.getElementById('welcome-stats-line');
  if (line) line.textContent = `INT::${Math.min(App.msgCount, 1)} | MSG::${App.msgCount}`;
}

function appendTyping() {
  const box = document.getElementById('messages-box');
  const id = 'typing-' + Date.now();
  const el = document.createElement('div');
  el.className = 'chat-bubble assistant';
  el.id = id;
  el.innerHTML = `<div class="bubble-meta">VOID::CORE</div><div class="bubble-body"><span class="typing-dots"><span></span><span></span><span></span></span></div>`;
  box.appendChild(el);
  box.scrollTop = box.scrollHeight;
  return id;
}

function removeTyping(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g,
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

// Lightweight markdown → HTML for chat bubbles. Escapes first, so all output is safe.
function renderMarkdownLite(text) {
  const blocks = [];
  let src = String(text).replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    blocks.push(`<pre><button class="code-copy" type="button">Copy</button><code>${escapeHTML(code.replace(/\n$/, ''))}</code></pre>`);
    return `${blocks.length - 1}`;
  });

  src = escapeHTML(src);
  src = src.replace(/`([^`\n]+)`/g, (_, code) => `<code>${code}</code>`);
  src = src.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  src = src.replace(/(^|[^*\w])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
  src = src.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s<]+)/g, (m, linkText, linkUrl, bareUrl) => {
    const href = linkUrl || bareUrl;
    return `<a href="${href}" target="_blank" rel="noopener noreferrer">${linkText || bareUrl}</a>`;
  });
  src = src.replace(/\n/g, '<br>');
  src = src.replace(/(\d+)/g, (_, i) => blocks[i]);
  return src;
}

/* ============ Multi-Chat (Gemini-style sessions) ============ */

function getCurrentChat() {
  return App.chats.find(c => c.id === App.currentChatId) || null;
}

// Persist all chats + which one is active.
function saveChats() {
  try {
    const cur = getCurrentChat();
    if (cur) { cur.messages = App.chatHistory; cur.updatedAt = Date.now(); }
    localStorage.setItem(userKey('chats'), JSON.stringify(App.chats.slice(-50)));
    localStorage.setItem(userKey('currentChatId'), App.currentChatId || '');
  } catch(e) {}
}
// Called after each reply — keep the name the chat flow already uses.
function saveChatHistory() {
  const cur = getCurrentChat();
  if (cur && (!cur.title || cur.title === 'New chat')) {
    const firstUser = App.chatHistory.find(m => m.role === 'user');
    if (firstUser) cur.title = msgText(firstUser.content).slice(0, 40).trim() || 'New chat';
  }
  saveChats();
  renderChatList();
}

function loadChats() {
  try {
    const raw = localStorage.getItem(userKey('chats'));
    if (raw) {
      App.chats = JSON.parse(raw) || [];
    }
    // migrate the old single-history store into the first chat
    if (!App.chats.length) {
      let legacy = [];
      try { legacy = JSON.parse(localStorage.getItem(userKey('chat'))) || []; } catch(e) {}
      App.chats = [{ id: 'c' + Date.now(), title: titleFromMessages(legacy), messages: legacy, updatedAt: Date.now() }];
    }
    App.currentChatId = localStorage.getItem(userKey('currentChatId')) || App.chats[App.chats.length - 1].id;
    if (!getCurrentChat()) App.currentChatId = App.chats[App.chats.length - 1].id;
  } catch(e) {
    App.chats = [{ id: 'c' + Date.now(), title: 'New chat', messages: [], updatedAt: Date.now() }];
    App.currentChatId = App.chats[0].id;
  }
  App.chatHistory = getCurrentChat().messages;
  renderActiveChat();
  renderChatList();
}

// Message content can be a plain string or an OpenAI-style parts array
// (text + image_url) when an image is attached. This extracts just the text.
function msgText(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) return content.filter(p => p.type === 'text').map(p => p.text).join(' ');
  return '';
}
function msgImages(content) {
  if (!Array.isArray(content)) return [];
  return content.filter(p => p.type === 'image_url').map(p => p.image_url?.url).filter(Boolean);
}

function titleFromMessages(msgs) {
  const u = (msgs || []).find(m => m.role === 'user');
  return u ? msgText(u.content).slice(0, 40).trim() || 'New chat' : 'New chat';
}

/* ============ Sync & Backup (cross-device, via Worker + KV) ============ */

function syncToken() { return localStorage.getItem(userKey('syncToken')) || ''; }

function showSyncCode() {
  const codeBox = document.getElementById('sync-code-box');
  const token = syncToken();
  if (codeBox) {
    codeBox.style.display = token ? '' : 'none';
    codeBox.textContent = token ? `SYNC CODE · ${token}` : '';
  }
}

function setupSyncPanel() {
  const pushBtn = document.getElementById('sync-push-btn');
  const pullBtn = document.getElementById('sync-pull-btn');
  const codeInput = document.getElementById('sync-code-input');
  const status = document.getElementById('sync-status');
  const setStatus = (t) => { if (status) status.textContent = t; };

  if (pushBtn) pushBtn.addEventListener('click', async () => {
    if (!App.currentUser) { setStatus('Sign in first.'); return; }
    let token = syncToken();
    if (!token) {
      token = Math.random().toString(36).slice(2, 10).toUpperCase();
      localStorage.setItem(userKey('syncToken'), token);
    }
    setStatus('Backing up…');
    try {
      const r = await fetch(`${VOID_CORE_API.url}/sync/put`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: App.currentUser, token,
          data: { settings: App.settings, chats: App.chats, tasks: App.tasks, commands: App.commands, gems: App.gems },
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok && d.ok) { showSyncCode(); setStatus('Backed up ✓ — save the sync code above, you need it to restore.'); }
      else setStatus(d.error || 'Backup failed — the Worker may need redeploying.');
    } catch (_) { setStatus('Network error.'); }
  });

  if (pullBtn) pullBtn.addEventListener('click', async () => {
    if (!App.currentUser) { setStatus('Sign in first.'); return; }
    const token = (codeInput?.value || '').trim().toUpperCase();
    if (token.length < 6) { setStatus('Enter your sync code first.'); return; }
    setStatus('Restoring…');
    try {
      const r = await fetch(`${VOID_CORE_API.url}/sync/get?email=${encodeURIComponent(App.currentUser)}&token=${encodeURIComponent(token)}`);
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setStatus(d.error || 'Restore failed.'); return; }
      if (!d.data) { setStatus('No backup found for this account.'); return; }
      localStorage.setItem(userKey('syncToken'), token);
      if (d.data.settings) { App.settings = { ...App.settings, ...d.data.settings }; saveSettings(); }
      if (Array.isArray(d.data.chats)) {
        localStorage.setItem(userKey('chats'), JSON.stringify(d.data.chats.slice(-50)));
        const last = d.data.chats[d.data.chats.length - 1];
        if (last) localStorage.setItem(userKey('currentChatId'), last.id);
      }
      if (Array.isArray(d.data.tasks)) { App.tasks = d.data.tasks; saveTasks(); }
      if (Array.isArray(d.data.commands)) { App.commands = d.data.commands; saveCommands(); }
      if (Array.isArray(d.data.gems)) { App.gems = d.data.gems; saveGems(); }
      setStatus('Restored ✓ — reloading…');
      setTimeout(() => location.reload(), 700);
    } catch (_) { setStatus('Network error.'); }
  });
}

/* Chat options dropdown (the header's three-dot menu) */
function setupChatMenu() {
  const btn = document.getElementById('chat-menu-btn');
  const menu = document.getElementById('chat-menu');
  if (!btn || !menu) return;

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.classList.toggle('open');
  });
  document.addEventListener('click', () => menu.classList.remove('open'));
  menu.addEventListener('click', (e) => e.stopPropagation());

  const chatAsText = () => {
    const chat = getCurrentChat();
    let out = `${chat?.title || 'VOID Chat'}\n\n`;
    App.chatHistory.forEach(m => { out += `${m.role === 'user' ? 'You' : 'VOID'}: ${msgText(m.content)}\n\n`; });
    return out.trim();
  };

  menu.querySelectorAll('.persona-item').forEach(row => {
    row.addEventListener('click', async () => {
      menu.classList.remove('open');
      const act = row.dataset.chatmenu;
      if (act === 'export') {
        exportCurrentChat();
      } else if (act === 'share') {
        if (!App.chatHistory.length) return;
        const text = chatAsText();
        if (navigator.share) { try { await navigator.share({ title: getCurrentChat()?.title || 'VOID Chat', text }); } catch (_) {} }
        else { navigator.clipboard?.writeText(text).catch(() => {}); appendMessage('system', '📋 Conversation copied — paste it anywhere to share.'); }
      } else if (act === 'copy') {
        if (!App.chatHistory.length) return;
        navigator.clipboard?.writeText(chatAsText()).catch(() => {});
        appendMessage('system', '📋 Conversation copied.');
      } else if (act === 'rename') {
        const chat = getCurrentChat();
        if (!chat) return;
        const name = prompt('Rename chat', chat.title || 'New chat');
        if (name && name.trim()) { chat.title = name.trim().slice(0, 60); saveChats(); renderChatList(); }
      } else if (act === 'delete') {
        const chat = getCurrentChat();
        if (!chat) return;
        if (confirm('Delete this chat? This can\'t be undone.')) deleteChat(chat.id);
      }
    });
  });
}

function exportCurrentChat() {
  if (!App.chatHistory.length) return;
  const chat = getCurrentChat();
  const title = chat?.title || 'VOID Chat';
  let md = `# ${title}\n\n`;
  App.chatHistory.forEach(m => {
    md += `**${m.role === 'user' ? 'You' : 'VOID'}:**\n${msgText(m.content)}\n\n`;
  });
  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/[^a-z0-9]+/gi, '-').slice(0, 40) || 'void-chat'}.md`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* ============ Documents: create / edit / export (.txt, Word, .pdf) ============ */

function loadDocuments() {
  try { App.documents = JSON.parse(localStorage.getItem(userKey('documents'))) || []; } catch (_) { App.documents = []; }
}
function saveDocuments() {
  try { localStorage.setItem(userKey('documents'), JSON.stringify(App.documents.slice(-60))); } catch (_) {}
}

function loadGems() {
  try { App.gems = JSON.parse(localStorage.getItem(userKey('gems'))) || []; } catch (_) { App.gems = []; }
}
function saveGems() {
  try { localStorage.setItem(userKey('gems'), JSON.stringify(App.gems.slice(-40))); } catch (_) {}
}

// Save a Blob or string to the user's device using the same anchor-download
// path the existing chat/image export uses (works in PWA + Android WebView).
function saveFileBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function safeFileName(title) {
  return (title || 'document').replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 50) || 'document';
}

// --- Word (.doc): an HTML document with Office namespaces. Word, Google Docs
// and LibreOffice all open this reliably, with no zip library needed. ---
function buildWordDoc(title, body) {
  const esc = s => escapeHTML(s);
  const paras = String(body).replace(/\r/g, '').split('\n')
    .map(line => line.trim() === '' ? '<p>&nbsp;</p>' : `<p>${esc(line)}</p>`).join('');
  return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>${esc(title)}</title>
<style>body{font-family:Calibri,Arial,sans-serif;font-size:11pt;line-height:1.5;} h1{font-size:18pt;} p{margin:0 0 10pt 0;}</style></head>
<body><h1>${esc(title)}</h1>${paras}</body></html>`;
}

// --- PDF: dependency-free multi-page text generator (validated separately). ---
function pdfEscape(s) { return s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)'); }
function pdfWrapLine(text, maxChars) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    if (w.length > maxChars) {
      if (cur) { lines.push(cur); cur = ''; }
      for (let i = 0; i < w.length; i += maxChars) lines.push(w.slice(i, i + maxChars));
      continue;
    }
    if ((cur + (cur ? ' ' : '') + w).length > maxChars) { if (cur) lines.push(cur); cur = w; }
    else { cur += (cur ? ' ' : '') + w; }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [''];
}
function buildPdf(title, body) {
  const PAGE_W = 612, PAGE_H = 792, MARGIN = 54, FONT = 11, LINE = 15, TITLE_FONT = 18;
  const usableW = PAGE_W - MARGIN * 2;
  const maxChars = Math.floor(usableW / (FONT * 0.5));
  const titleMaxChars = Math.floor(usableW / (TITLE_FONT * 0.5));
  const rendered = [];
  if (title) { for (const l of pdfWrapLine(title, titleMaxChars)) rendered.push({ text: l, size: TITLE_FONT }); rendered.push({ text: '', size: FONT }); }
  for (const p of String(body).replace(/\r/g, '').split('\n')) {
    if (p === '') { rendered.push({ text: '', size: FONT }); continue; }
    for (const l of pdfWrapLine(p, maxChars)) rendered.push({ text: l, size: FONT });
  }
  const linesPerPage = Math.floor((PAGE_H - MARGIN * 2) / LINE);
  const pages = [];
  for (let i = 0; i < rendered.length; i += linesPerPage) pages.push(rendered.slice(i, i + linesPerPage));
  if (!pages.length) pages.push([{ text: '', size: FONT }]);

  const catalogNum = 1, pagesNum = 2, fontNum = 3;
  const pageObjNums = [], contentObjNums = [];
  let nextNum = 4;
  for (let i = 0; i < pages.length; i++) { pageObjNums.push(nextNum++); contentObjNums.push(nextNum++); }
  const objDefs = {};
  objDefs[catalogNum] = `<< /Type /Catalog /Pages ${pagesNum} 0 R >>`;
  objDefs[pagesNum] = `<< /Type /Pages /Kids [${pageObjNums.map(n => `${n} 0 R`).join(' ')}] /Count ${pages.length} >>`;
  objDefs[fontNum] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`;
  pages.forEach((pageLines, idx) => {
    const pageNum = pageObjNums[idx], contentNum = contentObjNums[idx];
    objDefs[pageNum] = `<< /Type /Page /Parent ${pagesNum} 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 ${fontNum} 0 R >> >> /Contents ${contentNum} 0 R >>`;
    let stream = 'BT\n', curSize = FONT, first = true;
    stream += `/F1 ${FONT} Tf\n1 0 0 1 ${MARGIN} ${PAGE_H - MARGIN} Tm\n`;
    for (const ln of pageLines) {
      if (ln.size !== curSize) { stream += `/F1 ${ln.size} Tf\n`; curSize = ln.size; }
      if (first) first = false; else stream += `0 -${LINE} Td\n`;
      stream += `(${pdfEscape(ln.text)}) Tj\n`;
    }
    stream += 'ET';
    objDefs[contentNum] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
  });
  const totalObjs = nextNum - 1;
  let pdf = '%PDF-1.4\n';
  const offsets = [];
  for (let n = 1; n <= totalObjs; n++) { offsets[n] = pdf.length; pdf += `${n} 0 obj\n${objDefs[n]}\nendobj\n`; }
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${totalObjs + 1}\n0000000000 65535 f \n`;
  for (let n = 1; n <= totalObjs; n++) pdf += `${String(offsets[n]).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${totalObjs + 1} /Root ${catalogNum} 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return pdf;
}

function exportDocument(title, content, fmt) {
  const name = safeFileName(title);
  buzz();
  if (fmt === 'txt') {
    saveFileBlob(new Blob([`${title}\n\n${content}`], { type: 'text/plain;charset=utf-8' }), `${name}.txt`);
  } else if (fmt === 'doc') {
    saveFileBlob(new Blob([buildWordDoc(title, content)], { type: 'application/msword' }), `${name}.doc`);
  } else if (fmt === 'pdf') {
    // Build as a binary-safe byte array so the PDF isn't corrupted by UTF-8 re-encoding.
    const raw = buildPdf(title, content);
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i) & 0xff;
    saveFileBlob(new Blob([bytes], { type: 'application/pdf' }), `${name}.pdf`);
  }
}

// The format picker is shared: whatever set pendingDocExport gets exported when
// the user taps a format. Anchored near the tapped element.
let pendingDocExport = null;
function openDocFormatPicker(title, content, anchorEl) {
  pendingDocExport = { title, content };
  const picker = document.getElementById('doc-format-picker');
  if (!picker) return;
  // Hoist to <body> so it's never trapped inside an inactive view's stacking
  // context (it lives next to a settings panel in the markup).
  if (picker.parentElement !== document.body) document.body.appendChild(picker);
  picker.classList.add('open');
  if (anchorEl) {
    const r = anchorEl.getBoundingClientRect();
    picker.style.position = 'fixed';
    picker.style.left = Math.max(12, Math.min(window.innerWidth - 232, r.left)) + 'px';
    const below = r.bottom + 150 < window.innerHeight;
    picker.style.top = below ? (r.bottom + 6) + 'px' : '';
    picker.style.bottom = below ? '' : (window.innerHeight - r.top + 6) + 'px';
  }
}
function setupDocFormatPicker() {
  const picker = document.getElementById('doc-format-picker');
  if (!picker) return;
  picker.querySelectorAll('.persona-item').forEach(row => {
    row.addEventListener('click', (e) => {
      e.stopPropagation();
      picker.classList.remove('open');
      if (pendingDocExport) exportDocument(pendingDocExport.title, pendingDocExport.content, row.dataset.docfmt);
    });
  });
  document.addEventListener('click', () => picker.classList.remove('open'));
  picker.addEventListener('click', (e) => e.stopPropagation());
}

// Persist a document to the per-account store (dedupes by title, newest first).
function storeDocument(title, content) {
  const existing = App.documents.find(d => d.title === title);
  if (existing) { existing.content = content; existing.updatedAt = Date.now(); }
  else App.documents.unshift({ id: 'doc-' + Date.now(), title, content, createdAt: Date.now(), updatedAt: Date.now() });
  saveDocuments();
  renderDocumentsList();
}

// Ask the AI to write a document from a short description.
async function generateDocument(request) {
  const reply = await quickAI(
    'You are a professional document writer. Write a complete, well-structured, ready-to-use document based on the user\'s request. ' +
    'Start with a single title line, then the body. Use plain text with clear paragraphs and line breaks — no markdown symbols like # or **. Do not add commentary before or after the document.',
    request);
  if (!reply) return null;
  const lines = reply.trim().split('\n');
  const title = (lines[0] || 'Document').replace(/^#+\s*/, '').trim().slice(0, 80) || 'Document';
  const content = lines.slice(1).join('\n').trim() || reply.trim();
  return { title, content };
}

/* ============ Deep Research (Gemini-style) ============
   Plans sub-questions, gathers real facts from free sources per question,
   then synthesizes a structured, sourced report. */

// Best-effort keyless lookup for one research question.
async function researchLookup(q) {
  try {
    const s = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&format=json&origin=*&srlimit=1`);
    if (s.ok) {
      const sd = await s.json();
      const hit = sd.query?.search?.[0];
      if (hit) {
        const sum = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(hit.title.replace(/ /g, '_'))}`);
        if (sum.ok) {
          const d = await sum.json();
          if (d.extract) return { text: d.extract, source: { label: 'Wikipedia: ' + hit.title, url: d.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(hit.title.replace(/ /g, '_'))}` } };
        }
      }
    }
  } catch (_) {}
  try {
    const r = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1&skip_disambig=1`);
    if (r.ok) {
      const d = await r.json();
      const t = d.AbstractText || d.Answer || (d.RelatedTopics || []).map(x => x.Text).filter(Boolean).slice(0, 2).join(' | ');
      if (t) {
        let source = null;
        if (d.AbstractURL) { try { source = { label: new URL(d.AbstractURL).hostname.replace(/^www\./, ''), url: d.AbstractURL }; } catch (_) {} }
        return { text: t, source };
      }
    }
  } catch (_) {}
  return { text: '', source: null };
}

// Live-updating progress bubble for the research run.
function showResearchProgress(topic) {
  const box = document.getElementById('messages-box');
  if (!box) return { update() {}, remove() {} };
  const welcome = box.querySelector('.matrix-welcome');
  if (welcome) welcome.remove();
  clearFollowupChips();
  const el = document.createElement('div');
  el.className = 'chat-bubble assistant';
  el.innerHTML = `<div class="bubble-meta">VOID // RESEARCH</div>
    <div class="bubble-body bubble-ai"><div class="research-progress">
      <div class="research-title">🔬 Researching: ${escapeHTML(topic.slice(0, 80))}</div>
      <div class="research-status"><span class="typing-dots"><span></span><span></span><span></span></span> <span class="research-step">Planning…</span></div>
    </div></div>`;
  box.appendChild(el);
  box.scrollTop = box.scrollHeight;
  return {
    update(txt) { const s = el.querySelector('.research-step'); if (s) s.textContent = txt; box.scrollTop = box.scrollHeight; },
    remove() { el.remove(); },
  };
}

let researchInFlight = false;
async function runDeepResearch(topic) {
  if (researchInFlight) { appendMessage('system', 'A research task is already running — one moment.'); return; }
  researchInFlight = true;
  const prog = showResearchProgress(topic);
  try {
    // 1) Plan sub-questions
    const planRaw = await quickAI(
      'Break this research topic into 4 focused, distinct sub-questions that together give a thorough understanding. Reply with ONLY the questions, one per line, no numbering or extra text.',
      topic);
    let questions = (planRaw || '').split('\n').map(q => q.trim().replace(/^[-*\d.)\s]+/, '')).filter(q => q.length > 6).slice(0, 4);
    if (!questions.length) questions = [topic];

    // 2) Gather findings per question
    const findings = [];
    const sources = [];
    for (let i = 0; i < questions.length; i++) {
      prog.update(`Researching angle ${i + 1} of ${questions.length}…`);
      const r = await researchLookup(questions[i]);
      findings.push(`Q: ${questions[i]}\nFindings: ${r.text || '(no external source found — rely on general knowledge)'}`);
      if (r.source && !sources.some(s => s.url === r.source.url)) sources.push(r.source);
    }

    // 3) Synthesize a structured report
    prog.update('Writing the report…');
    const report = await quickAI(
      'You are a research analyst. Using the research findings provided, write a clear, structured report on the topic. ' +
      'Start with a one-line title, then a short intro, then 3–5 sections each with a short heading line, then a brief conclusion. ' +
      'Plain text only — no markdown symbols like # or **. Be factual; where findings were thin, use well-established general knowledge but stay accurate.',
      `TOPIC: ${topic}\n\n${findings.join('\n\n')}`);
    prog.remove();

    if (!report) { appendMessage('system', 'Research failed — please try again.'); return; }
    const lines = report.trim().split('\n');
    const title = (lines[0] || `Research: ${topic}`).replace(/^#+\s*/, '').trim().slice(0, 90);
    const body = lines.slice(1).join('\n').trim() || report.trim();
    storeDocument(title, body);
    showDocumentMessage(title, body);
    if (sources.length) {
      const el = appendMessage('system', `📚 Based on ${sources.length} source${sources.length > 1 ? 's' : ''}:`, null, sources);
    }
  } catch (_) {
    prog.remove();
    appendMessage('system', 'Research failed — please try again.');
  } finally {
    researchInFlight = false;
  }
}

function renderDocumentsList() {
  const list = document.getElementById('documents-list');
  const empty = document.getElementById('documents-empty');
  if (!list) return;
  if (empty) empty.style.display = App.documents.length ? 'none' : '';
  list.innerHTML = App.documents.map(d => `
    <div class="doc-item" data-doc-id="${d.id}">
      <div class="doc-item-title">${escapeHTML(d.title)}</div>
      <div class="doc-item-preview">${escapeHTML(d.content.slice(0, 100))}${d.content.length > 100 ? '…' : ''}</div>
      <div class="doc-item-actions">
        <button class="doc-mini-btn" data-doc-act="export" data-doc-id="${d.id}">⬇ Export</button>
        <button class="doc-mini-btn" data-doc-act="edit" data-doc-id="${d.id}">✎ Edit</button>
        <button class="doc-mini-btn danger" data-doc-act="del" data-doc-id="${d.id}">✕</button>
      </div>
    </div>`).join('');
  list.querySelectorAll('[data-doc-act]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const doc = App.documents.find(d => d.id === btn.dataset.docId);
      if (!doc) return;
      const act = btn.dataset.docAct;
      if (act === 'export') {
        openDocFormatPicker(doc.title, doc.content, btn);
      } else if (act === 'del') {
        App.documents = App.documents.filter(d => d.id !== doc.id);
        saveDocuments();
        renderDocumentsList();
      } else if (act === 'edit') {
        // Send the user back to chat with a prefilled edit request referencing this doc.
        closeSettingsPanel();
        document.getElementById('view-settings')?.classList.remove('active');
        document.getElementById('view-main')?.classList.add('active');
        const input = document.getElementById('chat-input');
        if (input) {
          App.editingDoc = doc;
          input.value = `/editdoc `;
          input.focus();
          appendMessage('system', `✎ Editing "${doc.title}". Type what to change after /editdoc (e.g. "/editdoc make it shorter and more formal").`);
          updateSendMicBtn();
        }
      }
    });
  });
}

// A chat bubble presenting a generated/edited document with an export button.
function showDocumentMessage(title, content) {
  const box = document.getElementById('messages-box');
  if (!box) return;
  const welcome = box.querySelector('.matrix-welcome');
  if (welcome) welcome.remove();
  clearFollowupChips();
  App.msgCount++;
  updateWelcomeStatsLine();
  const time = new Date().toLocaleTimeString('en-US', { hour12: false });
  const el = document.createElement('div');
  el.className = 'chat-bubble assistant';
  el.innerHTML = `
    <div class="bubble-meta">VOID // ${time}</div>
    <div class="bubble-body bubble-ai">
      <div class="doc-card">
        <div class="doc-card-head">
          <span class="doc-card-icon">📄</span>
          <span class="doc-card-title">${escapeHTML(title)}</span>
        </div>
        <div class="doc-card-body">${escapeHTML(content.slice(0, 500))}${content.length > 500 ? '…' : ''}</div>
        <div class="doc-card-btns">
          <button class="doc-card-save" type="button">⬇ Save as file</button>
          <button class="doc-card-gh" type="button">🐙 Push to GitHub</button>
        </div>
      </div>
    </div>`;
  el.querySelector('.doc-card-save').addEventListener('click', (e) => {
    e.stopPropagation();
    openDocFormatPicker(title, content, e.currentTarget);
  });
  el.querySelector('.doc-card-gh').addEventListener('click', (e) => {
    e.stopPropagation();
    openGitHubPush(content, safeFileName(title) + '.txt');
  });
  box.appendChild(el);
  box.scrollTop = box.scrollHeight;
}

// A confirm card in chat — used before any GitHub action that changes the
// user's account (create repo / commit), so a misread never acts silently.
function showGitHubConfirm(title, detail, confirmLabel, onConfirm) {
  const box = document.getElementById('messages-box');
  if (!box) return;
  clearFollowupChips();
  App.msgCount++;
  updateWelcomeStatsLine();
  const time = new Date().toLocaleTimeString('en-US', { hour12: false });
  const el = document.createElement('div');
  el.className = 'chat-bubble assistant';
  el.innerHTML = `
    <div class="bubble-meta">VOID // ${time}</div>
    <div class="bubble-body bubble-ai">
      <div class="doc-card gh-confirm">
        <div class="doc-card-head"><span class="doc-card-icon">🐙</span><span class="doc-card-title">${escapeHTML(title)}</span></div>
        <div class="doc-card-body" style="-webkit-mask-image:none;mask-image:none;max-height:none;">${escapeHTML(detail)}</div>
        <div class="doc-card-btns">
          <button class="doc-card-save gh-confirm-yes" type="button">${escapeHTML(confirmLabel)}</button>
          <button class="doc-card-gh gh-confirm-no" type="button">Cancel</button>
        </div>
      </div>
    </div>`;
  const yes = el.querySelector('.gh-confirm-yes');
  const no = el.querySelector('.gh-confirm-no');
  const disable = () => { yes.disabled = true; no.disabled = true; };
  yes.addEventListener('click', async (e) => {
    e.stopPropagation();
    disable(); yes.textContent = 'Working…';
    try { await onConfirm(); yes.textContent = '✅ Done'; }
    catch (err) { yes.textContent = confirmLabel; yes.disabled = false; no.disabled = false; appendMessage('system', `GitHub error: ${err.message}`); }
  });
  no.addEventListener('click', (e) => { e.stopPropagation(); disable(); no.textContent = 'Cancelled'; });
  box.appendChild(el);
  box.scrollTop = box.scrollHeight;
}

// Route a classified GitHub intent — read-only actions run immediately,
// account-changing ones go through a confirm card first.
async function handleGitHubIntent(gh) {
  if (gh.action === 'list') {
    const typingId = appendTyping();
    try {
      const repos = await ghListRepos();
      removeTyping(typingId);
      appendMessage('system', repos.length ? '📦 **Your repos**\n' + repos.slice(0, 25).map(r => `• ${r.full_name}${r.private ? ' 🔒' : ''}`).join('\n') : 'No repositories found.');
    } catch (e) { removeTyping(typingId); appendMessage('system', `GitHub error: ${e.message}`); }
    return;
  }
  if (gh.action === 'create_repo') {
    if (!gh.name) { appendMessage('system', 'What should the repository be called?'); return; }
    showGitHubConfirm('Create repository', `Create a new private repo "${gh.name}" on your GitHub account?`, 'Create repo', async () => {
      const repo = await ghCreateRepo(gh.name, true);
      appendMessage('system', `✅ Created **${repo.full_name}** → ${repo.html_url}`);
      ghListRepos().catch(() => {});
    });
    return;
  }
  if (gh.action === 'scaffold') {
    if (!gh.repo || !gh.repo.includes('/')) { appendMessage('system', 'Which repo should I build it into? e.g. "scaffold a todo api in my-repo".'); return; }
    const [owner, repo] = gh.repo.split('/');
    const typingId = appendTyping();
    try {
      const reply = await quickAI(
        'You are a senior engineer scaffolding a project. Output a complete working multi-file project. ' +
        'Format EXACTLY as repeated blocks: a line "=== relative/path/file.ext ===" then that file\'s full contents. ' +
        'No commentary, no markdown fences. Include a README.md. Keep to the essential files (3–8).',
        gh.desc);
      removeTyping(typingId);
      const files = parseMultiFile(reply || '');
      if (!files.length) { appendMessage('system', 'Could not scaffold that — try rephrasing.'); return; }
      // The project card already confirms via its "Commit N files" button.
      showProjectMessage(owner, repo, files);
    } catch (e) { removeTyping(typingId); appendMessage('system', `Error: ${e.message}`); }
    return;
  }
  if (gh.action === 'push') {
    if (!gh.repo || !gh.repo.includes('/') || !gh.path) { appendMessage('system', 'Which repo and file path should I commit to?'); return; }
    const lastAssistant = [...App.chatHistory].reverse().find(m => m.role === 'assistant');
    const content = lastAssistant ? msgText(lastAssistant.content) : '';
    if (!content) { appendMessage('system', 'There is no recent reply to commit yet.'); return; }
    const [owner, repo] = gh.repo.split('/');
    showGitHubConfirm('Commit file', `Commit my last reply to ${owner}/${repo} → ${gh.path}?`, 'Commit', async () => {
      const res = await ghPutFile(owner, repo, gh.path, content, `Add ${gh.path} via VOID`);
      appendMessage('system', `✅ Committed to **${owner}/${repo}** → ${res.content?.html_url || gh.path}`);
    });
    return;
  }
}

// A project card listing generated files, with one atomic "commit all" action.
let pendingProject = null;
function showProjectMessage(owner, repo, files) {
  const box = document.getElementById('messages-box');
  if (!box) return;
  const welcome = box.querySelector('.matrix-welcome');
  if (welcome) welcome.remove();
  clearFollowupChips();
  App.msgCount++;
  updateWelcomeStatsLine();
  const time = new Date().toLocaleTimeString('en-US', { hour12: false });
  const el = document.createElement('div');
  el.className = 'chat-bubble assistant';
  el.innerHTML = `
    <div class="bubble-meta">VOID // ${time}</div>
    <div class="bubble-body bubble-ai">
      <div class="doc-card">
        <div class="doc-card-head">
          <span class="doc-card-icon">📦</span>
          <span class="doc-card-title">${escapeHTML(owner + '/' + repo)} · ${files.length} file${files.length > 1 ? 's' : ''}</span>
        </div>
        <div class="proj-file-list">${files.map(f => `<div class="proj-file">📄 ${escapeHTML(f.path)}</div>`).join('')}</div>
        <div class="doc-card-btns">
          <button class="doc-card-save proj-commit-btn" type="button">🚀 Commit ${files.length} file${files.length > 1 ? 's' : ''}</button>
        </div>
      </div>
    </div>`;
  const commitBtn = el.querySelector('.proj-commit-btn');
  commitBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    commitBtn.disabled = true; commitBtn.textContent = 'Committing…';
    try {
      const res = await ghCommitFiles(owner, repo, files, 'Scaffold project via VOID');
      commitBtn.textContent = '✅ Committed';
      appendMessage('system', `✅ Committed ${files.length} files to **${owner}/${repo}** → ${res.url}`);
      pendingProject = null;
    } catch (err) {
      commitBtn.disabled = false; commitBtn.textContent = `🚀 Commit ${files.length} files`;
      appendMessage('system', `GitHub error: ${err.message}`);
    }
  });
  box.appendChild(el);
  box.scrollTop = box.scrollHeight;
}

// A code-file card for a GitHub file that's been opened (or just edited).
function showGitHubFileMessage(file, wasEdited) {
  const box = document.getElementById('messages-box');
  if (!box) return;
  const welcome = box.querySelector('.matrix-welcome');
  if (welcome) welcome.remove();
  clearFollowupChips();
  App.msgCount++;
  updateWelcomeStatsLine();
  const time = new Date().toLocaleTimeString('en-US', { hour12: false });
  const el = document.createElement('div');
  el.className = 'chat-bubble assistant';
  el.innerHTML = `
    <div class="bubble-meta">VOID // ${time}</div>
    <div class="bubble-body bubble-ai">
      <div class="doc-card">
        <div class="doc-card-head">
          <span class="doc-card-icon">${wasEdited ? '✏️' : '📂'}</span>
          <span class="doc-card-title">${escapeHTML(file.owner + '/' + file.repo)} · ${escapeHTML(file.path)}</span>
        </div>
        <pre class="gh-file-body">${escapeHTML(file.content.slice(0, 900))}${file.content.length > 900 ? '\n…' : ''}</pre>
        <div class="doc-card-btns">
          ${wasEdited
            ? `<button class="doc-card-save gh-commit-btn" type="button">✅ Commit changes</button>`
            : `<button class="doc-card-save gh-edithint-btn" type="button">✏️ Edit with VOID</button>`}
          <button class="doc-card-gh gh-download-btn" type="button">⬇ Save locally</button>
        </div>
      </div>
    </div>`;
  const commitBtn = el.querySelector('.gh-commit-btn');
  if (commitBtn) commitBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    commitBtn.disabled = true; commitBtn.textContent = 'Committing…';
    try {
      const res = await ghPutFile(file.owner, file.repo, file.path, file.content, `Update ${file.path} via VOID`);
      if (res.content?.sha && App.githubFile) App.githubFile.sha = res.content.sha;
      commitBtn.textContent = '✅ Committed';
      appendMessage('system', `✅ Committed to **${file.owner}/${file.repo}** → ${res.content?.html_url || file.path}`);
    } catch (err) {
      commitBtn.disabled = false; commitBtn.textContent = '✅ Commit changes';
      appendMessage('system', `GitHub error: ${err.message}`);
    }
  });
  const editHint = el.querySelector('.gh-edithint-btn');
  if (editHint) editHint.addEventListener('click', (e) => {
    e.stopPropagation();
    const input = document.getElementById('chat-input');
    if (input) { input.value = '/gh edit '; input.focus(); updateSendMicBtn(); }
  });
  const dl = el.querySelector('.gh-download-btn');
  if (dl) dl.addEventListener('click', (e) => {
    e.stopPropagation();
    saveFileBlob(new Blob([file.content], { type: 'text/plain;charset=utf-8' }), file.path.split('/').pop() || 'file.txt');
  });
  box.appendChild(el);
  box.scrollTop = box.scrollHeight;
}

function setupDocumentsPanel() {
  const btn = document.getElementById('doc-create-btn');
  const input = document.getElementById('doc-create-input');
  if (btn && input) {
    btn.addEventListener('click', async () => {
      const req = input.value.trim();
      if (!req) return;
      btn.disabled = true;
      btn.textContent = 'Writing…';
      try {
        const doc = await generateDocument(req);
        if (doc) {
          storeDocument(doc.title, doc.content);
          input.value = '';
          openDocFormatPicker(doc.title, doc.content, btn);
        } else {
          alert('Could not generate the document — try again.');
        }
      } finally {
        btn.disabled = false;
        btn.textContent = 'Generate document';
      }
    });
  }
  renderDocumentsList();
}

/* ============ Gems: user-created custom assistants ============ */

let editingGemId = null;

function renderGemsList() {
  const list = document.getElementById('gems-list');
  const empty = document.getElementById('gems-empty');
  if (!list) return;
  if (empty) empty.style.display = App.gems.length ? 'none' : '';
  list.innerHTML = App.gems.map(g => `
    <div class="doc-item" data-gem-id="${g.id}">
      <div class="doc-item-title">${g.emoji || '✦'} ${escapeHTML(g.name)}${App.settings.persona === g.id ? ' <span style="color:var(--accent);font-size:11px;">• active</span>' : ''}</div>
      <div class="doc-item-preview">${escapeHTML(g.instructions.slice(0, 110))}${g.instructions.length > 110 ? '…' : ''}</div>
      <div class="doc-item-actions">
        <button class="doc-mini-btn" data-gem-act="use" data-gem-id="${g.id}">${App.settings.persona === g.id ? '✓ Using' : 'Use'}</button>
        <button class="doc-mini-btn" data-gem-act="edit" data-gem-id="${g.id}">✎ Edit</button>
        <button class="doc-mini-btn danger" data-gem-act="del" data-gem-id="${g.id}">✕</button>
      </div>
    </div>`).join('');
  list.querySelectorAll('[data-gem-act]').forEach(b => {
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      const gem = App.gems.find(g => g.id === b.dataset.gemId);
      if (!gem) return;
      const act = b.dataset.gemAct;
      if (act === 'use') {
        App.settings.persona = (App.settings.persona === gem.id) ? '' : gem.id;
        saveSettings(); syncPersonaBadge(); renderGemsList();
      } else if (act === 'edit') {
        startEditGem(gem);
      } else if (act === 'del') {
        App.gems = App.gems.filter(g => g.id !== gem.id);
        if (App.settings.persona === gem.id) { App.settings.persona = ''; saveSettings(); syncPersonaBadge(); }
        saveGems(); renderGemsList();
      }
    });
  });
}

function startEditGem(gem) {
  editingGemId = gem.id;
  const emoji = document.getElementById('gem-emoji-input');
  const name = document.getElementById('gem-name-input');
  const instr = document.getElementById('gem-instructions-input');
  const label = document.getElementById('gem-form-label');
  const cancel = document.getElementById('gem-cancel-btn');
  const save = document.getElementById('gem-save-btn');
  if (emoji) emoji.value = gem.emoji || '';
  if (name) name.value = gem.name;
  if (instr) instr.value = gem.instructions;
  if (label) label.textContent = 'EDIT GEM';
  if (cancel) cancel.style.display = '';
  if (save) save.textContent = 'Update Gem';
  document.querySelector('#panel-gems .panel-content')?.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetGemForm() {
  editingGemId = null;
  ['gem-emoji-input', 'gem-name-input', 'gem-instructions-input'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  const label = document.getElementById('gem-form-label');
  const cancel = document.getElementById('gem-cancel-btn');
  const save = document.getElementById('gem-save-btn');
  if (label) label.textContent = 'CREATE A GEM';
  if (cancel) cancel.style.display = 'none';
  if (save) save.textContent = 'Save Gem';
}

function setupGemsPanel() {
  const save = document.getElementById('gem-save-btn');
  const cancel = document.getElementById('gem-cancel-btn');
  if (save) save.addEventListener('click', () => {
    const emoji = (document.getElementById('gem-emoji-input')?.value || '').trim();
    const name = (document.getElementById('gem-name-input')?.value || '').trim();
    const instructions = (document.getElementById('gem-instructions-input')?.value || '').trim();
    if (!name || !instructions) { alert('Give your Gem a name and instructions.'); return; }
    if (editingGemId) {
      const gem = App.gems.find(g => g.id === editingGemId);
      if (gem) { gem.emoji = emoji; gem.name = name; gem.instructions = instructions; }
    } else {
      App.gems.unshift({ id: 'gem:' + Date.now(), emoji, name, instructions });
    }
    saveGems();
    if (App.settings.persona && App.settings.persona.startsWith('gem:')) syncPersonaBadge();
    resetGemForm();
    renderGemsList();
  });
  if (cancel) cancel.addEventListener('click', resetGemForm);
  renderGemsList();
}

/* ============ GitHub: connect, create repos, commit files ============
   Uses the user's own Personal Access Token, kept only in this device's
   localStorage (never synced, never in code). All calls go straight from
   the browser to api.github.com. */

function loadGitHub() {
  try { App.githubToken = localStorage.getItem(userKey('githubToken')) || ''; } catch (_) { App.githubToken = ''; }
  if (App.githubToken) { ghVerify().catch(() => {}); }
}
function saveGitHubToken(tok) {
  App.githubToken = tok || '';
  try {
    if (tok) localStorage.setItem(userKey('githubToken'), tok);
    else localStorage.removeItem(userKey('githubToken'));
  } catch (_) {}
}

function ghHeaders() {
  return {
    'Authorization': `Bearer ${App.githubToken}`,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

async function ghVerify() {
  if (!App.githubToken) throw new Error('no token');
  const r = await fetch('https://api.github.com/user', { headers: ghHeaders() });
  if (!r.ok) throw new Error(r.status === 401 ? 'Invalid or expired token' : `GitHub error ${r.status}`);
  App.githubUser = await r.json();
  renderGitHubState();
  return App.githubUser;
}

async function ghListRepos() {
  const r = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner', { headers: ghHeaders() });
  if (!r.ok) throw new Error(`GitHub error ${r.status}`);
  App.githubRepos = await r.json();
  return App.githubRepos;
}

async function ghCreateRepo(name, isPrivate) {
  const r = await fetch('https://api.github.com/user/repos', {
    method: 'POST', headers: { ...ghHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, private: !!isPrivate, auto_init: true }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.message || `GitHub error ${r.status}`);
  return d;
}

// base64 that survives UTF-8 (emoji, accents) — GitHub wants base64 content.
function b64utf8(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

async function ghPutFile(owner, repo, path, content, message) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path.split('/').map(encodeURIComponent).join('/')}`;
  // If the file already exists we need its blob sha to update it.
  let sha = null;
  try {
    const g = await fetch(url, { headers: ghHeaders() });
    if (g.ok) { const gd = await g.json(); sha = gd.sha || null; }
  } catch (_) {}
  const r = await fetch(url, {
    method: 'PUT', headers: { ...ghHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: message || `Add ${path} via VOID`, content: b64utf8(content), ...(sha ? { sha } : {}) }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.message || `GitHub error ${r.status}`);
  return d;
}

// base64 decode that survives UTF-8 — GitHub returns file content base64'd.
function fromB64utf8(b64) {
  return decodeURIComponent(escape(atob(String(b64).replace(/\s+/g, ''))));
}

// Read a single file's decoded content + its blob sha (needed to commit edits).
async function ghGetFile(owner, repo, path) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path.split('/').map(encodeURIComponent).join('/')}`;
  const r = await fetch(url, { headers: ghHeaders() });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.message || `GitHub error ${r.status}`);
  if (Array.isArray(d)) throw new Error('That path is a folder — use /gh ls to list it.');
  if (d.encoding !== 'base64' || d.content == null) throw new Error('File too large or not text.');
  return { content: fromB64utf8(d.content), sha: d.sha, path: d.path };
}

// List a repo directory (root if no path).
async function ghListContents(owner, repo, path) {
  const p = path ? `/${path.split('/').map(encodeURIComponent).join('/')}` : '';
  const r = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents${p}`, { headers: ghHeaders() });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.message || `GitHub error ${r.status}`);
  const arr = Array.isArray(d) ? d : [d];
  return arr.map(e => ({ name: e.name, type: e.type, path: e.path }));
}

// Commit MANY files in a single atomic commit via the Git Data API.
// files: [{ path, content }]. Creates a tree on top of the current head
// and moves the branch ref to a new commit — one clean commit, not N.
async function ghCommitFiles(owner, repo, files, message) {
  const base = `https://api.github.com/repos/${owner}/${repo}`;
  const gh = async (path, opts) => {
    const r = await fetch(base + path, { headers: { ...ghHeaders(), 'Content-Type': 'application/json' }, ...opts });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.message || `GitHub error ${r.status}`);
    return d;
  };
  const repoInfo = await gh('');
  const branch = repoInfo.default_branch || 'main';
  const ref = await gh(`/git/ref/heads/${encodeURIComponent(branch)}`);
  const headSha = ref.object.sha;
  const headCommit = await gh(`/git/commits/${headSha}`);
  const baseTree = headCommit.tree.sha;
  const tree = await gh('/git/trees', {
    method: 'POST',
    body: JSON.stringify({
      base_tree: baseTree,
      tree: files.map(f => ({ path: f.path.replace(/^\/+/, ''), mode: '100644', type: 'blob', content: f.content })),
    }),
  });
  const commit = await gh('/git/commits', {
    method: 'POST',
    body: JSON.stringify({ message: message || 'Add project via VOID', tree: tree.sha, parents: [headSha] }),
  });
  await gh(`/git/refs/heads/${encodeURIComponent(branch)}`, {
    method: 'PATCH',
    body: JSON.stringify({ sha: commit.sha }),
  });
  return { branch, commitSha: commit.sha, url: `${repoInfo.html_url}/tree/${branch}` };
}

// Parse VOID's multi-file output. Files are delimited by "=== path ===" lines.
function parseMultiFile(text) {
  const files = [];
  const re = /^===\s*(.+?)\s*===\s*$/gm;
  const marks = [];
  let m;
  while ((m = re.exec(text)) !== null) marks.push({ path: m[1].trim(), start: m.index, contentStart: re.lastIndex });
  for (let i = 0; i < marks.length; i++) {
    const end = i + 1 < marks.length ? marks[i + 1].start : text.length;
    let content = text.slice(marks[i].contentStart, end).replace(/^\n/, '').replace(/\n+$/, '\n');
    // strip accidental code fences around a file body
    content = content.replace(/^```[\w-]*\n/, '').replace(/\n```\s*$/, '\n');
    if (marks[i].path) files.push({ path: marks[i].path, content });
  }
  return files;
}

function renderGitHubState() {
  const disc = document.getElementById('github-disconnected');
  const conn = document.getElementById('github-connected');
  const connected = !!(App.githubToken && App.githubUser);
  if (disc) disc.style.display = connected ? 'none' : '';
  if (conn) conn.style.display = connected ? '' : 'none';
  if (connected) {
    const name = document.getElementById('github-user-name');
    const sub = document.getElementById('github-user-sub');
    if (name) name.textContent = '@' + (App.githubUser.login || 'user');
    if (sub) sub.textContent = App.githubUser.public_repos != null ? `${App.githubUser.public_repos} public repos` : 'Connected';
    renderGitHubRepos();
  }
}

function renderGitHubRepos() {
  const list = document.getElementById('github-repos-list');
  if (!list) return;
  if (!App.githubRepos.length) { list.innerHTML = '<p class="muted small">Tap Refresh to load your repositories.</p>'; return; }
  list.innerHTML = App.githubRepos.slice(0, 40).map(r => `
    <div class="doc-item">
      <div class="doc-item-title">${escapeHTML(r.name)} ${r.private ? '🔒' : ''}</div>
      <div class="doc-item-preview">${escapeHTML(r.description || r.full_name)}</div>
      <div class="doc-item-actions">
        <a class="doc-mini-btn" href="${r.html_url}" target="_blank" rel="noopener noreferrer">Open ↗</a>
      </div>
    </div>`).join('');
}

function setupGitHubPanel() {
  const connectBtn = document.getElementById('github-connect-btn');
  const tokenInput = document.getElementById('github-token-input');
  const connectStatus = document.getElementById('github-connect-status');
  if (connectBtn && tokenInput) {
    connectBtn.addEventListener('click', async () => {
      const tok = tokenInput.value.trim();
      if (!tok) { if (connectStatus) connectStatus.textContent = 'Paste a token first.'; return; }
      connectBtn.disabled = true; connectBtn.textContent = 'Connecting…';
      saveGitHubToken(tok);
      try {
        await ghVerify();
        tokenInput.value = '';
        if (connectStatus) connectStatus.textContent = '';
        try { await ghListRepos(); renderGitHubRepos(); } catch (_) {}
      } catch (e) {
        saveGitHubToken('');
        App.githubUser = null;
        if (connectStatus) connectStatus.textContent = e.message || 'Could not connect.';
        renderGitHubState();
      } finally {
        connectBtn.disabled = false; connectBtn.textContent = 'Connect';
      }
    });
  }

  const openSettings = document.getElementById('github-open-settings');
  if (openSettings) openSettings.addEventListener('click', () => window.open('https://github.com/settings/tokens?type=beta', '_blank'));

  const disconnectBtn = document.getElementById('github-disconnect-btn');
  if (disconnectBtn) disconnectBtn.addEventListener('click', () => {
    saveGitHubToken(''); App.githubUser = null; App.githubRepos = [];
    renderGitHubState();
  });

  const newRepoBtn = document.getElementById('github-newrepo-btn');
  const newRepoName = document.getElementById('github-newrepo-name');
  const newRepoPrivate = document.getElementById('github-newrepo-private');
  const newRepoStatus = document.getElementById('github-newrepo-status');
  if (newRepoBtn && newRepoName) {
    newRepoBtn.addEventListener('click', async () => {
      const name = newRepoName.value.trim().replace(/\s+/g, '-');
      if (!name) { if (newRepoStatus) newRepoStatus.textContent = 'Enter a name.'; return; }
      newRepoBtn.disabled = true; newRepoBtn.textContent = 'Creating…';
      try {
        const repo = await ghCreateRepo(name, newRepoPrivate?.checked);
        if (newRepoStatus) newRepoStatus.innerHTML = `Created ✓ <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer" style="color:var(--accent);">${escapeHTML(repo.full_name)}</a>`;
        newRepoName.value = '';
        await ghListRepos(); renderGitHubRepos();
      } catch (e) {
        if (newRepoStatus) newRepoStatus.textContent = e.message || 'Could not create repo.';
      } finally {
        newRepoBtn.disabled = false; newRepoBtn.textContent = 'Create repository';
      }
    });
  }

  const refreshBtn = document.getElementById('github-refresh-repos');
  if (refreshBtn) refreshBtn.addEventListener('click', async () => {
    refreshBtn.textContent = 'Loading…';
    try { await ghListRepos(); renderGitHubRepos(); } catch (_) {}
    refreshBtn.textContent = 'Refresh';
  });
}

// Push-to-GitHub sheet: pick a repo + path, commit the pending content.
let pendingGitHubPush = null;
function openGitHubPush(content, suggestedPath) {
  if (!App.githubToken || !App.githubUser) {
    appendMessage('system', '🔗 Connect GitHub first: Settings → GitHub, paste a Personal Access Token.');
    return;
  }
  pendingGitHubPush = { content };
  const sheet = document.getElementById('gh-push-sheet');
  if (!sheet) return;
  if (sheet.parentElement !== document.body) document.body.appendChild(sheet);
  const repoSel = document.getElementById('gh-push-repo');
  const pathInput = document.getElementById('gh-push-path');
  const status = document.getElementById('gh-push-status');
  if (status) status.textContent = '';
  if (pathInput && suggestedPath) pathInput.value = suggestedPath;
  const fill = () => {
    if (repoSel) repoSel.innerHTML = App.githubRepos.map(r => `<option value="${r.full_name}">${escapeHTML(r.full_name)}</option>`).join('');
  };
  if (!App.githubRepos.length) { ghListRepos().then(fill).catch(() => {}); } else { fill(); }
  sheet.classList.add('open');
  sheet.style.position = 'fixed';
  sheet.style.left = '12px'; sheet.style.right = '12px';
  sheet.style.bottom = '12px'; sheet.style.top = 'auto'; sheet.style.width = 'auto';
}
function setupGitHubPushSheet() {
  const sheet = document.getElementById('gh-push-sheet');
  if (!sheet) return;
  const goBtn = document.getElementById('gh-push-go');
  const status = document.getElementById('gh-push-status');
  if (goBtn) goBtn.addEventListener('click', async () => {
    const full = document.getElementById('gh-push-repo')?.value || '';
    const path = (document.getElementById('gh-push-path')?.value || '').trim().replace(/^\/+/, '');
    if (!full || !path || !pendingGitHubPush) { if (status) status.textContent = 'Pick a repo and path.'; return; }
    const [owner, repo] = full.split('/');
    goBtn.disabled = true; goBtn.textContent = 'Committing…';
    try {
      const res = await ghPutFile(owner, repo, path, pendingGitHubPush.content, `Add ${path} via VOID`);
      if (status) status.innerHTML = `Committed ✓ <a href="${res.content?.html_url || '#'}" target="_blank" rel="noopener noreferrer" style="color:var(--accent);">view file</a>`;
      buzz();
    } catch (e) {
      if (status) status.textContent = e.message || 'Commit failed.';
    } finally {
      goBtn.disabled = false; goBtn.textContent = 'Commit file';
    }
  });
  document.addEventListener('click', (e) => { if (!sheet.contains(e.target)) sheet.classList.remove('open'); });
  sheet.addEventListener('click', (e) => e.stopPropagation());
}

// Re-render the message area for the active chat.
function renderActiveChat() {
  const box = document.getElementById('messages-box');
  if (!box) return;
  box.innerHTML = '';
  App.msgCount = 0;
  if (App.chatHistory.length) {
    App.chatHistory.forEach((msg, i) => appendMessage(msg.role === 'user' ? 'user' : 'system', msg.content, i, msg.sources || []));
  } else {
    box.innerHTML = `<div class="matrix-welcome"><div class="welcome-logo">VOID</div>
      <p>AI assistant &amp; game companion. Ask anything — MLBB heroes, builds, strategy, or general questions.</p>
      <div class="welcome-chips">
        <button class="welcome-chip" data-chip="What can you do?">What can you do?</button>
        <button class="welcome-chip" data-chip="/brief">📋 Daily briefing</button>
        <button class="welcome-chip" data-chip="/image a neon city at night">🎨 Make an image</button>
        <button class="welcome-chip" data-chip="/help">All commands</button>
      </div>
      <div class="welcome-stats monospace" id="welcome-stats-line">INT::0 | MSG::0</div></div>`;
  }
}

function newChat() {
  // don't pile up empty chats
  const cur = getCurrentChat();
  if (cur && cur.messages.length === 0) { closeNavDrawer(); switchTab('tab-chat'); return; }
  const chat = { id: 'c' + Date.now(), title: 'New chat', messages: [], updatedAt: Date.now() };
  App.chats.push(chat);
  App.currentChatId = chat.id;
  App.chatHistory = chat.messages;
  saveChats();
  renderActiveChat();
  renderChatList();
  closeNavDrawer();
  switchTab('tab-chat');
}

function switchChat(id) {
  const chat = App.chats.find(c => c.id === id);
  if (!chat) return;
  App.currentChatId = id;
  App.chatHistory = chat.messages;
  saveChats();
  renderActiveChat();
  renderChatList();
  closeNavDrawer();
  switchTab('tab-chat');
}

function deleteChat(id) {
  const idx = App.chats.findIndex(c => c.id === id);
  if (idx === -1) return;
  App.chats.splice(idx, 1);
  if (!App.chats.length) App.chats.push({ id: 'c' + Date.now(), title: 'New chat', messages: [], updatedAt: Date.now() });
  if (App.currentChatId === id) {
    App.currentChatId = App.chats[App.chats.length - 1].id;
    App.chatHistory = getCurrentChat().messages;
    renderActiveChat();
  }
  saveChats();
  renderChatList();
}

function renderChatList() {
  const list = document.getElementById('chat-list');
  if (!list) return;
  const sorted = [...App.chats].sort((a, b) =>
    (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || (b.updatedAt || 0) - (a.updatedAt || 0));
  list.innerHTML = sorted.map(c => `
    <div class="nav-chat-item${c.id === App.currentChatId ? ' active' : ''}" data-chat-id="${c.id}">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      <span class="nav-chat-title">${escapeHTML(c.title || 'New chat')}</span>
      <button class="nav-chat-rename" data-rename-id="${c.id}" aria-label="Rename chat">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
      </button>
      <button class="nav-chat-pin${c.pinned ? ' pinned' : ''}" data-pin-id="${c.id}" aria-label="${c.pinned ? 'Unpin chat' : 'Pin chat'}">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="${c.pinned ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16h14v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1z"/></svg>
      </button>
      <button class="nav-chat-del" data-del-id="${c.id}" aria-label="Delete chat">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </button>
    </div>`).join('');
  list.querySelectorAll('.nav-chat-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (e.target.closest('.nav-chat-del') || e.target.closest('.nav-chat-pin') || e.target.closest('.nav-chat-rename')) return;
      switchChat(item.dataset.chatId);
    });
  });
  list.querySelectorAll('.nav-chat-del').forEach(btn => {
    btn.addEventListener('click', (e) => { e.stopPropagation(); deleteChat(btn.dataset.delId); });
  });
  list.querySelectorAll('.nav-chat-rename').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const chat = App.chats.find(c => c.id === btn.dataset.renameId);
      if (!chat) return;
      const name = prompt('Rename chat', chat.title || 'New chat');
      if (name && name.trim()) { chat.title = name.trim().slice(0, 60); saveChats(); renderChatList(); }
    });
  });
  list.querySelectorAll('.nav-chat-pin').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const chat = App.chats.find(c => c.id === btn.dataset.pinId);
      if (chat) { chat.pinned = !chat.pinned; buzz(); saveChats(); renderChatList(); }
    });
  });
}

/* ============ Nav Drawer ============ */

function openNavDrawer() {
  const d = document.getElementById('nav-drawer');
  const s = document.getElementById('nav-scrim');
  renderChatList();
  // sync profile bits
  const av = document.getElementById('nav-profile-avatar');
  const nm = document.getElementById('nav-profile-name');
  if (av) av.textContent = (App.currentUser || 'V')[0].toUpperCase();
  if (nm) nm.textContent = App.currentUser ? App.currentUser.split('@')[0] : 'USER';
  if (d) d.classList.add('open');
  if (s) s.classList.add('show');
}

function closeNavDrawer() {
  const d = document.getElementById('nav-drawer');
  const s = document.getElementById('nav-scrim');
  if (d) d.classList.remove('open');
  if (s) s.classList.remove('show');
}

function setupNavDrawer() {
  const burger = document.getElementById('nav-menu-btn');
  if (burger) burger.addEventListener('click', openNavDrawer);
  const scrim = document.getElementById('nav-scrim');
  if (scrim) scrim.addEventListener('click', closeNavDrawer);
  const nc = document.getElementById('nav-newchat-btn');
  if (nc) nc.addEventListener('click', newChat);
  const prof = document.getElementById('nav-profile-btn');
  if (prof) prof.addEventListener('click', () => {
    closeNavDrawer();
    document.getElementById('view-main').classList.remove('active');
    document.getElementById('view-settings').classList.add('active');
  });
  const search = document.getElementById('nav-chat-search');
  if (search) search.addEventListener('input', () => {
    const q = search.value.trim().toLowerCase();
    document.querySelectorAll('#chat-list .nav-chat-item').forEach(item => {
      if (!q) { item.classList.remove('search-hidden'); return; }
      const chat = App.chats.find(c => c.id === item.dataset.chatId);
      const hay = ((chat?.title || '') + ' ' + (chat?.messages || []).map(m => msgText(m.content)).join(' ')).toLowerCase();
      item.classList.toggle('search-hidden', !hay.includes(q));
    });
  });
}

/* ============ Provider Picker ============ */

function setupProviderPicker() {
  const btn = document.getElementById('provider-pick-btn');
  const picker = document.getElementById('provider-picker');
  if (!btn || !picker) return;

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('persona-picker')?.classList.remove('open');
    const isOpen = picker.classList.contains('open');
    if (isOpen) {
      picker.classList.remove('open');
    } else {
      renderProviderPicker();
      picker.classList.add('open');
    }
  });

  document.addEventListener('click', () => picker.classList.remove('open'));
  picker.addEventListener('click', (e) => e.stopPropagation());
}

/* ============ Persona picker (chat modes) ============ */

function setupPersonaPicker() {
  const btn = document.getElementById('persona-pick-btn');
  const picker = document.getElementById('persona-picker');
  if (!btn || !picker) return;

  const renderList = () => {
    const list = document.getElementById('persona-list');
    if (!list) return;
    const cur = App.settings.persona || '';
    const builtins = PERSONAS.map(p => `
      <div class="persona-item${cur === p.id ? ' active' : ''}" data-persona="${p.id}">
        <span class="persona-emoji">${p.emoji}</span>
        <span class="persona-name">${escapeHTML(p.label)}</span>
        ${cur === p.id ? '<span class="persona-check">✓</span>' : ''}
      </div>`).join('');
    const gems = App.gems.length ? `<div class="persona-section-label">✦ MY GEMS</div>` + App.gems.map(g => `
      <div class="persona-item${cur === g.id ? ' active' : ''}" data-persona="${g.id}">
        <span class="persona-emoji">${g.emoji || '✦'}</span>
        <span class="persona-name">${escapeHTML(g.name)}</span>
        ${cur === g.id ? '<span class="persona-check">✓</span>' : ''}
      </div>`).join('') : '';
    const createRow = `<div class="persona-item persona-create" data-persona-create="1"><span class="persona-emoji">➕</span><span class="persona-name">Create a Gem…</span></div>`;
    list.innerHTML = builtins + gems + createRow;
    list.querySelectorAll('.persona-item').forEach(item => {
      item.addEventListener('click', () => {
        picker.classList.remove('open');
        if (item.dataset.personaCreate) {
          document.getElementById('view-main')?.classList.remove('active');
          document.getElementById('view-settings')?.classList.add('active');
          openSettingsPanel('panel-gems');
          setTimeout(() => document.getElementById('gem-name-input')?.focus(), 200);
          return;
        }
        App.settings.persona = item.dataset.persona;
        saveSettings();
        syncPersonaBadge();
      });
    });
  };

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = picker.classList.contains('open');
    document.getElementById('provider-picker')?.classList.remove('open');
    if (isOpen) picker.classList.remove('open');
    else { renderList(); picker.classList.add('open'); }
  });

  document.addEventListener('click', () => picker.classList.remove('open'));
  picker.addEventListener('click', (e) => e.stopPropagation());
  syncPersonaBadge();
}

/* ============ Image style picker (for /image generation) ============ */

function setupImageStylePicker() {
  const picker = document.getElementById('image-style-picker');
  const list = document.getElementById('image-style-list');
  if (!picker || !list) return;

  list.innerHTML = IMAGE_STYLES.map((s, i) => `
    <div class="persona-item" data-style-index="${i}">
      <span class="persona-emoji">${s.emoji}</span>
      <span class="persona-name">${s.label}</span>
    </div>`).join('');

  list.querySelectorAll('.persona-item').forEach(item => {
    item.addEventListener('click', () => {
      const style = IMAGE_STYLES[parseInt(item.dataset.styleIndex, 10)];
      picker.classList.remove('open');
      const input = document.getElementById('chat-input');
      if (!input) return;
      input.value = style.id ? `/image ${style.id}, ` : '/image ';
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
      updateSendMicBtn();
    });
  });

  document.addEventListener('click', () => picker.classList.remove('open'));
  picker.addEventListener('click', (e) => e.stopPropagation());
}

function syncPersonaBadge() {
  const btn = document.getElementById('persona-pick-btn');
  if (!btn) return;
  const pid = App.settings.persona || '';
  if (pid.startsWith('gem:')) {
    const gem = App.gems.find(g => g.id === pid);
    if (gem) {
      btn.innerHTML = `${gem.emoji || '✦'} ${escapeHTML(gem.name.toUpperCase())} &#9662;`;
      btn.classList.add('active');
      return;
    }
  }
  const p = PERSONAS.find(x => x.id === pid) || PERSONAS[0];
  btn.innerHTML = `${p.emoji} ${p.id ? p.label.toUpperCase() : 'MODE'} &#9662;`;
  btn.classList.toggle('active', !!p.id);
}

/* Claude-style "+" quick-actions menu — consolidates attach / mode / live
   voice / provider into one button so the composer stays clean. The old
   badge buttons stay in the DOM (hidden) and are proxy-clicked, so all
   existing handlers keep working unchanged. */
function setupPlusMenu() {
  const btn = document.getElementById('plus-btn');
  const menu = document.getElementById('plus-menu');
  if (!btn || !menu) return;

  const syncRows = () => {
    const p = PERSONAS.find(x => x.id === (App.settings.persona || '')) || PERSONAS[0];
    const modeSub = document.getElementById('plus-mode-sub');
    const liveSub = document.getElementById('plus-live-sub');
    if (modeSub) modeSub.textContent = p.label;
    if (liveSub) liveSub.textContent = App.voiceConvo ? 'On' : 'Off';
  };

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('provider-picker')?.classList.remove('open');
    document.getElementById('persona-picker')?.classList.remove('open');
    const isOpen = menu.classList.contains('open');
    if (isOpen) menu.classList.remove('open');
    else { syncRows(); menu.classList.add('open'); }
  });

  menu.querySelectorAll('.persona-item').forEach(row => {
    row.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.classList.remove('open');
      const act = row.dataset.plus;
      if (act === 'attach') document.getElementById('attach-btn')?.click();
      else if (act === 'image') {
        document.getElementById('provider-picker')?.classList.remove('open');
        document.getElementById('persona-picker')?.classList.remove('open');
        document.getElementById('image-style-picker')?.classList.add('open');
      }
      else if (act === 'research') {
        const input = document.getElementById('chat-input');
        if (input) { input.value = '/research '; input.focus(); input.setSelectionRange(input.value.length, input.value.length); updateSendMicBtn(); }
      }
      else if (act === 'mode') document.getElementById('persona-pick-btn')?.click();
      else if (act === 'provider') document.getElementById('provider-pick-btn')?.click();
      else if (act === 'live') document.getElementById('voice-convo-btn')?.click();
    });
  });

  document.addEventListener('click', () => menu.classList.remove('open'));
  menu.addEventListener('click', (e) => e.stopPropagation());
}

function renderProviderPicker() {
  const list = document.getElementById('provider-list');
  if (!list) return;

  if (VOID_CORE_API.url) {
    list.innerHTML = `
      <div class="void-core-status">
        <div class="void-core-status-row">
          <span class="void-core-dot"></span>
          <div class="void-core-info">
            <span class="void-core-name">VOID CORE</span>
            <span class="void-core-sub">13 AI providers — fully automatic</span>
          </div>
          <span class="provider-tag active-tag">ACTIVE</span>
        </div>
        <p class="void-core-note">VOID CORE automatically routes to the fastest available AI. No setup needed.</p>
      </div>
    `;
    return;
  }

  const providers = [
    { id: 'gemini', name: 'Gemini', sub: 'Google AI - fast & capable', configured: !!App.settings.geminiKey },
    { id: 'groq', name: 'Groq', sub: 'Ultra-fast inference', configured: !!App.settings.groqKey },
    { id: 'openrouter', name: 'OpenRouter', sub: 'Multi-model gateway', configured: !!App.settings.apiKey },
    { id: 'together', name: 'Together AI', sub: 'Open-source models', configured: !!App.settings.togetherKey },
    { id: 'mistral', name: 'Mistral', sub: 'European AI', configured: !!App.settings.mistralKey },
    { id: 'pollinations', name: 'Pollinations.ai', sub: 'Free - no key needed', configured: true, free: true },
  ];

  const active = (App.settings.providerOrder || [])[0];

  list.innerHTML = providers.map(p => `
    <div class="provider-item${p.id === active ? ' selected' : ''}${!p.configured ? ' unconfigured' : ''}" data-id="${p.id}">
      <span class="provider-dot${p.configured ? ' on' : ''}"></span>
      <div class="provider-info">
        <span class="provider-name">${p.name}</span>
        <span class="provider-sub">${p.sub}</span>
      </div>
      <div class="provider-tags">
        ${p.free ? '<span class="provider-tag free-tag">FREE</span>' : ''}
        ${p.id === active ? '<span class="provider-tag active-tag">ACTIVE</span>' : ''}
        ${!p.configured && !p.free ? '<span class="provider-tag setup-tag">SETUP</span>' : ''}
      </div>
    </div>
  `).join('');

  list.querySelectorAll('.provider-item').forEach(item => {
    item.addEventListener('click', () => {
      const pid = item.dataset.id;
      const pr = providers.find(p => p.id === pid);
      if (!pr || !pr.configured) {
        document.getElementById('provider-picker').classList.remove('open');
        document.getElementById('view-main').classList.remove('active');
        document.getElementById('view-settings').classList.add('active');
        openSettingsPanel('panel-keys');
        return;
      }
      App.settings.providerOrder = [pid, ...App.settings.providerOrder.filter(x => x !== pid)];
      saveSettings();
      updateModelIndicator();
      document.getElementById('provider-picker').classList.remove('open');
    });
  });
}

/* ============ Memory Panel ============ */

function setupMemoryPanel() {
  const autoToggle = document.getElementById('toggle-auto-memory');
  if (autoToggle) {
    autoToggle.checked = App.settings.autoMemory !== false;
    autoToggle.addEventListener('change', () => { App.settings.autoMemory = autoToggle.checked; saveSettings(); });
  }
  const clearFactsBtn = document.getElementById('clear-facts-btn');
  if (clearFactsBtn) {
    clearFactsBtn.addEventListener('click', () => {
      App.memoryFacts = [];
      saveMemoryFacts();
      renderMemoryFacts();
    });
  }
  const clearBtn = document.getElementById('clear-memory-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      const cur = getCurrentChat();
      if (cur) { cur.messages = []; cur.title = 'New chat'; }
      App.chatHistory = cur ? cur.messages : [];
      App.msgCount = 0;
      saveChats();
      renderActiveChat();
      renderChatList();
      closeSettingsPanel();
      renderMemoryInfo();
    });
  }
}

function renderMemoryInfo() {
  const info = document.getElementById('memory-info');
  if (!info) return;
  const msgs = App.chatHistory.length;
  const user = App.currentUser || 'guest';
  info.innerHTML = `
    <div class="memory-stat-row">
      <span class="memory-stat-label">Account</span>
      <span class="memory-stat-value">${escapeHTML(user)}</span>
    </div>
    <div class="memory-stat-row">
      <span class="memory-stat-label">Messages stored</span>
      <span class="memory-stat-value">${msgs}</span>
    </div>
    <div class="memory-stat-row">
      <span class="memory-stat-label">Context window</span>
      <span class="memory-stat-value">last 20 msgs</span>
    </div>
  `;
}

function getUserProfile() {
  if (!App.currentUser) return null;
  try { return JSON.parse(localStorage.getItem(`void_profile_${App.currentUser}`)); } catch(e) { return null; }
}

function updateUserDisplay() {
  if (!App.currentUser) return;
  const profile = getUserProfile();
  const displayName = profile?.name || App.currentUser.split('@')[0];
  const initial = displayName.charAt(0).toUpperCase();

  const avatarInitialEl = document.getElementById('avatar-initial');
  if (avatarInitialEl) avatarInitialEl.textContent = initial;

  const settingsAvatarEl = document.getElementById('settings-avatar');
  if (settingsAvatarEl) settingsAvatarEl.textContent = initial;

  const settingsNameEl = document.getElementById('settings-name');
  if (settingsNameEl) settingsNameEl.textContent = displayName;

  const settingsEmailEl = document.getElementById('settings-email');
  if (settingsEmailEl) settingsEmailEl.textContent = App.currentUser;
}

function logoutUser() {
  localStorage.removeItem('void_current_user');
  location.reload();
}

/* ============ Commands panel ============ */

function setupCommandsPanel() {
  const labelInput = document.getElementById('command-label-input');
  const actionInput = document.getElementById('command-action-input');
  const addBtn = document.getElementById('add-command-btn');

  if (addBtn) {
    addBtn.addEventListener('click', () => {
      const label = labelInput.value.trim();
      const action = actionInput.value.trim();
      if (!label || !action) return;
      App.commands.push({ label, action });
      labelInput.value = '';
      actionInput.value = '';
      renderCommands();
      saveCommands();
    });
  }
}

function loadCommands() {
  try {
    const raw = localStorage.getItem(userKey('commands'));
    if (raw) App.commands = JSON.parse(raw) || [];
  } catch(e) { App.commands = []; }
  renderCommands();
}

function saveCommands() {
  try { localStorage.setItem(userKey('commands'), JSON.stringify(App.commands)); } catch(e) {}
}

function renderCommands() {
  const list = document.getElementById('commands-list');
  const empty = document.getElementById('commands-empty');
  if (!list) return;

  if (App.commands.length === 0) {
    if (empty) empty.style.display = '';
    list.querySelectorAll('.command-item').forEach(r => r.remove());
    return;
  }
  if (empty) empty.style.display = 'none';
  list.querySelectorAll('.command-item').forEach(r => r.remove());

  App.commands.forEach((cmd, i) => {
    const row = document.createElement('div');
    row.className = 'command-item';
    row.innerHTML = `
      <span class="item-meta">${escapeHTML(cmd.label)}</span>
      <button class="small-action-btn command-delete" data-index="${i}" aria-label="Delete">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    `;
    list.appendChild(row);
  });

  list.querySelectorAll('.command-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      App.commands.splice(parseInt(btn.dataset.index, 10), 1);
      renderCommands();
      saveCommands();
    });
  });
}

/* ============ Tasks panel ============ */

function setupTasksPanel() {
  const taskInput = document.getElementById('task-input');
  const dueInput = document.getElementById('task-due-input');
  const addBtn = document.getElementById('add-task-btn');

  if (addBtn) {
    addBtn.addEventListener('click', () => {
      const text = taskInput.value.trim();
      if (!text) return;
      const due = dueInput?.value ? new Date(dueInput.value).getTime() : null;
      if (due && window.Notification && Notification.permission === 'default') {
        try { Notification.requestPermission(); } catch(_) {}
      }
      App.tasks.push({ text, done: false, due, notified: false });
      taskInput.value = '';
      if (dueInput) dueInput.value = '';
      renderTasks();
      saveTasks();
    });
  }
  if (taskInput) {
    taskInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') addBtn.click();
    });
  }

  const briefToggle = document.getElementById('toggle-daily-brief');
  const briefTimeInput = document.getElementById('daily-brief-time');
  const briefTimeRow = document.getElementById('daily-brief-time-row');
  if (briefToggle) {
    briefToggle.checked = !!App.settings.briefEnabled;
    if (briefTimeRow) briefTimeRow.style.display = briefToggle.checked ? '' : 'none';
    briefToggle.addEventListener('change', () => {
      App.settings.briefEnabled = briefToggle.checked;
      if (briefToggle.checked && window.Notification && Notification.permission === 'default') {
        try { Notification.requestPermission(); } catch (_) {}
      }
      if (briefTimeRow) briefTimeRow.style.display = briefToggle.checked ? '' : 'none';
      saveSettings();
    });
  }
  if (briefTimeInput) {
    briefTimeInput.value = App.settings.briefTime || '08:00';
    briefTimeInput.addEventListener('change', () => {
      App.settings.briefTime = briefTimeInput.value || '08:00';
      App.settings.briefFiredDate = ''; // allow it to fire today at the new time
      saveSettings();
    });
  }

  startReminderChecker();
}

// Reminders — checks while the app is open and surfaces an in-app banner (+ a
// browser Notification if permission was granted). This can't wake the app from
// fully closed on Android without a native alarm plugin, so it's a best-effort
// reminder for tasks with a due time, not a guaranteed background alarm.
let reminderCheckerStarted = false;
function startReminderChecker() {
  if (reminderCheckerStarted) return;
  reminderCheckerStarted = true;
  setInterval(() => {
    const now = Date.now();
    let changed = false;
    App.tasks.forEach(task => {
      if (task.due && !task.notified && !task.done && task.due <= now) {
        task.notified = true;
        changed = true;
        fireReminder(task.text);
      }
    });
    if (changed) saveTasks();
    checkScheduledBriefing();
  }, 30000);
}

// Scheduled daily briefing — fires once per day at the chosen HH:MM while
// the app happens to be open (same best-effort caveat as task reminders).
async function buildDailyBriefingText() {
  if (!App.liveContext.city) { try { await initLiveContext(); } catch(_) {} }
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dayEnd = dayStart + 86400000;
  const dueToday = App.tasks.filter(t => !t.done && t.due && t.due >= dayStart && t.due < dayEnd);
  const openTasks = App.tasks.filter(t => !t.done);
  let out = `📋 **Daily Briefing** — ${dateStr}\n`;
  if (App.liveContext.city) out += `\n📍 ${App.liveContext.city}${App.liveContext.country ? ', ' + App.liveContext.country : ''}`;
  if (App.liveContext.localTime) out += `\n🕒 ${App.liveContext.localTime}`;
  if (App.liveContext.weather) out += `\n⛅ ${App.liveContext.weather}`;
  out += dueToday.length
    ? `\n\n⏰ Due today:\n${dueToday.map(t => `• ${t.text} (${new Date(t.due).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`).join('\n')}`
    : '\n\n⏰ Nothing due today.';
  if (openTasks.length) out += `\n📌 ${openTasks.length} open task${openTasks.length > 1 ? 's' : ''} total`;
  const quote = document.getElementById('void-quote-line')?.textContent?.trim();
  if (quote) out += `\n\n💭 ${quote}`;
  return out;
}

async function runDailyBriefing() {
  const text = await buildDailyBriefingText();
  appendMessage('system', text);
  if (window.Notification && Notification.permission === 'granted') {
    try { new Notification('VOID — Daily Briefing', { body: text.replace(/[*#📋📍🕒⛅⏰📌💭]/g, '').trim().slice(0, 180) }); } catch (_) {}
  }
  if (App.settings.voiceEnabled) speak('Here is your daily briefing.');
}

function checkScheduledBriefing() {
  if (!App.settings.briefEnabled) return;
  const now = new Date();
  const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const today = now.toISOString().slice(0, 10);
  if (App.settings.briefFiredDate === today) return;
  if (hhmm < App.settings.briefTime) return;
  App.settings.briefFiredDate = today;
  saveSettings();
  runDailyBriefing();
}

function fireReminder(text) {
  if (window.Notification && Notification.permission === 'granted') {
    try { new Notification('VOID reminder', { body: text }); } catch(_) {}
  }
  const bar = document.createElement('div');
  bar.style.cssText = 'position:fixed;left:10px;right:10px;top:calc(var(--safe-top,0px) + 8px);z-index:9999;'
    + 'background:#16161f;border:1px solid rgba(124,111,255,0.35);border-radius:12px;padding:10px 12px;'
    + 'display:flex;align-items:center;gap:10px;box-shadow:0 8px 24px rgba(0,0,0,0.4);';
  bar.innerHTML = `<span style="flex:1;font-size:12.5px;color:#e8e8f0;line-height:1.4;">⏰ ${escapeHTML(text)}</span>
    <button style="background:transparent;border:none;color:#6b6b80;font-size:16px;padding:2px 4px;cursor:pointer;">✕</button>`;
  bar.querySelector('button').addEventListener('click', () => bar.remove());
  document.body.appendChild(bar);
  setTimeout(() => bar.remove(), 10000);
  if (App.settings.voiceEnabled) speak(`Reminder: ${text}`);
}

/* ============ Auto-memory ============ */

function loadMemoryFacts() {
  try { App.memoryFacts = JSON.parse(localStorage.getItem(userKey('memoryFacts'))) || []; } catch (_) { App.memoryFacts = []; }
}
function saveMemoryFacts() {
  try { localStorage.setItem(userKey('memoryFacts'), JSON.stringify(App.memoryFacts.slice(-40))); } catch (_) {}
}
function memoryContext() {
  if (!App.memoryFacts.length) return '';
  return `\n\nREMEMBERED ABOUT THIS USER (from past conversations — use naturally, don't recite the list):\n${App.memoryFacts.map(f => `- ${f}`).join('\n')}`;
}

// Fire-and-forget: after a reply, ask the AI for at most one short durable
// fact worth remembering. Cheap (tiny prompt), never blocks the visible
// reply, silently no-ops on failure or when there's nothing worth keeping.
let memoryExtractInFlight = false;
async function maybeExtractMemory(userText) {
  if (!App.settings.autoMemory || memoryExtractInFlight || !userText || userText.length < 8) return;
  memoryExtractInFlight = true;
  try {
    const reply = await quickAI(
      'Extract ONE short durable fact about the USER worth remembering long-term (name, location, job, preference, ongoing project, relationship, goal). ' +
      'Ignore one-off questions, greetings, or anything already obvious. Reply with ONLY the fact as a short third-person sentence (e.g. "Lives in Cairo." or "Learning Python."). ' +
      'If nothing is worth remembering, reply with exactly: NONE',
      userText);
    const fact = (reply || '').trim().replace(/^["'-]\s*/, '');
    if (fact && fact.toUpperCase() !== 'NONE' && fact.length < 140) {
      const dupe = App.memoryFacts.some(f => f.toLowerCase() === fact.toLowerCase());
      if (!dupe) { App.memoryFacts.push(fact); saveMemoryFacts(); renderMemoryFacts(); }
    }
  } catch (_) {} finally { memoryExtractInFlight = false; }
}

/* ============ Suggested follow-ups (like ChatGPT's next-question chips) ============ */

function clearFollowupChips() {
  document.querySelectorAll('.followup-chips').forEach(e => e.remove());
}

let followupInFlight = false;
async function maybeSuggestFollowups(userText, reply) {
  // Skip in hands-free voice mode (chips are useless mid-conversation by ear)
  // and for short/simple replies where "what next" is obvious.
  if (App.voiceConvo || followupInFlight || !reply || reply.length < 120) return;
  followupInFlight = true;
  try {
    const raw = await quickAI(
      'Suggest 3 very short follow-up questions the user might naturally ask next in this conversation. ' +
      'Each under 8 words. Reply with ONLY the 3 questions, one per line, no numbering, no bullets.',
      `User asked: ${msgText(userText).slice(0, 300)}\n\nAssistant answered: ${reply.slice(0, 600)}`);
    if (!raw) return;
    const questions = raw.split('\n').map(q => q.trim().replace(/^[-*\d.)\s]+/, '')).filter(q => q.length >= 6 && q.length <= 70).slice(0, 3);
    if (!questions.length) return;
    // The conversation may have moved on while we were thinking — only attach
    // the chips if this reply is still the latest message.
    const last = App.chatHistory[App.chatHistory.length - 1];
    if (!last || last.role !== 'assistant' || msgText(last.content) !== reply || App.generating) return;
    const box = document.getElementById('messages-box');
    if (!box) return;
    clearFollowupChips();
    const wrap = document.createElement('div');
    wrap.className = 'followup-chips';
    wrap.innerHTML = questions.map(q => `<button class="followup-chip" type="button">${escapeHTML(q)}</button>`).join('');
    wrap.querySelectorAll('.followup-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = document.getElementById('chat-input');
        if (!input) return;
        input.value = btn.textContent;
        input.dispatchEvent(new Event('input'));
        sendMessage();
      });
    });
    box.appendChild(wrap);
    box.scrollTop = box.scrollHeight;
  } catch (_) {} finally { followupInFlight = false; }
}

function renderMemoryFacts() {
  const list = document.getElementById('memory-facts-list');
  const empty = document.getElementById('memory-facts-empty');
  if (!list) return;
  if (empty) empty.style.display = App.memoryFacts.length ? 'none' : '';
  list.innerHTML = App.memoryFacts.map((f, i) => `
    <div class="memory-fact-row">
      <span class="memory-fact-text">${escapeHTML(f)}</span>
      <button class="memory-fact-del" data-fact-index="${i}" aria-label="Forget this">✕</button>
    </div>`).join('');
  list.querySelectorAll('.memory-fact-del').forEach(btn => {
    btn.addEventListener('click', () => {
      App.memoryFacts.splice(parseInt(btn.dataset.factIndex, 10), 1);
      saveMemoryFacts();
      renderMemoryFacts();
    });
  });
}

/* ============ Bookmarked messages ============ */

function loadBookmarks() {
  try { App.bookmarks = JSON.parse(localStorage.getItem(userKey('bookmarks'))) || []; } catch (_) { App.bookmarks = []; }
}
function saveBookmarks() {
  try { localStorage.setItem(userKey('bookmarks'), JSON.stringify(App.bookmarks.slice(-100))); } catch (_) {}
}
function toggleBookmark(text) {
  const idx = App.bookmarks.findIndex(b => b.text === text);
  if (idx >= 0) App.bookmarks.splice(idx, 1);
  else App.bookmarks.unshift({ text, chatTitle: getCurrentChat()?.title || 'Chat', savedAt: Date.now() });
  saveBookmarks();
  buzz();
  return idx < 0; // true if just saved
}
function renderBookmarks() {
  const list = document.getElementById('saved-list');
  const empty = document.getElementById('saved-empty');
  if (!list) return;
  if (empty) empty.style.display = App.bookmarks.length ? 'none' : '';
  list.innerHTML = App.bookmarks.map((b, i) => `
    <div class="saved-item" data-saved-index="${i}">
      <div class="saved-item-chat">${escapeHTML(b.chatTitle)}</div>
      <div class="saved-item-text">${escapeHTML(b.text.slice(0, 160))}${b.text.length > 160 ? '…' : ''}</div>
      <button class="saved-item-del" data-saved-del="${i}" aria-label="Remove">✕</button>
    </div>`).join('');
  list.querySelectorAll('.saved-item-del').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      App.bookmarks.splice(parseInt(btn.dataset.savedDel, 10), 1);
      saveBookmarks();
      renderBookmarks();
    });
  });
}

function loadTasks() {
  try {
    const raw = localStorage.getItem(userKey('tasks'));
    if (raw) App.tasks = JSON.parse(raw) || [];
  } catch(e) { App.tasks = []; }
  renderTasks();
}

function saveTasks() {
  try { localStorage.setItem(userKey('tasks'), JSON.stringify(App.tasks)); } catch(e) {}
}

function renderTasks() {
  const list = document.getElementById('tasks-list');
  const empty = document.getElementById('tasks-empty');
  if (!list) return;

  if (App.tasks.length === 0) {
    if (empty) empty.style.display = '';
    list.querySelectorAll('.task-item').forEach(r => r.remove());
    return;
  }
  if (empty) empty.style.display = 'none';
  list.querySelectorAll('.task-item').forEach(r => r.remove());

  App.tasks.forEach((task, i) => {
    const row = document.createElement('div');
    row.className = `task-item ${task.done ? 'completed' : ''}`;
    row.innerHTML = `
      <label class="switch">
        <input type="checkbox" ${task.done ? 'checked' : ''} data-index="${i}" class="task-check">
        <span class="switch-track"><span class="switch-thumb"></span></span>
      </label>
      <span class="item-meta task-text">${escapeHTML(task.text)}${task.due ? ` <span class="task-due">⏰ ${new Date(task.due).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>` : ''}</span>
      <button class="small-action-btn task-delete" data-index="${i}" aria-label="Delete">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    `;
    list.appendChild(row);
  });

  list.querySelectorAll('.task-check').forEach(box => {
    box.addEventListener('change', () => {
      App.tasks[parseInt(box.dataset.index, 10)].done = box.checked;
      renderTasks();
      saveTasks();
    });
  });
  list.querySelectorAll('.task-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      App.tasks.splice(parseInt(btn.dataset.index, 10), 1);
      renderTasks();
      saveTasks();
    });
  });
}

/* ============ GameHub ============ */

function openMLBBContent() {
  const picker  = document.getElementById('games-picker-view');
  const content = document.getElementById('mlbb-content-view');
  if (picker)  picker.style.display = 'none';
  if (content) { content.style.display = ''; content.classList.add('active'); }
}

function closeMLBBContent() {
  const content = document.getElementById('mlbb-content-view');
  if (content) content.classList.remove('active');
  showGamingView();
}

function setupGameHub() {
  const mlbbTile = document.getElementById('mlbb-tile');
  if (mlbbTile) {
    mlbbTile.addEventListener('click', openMLBBContent);
    mlbbTile.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') openMLBBContent(); });
  }

  const triviaTile = document.getElementById('trivia-tile');
  if (triviaTile) {
    triviaTile.addEventListener('click', openTriviaView);
    triviaTile.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') openTriviaView(); });
  }

  const backToGames = document.getElementById('mlbb-back-to-games');
  if (backToGames) backToGames.addEventListener('click', closeMLBBContent);

  // "Watch a guide" buttons in the map view → open a YouTube search (example videos)
  document.querySelectorAll('.map-watch-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const q = btn.dataset.yt || 'MLBB guide';
      window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`, '_blank');
    });
  });

  const studyBtn = document.getElementById('btn-open-study');
  if (studyBtn) {
    studyBtn.addEventListener('click', () => openStudyPanel());
  }

  const studyBtnGlobal = document.getElementById('btn-open-study-global');
  if (studyBtnGlobal) studyBtnGlobal.addEventListener('click', () => openStudyPanel());

  const wsGamingBtn = document.getElementById('ws-gaming-btn');
  if (wsGamingBtn) wsGamingBtn.addEventListener('click', showGamingView);

  const wsStudyBtn = document.getElementById('ws-study-btn');
  if (wsStudyBtn) wsStudyBtn.addEventListener('click', () => openStudyPanel());

  const backToWorkspace = document.getElementById('games-back-to-workspace');
  if (backToWorkspace) backToWorkspace.addEventListener('click', showWorkspaceLanding);

  document.querySelectorAll('.gamehub-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.gamehub-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.gamehub-content-view').forEach(v => v.classList.remove('active'));
      document.getElementById(`gamehub-view-${btn.dataset.hubTab}`).classList.add('active');
    });
  });

  // item type sub-tabs
  document.querySelectorAll('.item-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.item-type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.item-type-grid').forEach(g => g.classList.remove('active'));
      document.getElementById(`item-grid-${btn.dataset.itype.toLowerCase()}`).classList.add('active');
    });
  });

  renderHeroGrid(GameHubData.heroes);
  renderAllItemGrids(GameHubData.items);

  const heroSearch = document.getElementById('hero-search-input');
  if (heroSearch) {
    heroSearch.addEventListener('input', () => {
      const q = heroSearch.value.trim().toLowerCase();
      renderHeroGrid(GameHubData.heroes.filter(h =>
        h.name.toLowerCase().includes(q) || h.role.toLowerCase().includes(q)
      ));
    });
  }

  const itemSearch = document.getElementById('item-search-input');
  if (itemSearch) {
    itemSearch.addEventListener('input', () => {
      const q = itemSearch.value.trim().toLowerCase();
      renderAllItemGrids(q
        ? GameHubData.items.filter(i => i.name.toLowerCase().includes(q) || i.type.toLowerCase().includes(q))
        : GameHubData.items
      );
    });
  }
}

/* ============================================================
   STUDY MODE
   ============================================================ */

/* ============================================================
   STUDY MODE — 44 world locations + vibes
   ============================================================ */

const CITY_TZ = {
  'tokyo':'Asia/Tokyo','kyoto':'Asia/Tokyo','osaka':'Asia/Tokyo',
  'seoul':'Asia/Seoul','hong-kong':'Asia/Hong_Kong','taipei':'Asia/Taipei',
  'shanghai':'Asia/Shanghai','beijing':'Asia/Shanghai','singapore':'Asia/Singapore',
  'kuala-lumpur':'Asia/Kuala_Lumpur','bangkok':'Asia/Bangkok','hanoi':'Asia/Bangkok',
  'ho-chi-minh':'Asia/Ho_Chi_Minh','jakarta':'Asia/Jakarta','manila':'Asia/Manila',
  'mumbai':'Asia/Kolkata','dubai':'Asia/Dubai','istanbul':'Europe/Istanbul',
  'new-york':'America/New_York','los-angeles':'America/Los_Angeles',
  'san-francisco':'America/Los_Angeles','chicago':'America/Chicago',
  'toronto':'America/Toronto','mexico-city':'America/Mexico_City',
  'rio':'America/Sao_Paulo','buenos-aires':'America/Argentina/Buenos_Aires',
  'paris':'Europe/Paris','london':'Europe/London','rome':'Europe/Rome',
  'venice':'Europe/Rome','barcelona':'Europe/Madrid','amsterdam':'Europe/Amsterdam',
  'prague':'Europe/Prague','vienna':'Europe/Vienna','berlin':'Europe/Berlin',
  'lisbon':'Europe/Lisbon','madrid':'Europe/Madrid','stockholm':'Europe/Stockholm',
  'copenhagen':'Europe/Copenhagen','zurich':'Europe/Zurich','athens':'Europe/Athens',
  'iceland':'Atlantic/Reykjavik','marrakech':'Africa/Casablanca','cairo':'Africa/Cairo',
  'cape-town':'Africa/Johannesburg','lagos':'Africa/Lagos','nairobi':'Africa/Nairobi',
  'sydney':'Australia/Sydney'
};

function getCityTime(locId) {
  const tz = CITY_TZ[locId];
  if (!tz) return '';
  try {
    return new Date().toLocaleTimeString('en-US', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false });
  } catch { return ''; }
}

// Each location is a real, verified YouTube video (4K walking tours, drone
// flyovers, window views and ambience). YouTube streams adaptively (works on
// slow networks) and its image CDN is reachable globally. `yt` is the video
// id; the grid thumbnail and the player are both built from it, so what you
// see in the grid is exactly what plays.
const STUDY_LOCATIONS = [
  // ---- COZY SPACES (study vibes) ----
  { id:'lofi-girl',     name:'LOFI GIRL',      region:'SPACES',     flag:'🎧', yt:'I0T9AOG5hwI' },
  { id:'rainy-desk',    name:'RAINY DESK',     region:'SPACES',     flag:'🌧️', yt:'cd4kOYDTRdo' },
  { id:'library',       name:'LIBRARY',        region:'SPACES',     flag:'📚', yt:'ZMwr3blFkEU' },
  { id:'hogwarts',      name:'HOGWARTS',       region:'SPACES',     flag:'🪄', yt:'wra4tQS3fXk' },
  { id:'coffee-shop',   name:'COFFEE SHOP',    region:'SPACES',     flag:'☕', yt:'MYPVQccHhAQ' },
  { id:'fireplace',     name:'FIREPLACE',      region:'SPACES',     flag:'🔥', yt:'bTWD9nVgAhQ' },
  // ---- CITIES (aerial / skyline / drone — calm, no crowds) ----
  { id:'tokyo',         name:'TOKYO',          region:'EAST ASIA',  flag:'🗼', yt:'OQefom7gcsI' },
  { id:'kyoto',         name:'KYOTO',          region:'EAST ASIA',  flag:'⛩️', yt:'muhDo8A4Y0M' },
  { id:'osaka',         name:'OSAKA',          region:'EAST ASIA',  flag:'🏯', yt:'aE2si1UQvGE' },
  { id:'seoul',         name:'SEOUL',          region:'EAST ASIA',  flag:'🇰🇷', yt:'P28De9FyTrM' },
  { id:'hong-kong',     name:'HONG KONG',      region:'EAST ASIA',  flag:'🇭🇰', yt:'kfjNzIYQnBk' },
  { id:'taipei',        name:'TAIPEI',         region:'EAST ASIA',  flag:'🇹🇼', yt:'AcErW-_7fPs' },
  { id:'shanghai',      name:'SHANGHAI',       region:'EAST ASIA',  flag:'🇨🇳', yt:'Ala-qjSfjfA' },
  { id:'beijing',       name:'BEIJING',        region:'EAST ASIA',  flag:'🇨🇳', yt:'fe5Vo9U0FJE' },
  { id:'singapore',     name:'SINGAPORE',      region:'SE ASIA',    flag:'🇸🇬', yt:'Wym4G2yYgcU' },
  { id:'kuala-lumpur',  name:'KUALA LUMPUR',   region:'SE ASIA',    flag:'🇲🇾', yt:'83I2LjxPepo' },
  { id:'bangkok',       name:'BANGKOK',        region:'SE ASIA',    flag:'🇹🇭', yt:'k8V4WmZ9B9U' },
  { id:'hanoi',         name:'HANOI',          region:'SE ASIA',    flag:'🇻🇳', yt:'5SPkiyhTyPU' },
  { id:'ho-chi-minh',   name:'HO CHI MINH',    region:'SE ASIA',    flag:'🇻🇳', yt:'AcErW-_7fPs' },
  { id:'jakarta',       name:'JAKARTA',        region:'SE ASIA',    flag:'🇮🇩', yt:'Ala-qjSfjfA' },
  { id:'manila',        name:'MANILA',         region:'SE ASIA',    flag:'🇵🇭', yt:'fe5Vo9U0FJE' },
  { id:'mumbai',        name:'MUMBAI',         region:'SOUTH ASIA', flag:'🇮🇳', yt:'8W4ZTX1z02E' },
  { id:'dubai',         name:'DUBAI',          region:'MIDDLE EAST',flag:'🌇', yt:'k8V4WmZ9B9U' },
  { id:'istanbul',      name:'ISTANBUL',       region:'MIDDLE EAST',flag:'🇹🇷', yt:'npTBK0VmhxI' },
  { id:'new-york',      name:'NEW YORK',       region:'AMERICAS',   flag:'🗽', yt:'V80gUbDBIkY' },
  { id:'los-angeles',   name:'LOS ANGELES',    region:'AMERICAS',   flag:'🌴', yt:'kAM7wnaF6KM' },
  { id:'san-francisco', name:'SAN FRANCISCO',  region:'AMERICAS',   flag:'🌉', yt:'6yKWTDYUW-k' },
  { id:'chicago',       name:'CHICAGO',        region:'AMERICAS',   flag:'🇺🇸', yt:'Lokk50pvMy4' },
  { id:'toronto',       name:'TORONTO',        region:'AMERICAS',   flag:'🇨🇦', yt:'WWE57OolWIo' },
  { id:'mexico-city',   name:'MEXICO CITY',    region:'AMERICAS',   flag:'🇲🇽', yt:'83I2LjxPepo' },
  { id:'rio',           name:'RIO DE JANEIRO', region:'AMERICAS',   flag:'🇧🇷', yt:'Wym4G2yYgcU' },
  { id:'buenos-aires',  name:'BUENOS AIRES',   region:'AMERICAS',   flag:'🇦🇷', yt:'AcErW-_7fPs' },
  { id:'paris',         name:'PARIS',          region:'EUROPE',     flag:'🗼', yt:'rchqJlo1jQs' },
  { id:'london',        name:'LONDON',         region:'EUROPE',     flag:'🇬🇧', yt:'1HcEkN_290Q' },
  { id:'rome',          name:'ROME',           region:'EUROPE',     flag:'🇮🇹', yt:'vDXnvObv-Kc' },
  { id:'venice',        name:'VENICE',         region:'EUROPE',     flag:'🛶', yt:'iKO8Bc1MYh4' },
  { id:'barcelona',     name:'BARCELONA',      region:'EUROPE',     flag:'🇪🇸', yt:'Ala-qjSfjfA' },
  { id:'amsterdam',     name:'AMSTERDAM',      region:'EUROPE',     flag:'🇳🇱', yt:'fe5Vo9U0FJE' },
  { id:'prague',        name:'PRAGUE',         region:'EUROPE',     flag:'🇨🇿', yt:'5SPkiyhTyPU' },
  { id:'vienna',        name:'VIENNA',         region:'EUROPE',     flag:'🇦🇹', yt:'k8V4WmZ9B9U' },
  { id:'berlin',        name:'BERLIN',         region:'EUROPE',     flag:'🇩🇪', yt:'83I2LjxPepo' },
  { id:'lisbon',        name:'LISBON',         region:'EUROPE',     flag:'🇵🇹', yt:'Wym4G2yYgcU' },
  { id:'madrid',        name:'MADRID',         region:'EUROPE',     flag:'🇪🇸', yt:'AcErW-_7fPs' },
  { id:'stockholm',     name:'STOCKHOLM',      region:'EUROPE',     flag:'🇸🇪', yt:'Ala-qjSfjfA' },
  { id:'copenhagen',    name:'COPENHAGEN',     region:'EUROPE',     flag:'🇩🇰', yt:'fe5Vo9U0FJE' },
  { id:'zurich',        name:'ZURICH',         region:'EUROPE',     flag:'🇨🇭', yt:'5SPkiyhTyPU' },
  { id:'athens',        name:'ATHENS',         region:'EUROPE',     flag:'🇬🇷', yt:'vDXnvObv-Kc' },
  { id:'iceland',       name:'ICELAND',        region:'EUROPE',     flag:'🇮🇸', yt:'6avYY4UgeDE' },
  { id:'marrakech',     name:'MARRAKECH',      region:'AFRICA',     flag:'🇲🇦', yt:'306Om81hN2E' },
  { id:'cairo',         name:'CAIRO',          region:'AFRICA',     flag:'🇪🇬', yt:'Zjmf0ZmDeJc' },
  { id:'cape-town',     name:'CAPE TOWN',      region:'AFRICA',     flag:'🇿🇦', yt:'BSxV9nUfDAU' },
  { id:'lagos',         name:'LAGOS',          region:'AFRICA',     flag:'🇳🇬', yt:'k8V4WmZ9B9U' },
  { id:'nairobi',       name:'NAIROBI',        region:'AFRICA',     flag:'🇰🇪', yt:'AcErW-_7fPs' },
  { id:'sydney',        name:'SYDNEY',         region:'OCEANIA',    flag:'🇦🇺', yt:'V80gUbDBIkY' },
  // ---- WINDOW VIEWS (looking out from a window or moving vehicle) ----
  { id:'cafe-window',    name:'CAFÉ WINDOW',    region:'WINDOW VIEWS', flag:'🪟', yt:'fpCXdbVKUpU' },
  { id:'city-window',    name:'CITY WINDOW',    region:'WINDOW VIEWS', flag:'🌧️', yt:'dcEiFOLXy0c' },
  { id:'tokyo-window',   name:'TOKYO WINDOW',   region:'WINDOW VIEWS', flag:'🪟', yt:'muhDo8A4Y0M' },
  { id:'paris-window',   name:'PARIS WINDOW',   region:'WINDOW VIEWS', flag:'🪟', yt:'rchqJlo1jQs' },
  { id:'ny-window',      name:'NY APARTMENT',   region:'WINDOW VIEWS', flag:'🪟', yt:'Vg1mpD1BICI' },
  { id:'rainy-window',   name:'RAINY WINDOW',   region:'WINDOW VIEWS', flag:'🌧️', yt:'fe5Vo9U0FJE' },
  { id:'snow-window',    name:'SNOW WINDOW',    region:'WINDOW VIEWS', flag:'❄️', yt:'q8LftkEPExQ' },
  { id:'train-window',   name:'TRAIN WINDOW',   region:'WINDOW VIEWS', flag:'🚆', yt:'Fwpf750QNDM' },
  { id:'night-train',    name:'NIGHT TRAIN',    region:'WINDOW VIEWS', flag:'🌙', yt:'vCvVOmGUQrE' },
  { id:'beach-window',   name:'BEACH WINDOW',   region:'WINDOW VIEWS', flag:'🌊', yt:'oGDivi8uFSg' },
  { id:'mountain-window',name:'MOUNTAIN VIEW',  region:'WINDOW VIEWS', flag:'⛰️', yt:'PJFucUS3H0E' },
  { id:'airport-window', name:'AIRPORT LOUNGE', region:'WINDOW VIEWS', flag:'✈️', yt:'kAM7wnaF6KM' },
  { id:'seoul-window',   name:'SEOUL WINDOW',   region:'WINDOW VIEWS', flag:'🪟', yt:'P28De9FyTrM' },
  { id:'london-window',  name:'LONDON WINDOW',  region:'WINDOW VIEWS', flag:'🪟', yt:'1HcEkN_290Q' },
  { id:'dubai-window',   name:'DUBAI WINDOW',   region:'WINDOW VIEWS', flag:'🪟', yt:'kfjNzIYQnBk' },
  // ---- COZY SPACES (more) ----
  { id:'cabin',          name:'COZY CABIN',     region:'SPACES',       flag:'🏠', yt:'R2SKRKWl0iE' },
  { id:'bookshop',       name:'BOOKSHOP',       region:'SPACES',       flag:'📖', yt:'Z-nH7-WZAbw' },
  { id:'night-balcony',  name:'NIGHT BALCONY',  region:'SPACES',       flag:'🌙', yt:'aE2si1UQvGE' },
  { id:'jazz-bar',       name:'JAZZ BAR',       region:'SPACES',       flag:'🎷', yt:'Dx5qFachd3A' },
  { id:'greenhouse',     name:'GREENHOUSE',     region:'SPACES',       flag:'🌿', yt:'zaO7cnhQwzw' },
  // ---- VIBES (ambient real-world scenes) ----
  { id:'rain',           name:'RAIN',           region:'VIBES',        flag:'🌧️', yt:'LRxy_PI4pEg' },
  { id:'forest',         name:'FOREST',         region:'VIBES',        flag:'🌲', yt:'XxP8kxUn5bc' },
  { id:'campfire',       name:'CAMPFIRE',       region:'VIBES',        flag:'🔥', yt:'9lh_becOt4Y' },
  { id:'waterfall',      name:'WATERFALL',      region:'VIBES',        flag:'🏞️', yt:'vemLEwjIxow' },
  { id:'earth',          name:'PLANET EARTH',   region:'VIBES',        flag:'🌍', yt:'AKeUssuu3Is' },
  { id:'ocean',          name:'OCEAN WAVES',    region:'VIBES',        flag:'🌊', yt:'DN7MiqJfvAw' },
  { id:'thunderstorm',   name:'THUNDERSTORM',   region:'VIBES',        flag:'⛈️', yt:'nDq6TstdEi8' },
  { id:'aurora',         name:'AURORA',         region:'VIBES',        flag:'🌌', yt:'N57TZyNmXr8' },
  { id:'cherry-blossom', name:'CHERRY BLOSSOM', region:'VIBES',        flag:'🌸', yt:'Ar2gh0E1csY' },
  { id:'snowfall',       name:'SNOWFALL',       region:'VIBES',        flag:'❄️', yt:'ch7ccx7WRFo' },
  { id:'starry-night',   name:'STARRY NIGHT',   region:'VIBES',        flag:'✨', yt:'xNN7iTA57jM' },
  { id:'underwater',     name:'UNDERWATER',     region:'VIBES',        flag:'🐠', yt:'G52dUQLxPzg' },
  { id:'desert-night',   name:'DESERT NIGHT',   region:'VIBES',        flag:'🌙', yt:'spNWBdWk1Ss' },
];

/* YouTube thumbnail — mqdefault is true 16:9 with NO black bars (hqdefault has
   letterbox bars baked in), so it fills the card cleanly. */
function studyPosterURL(loc) {
  return `https://img.youtube.com/vi/${loc.yt}/mqdefault.jpg`;
}

/* Plain embed — loads reliably even on slow networks. controls=0 + disablekb=1
   + fs=0 hide all UI; the iframe also gets pointer-events:none in CSS, so the
   video can't be tapped, paused or scrubbed — it's just footage playing.
   mute=1 guarantees autoplay starts; we then try to unmute via postMessage. */
function studyEmbedURL(loc) {
  return `https://www.youtube.com/embed/${loc.yt}?autoplay=1&mute=1&loop=1&playlist=${loc.yt}&controls=0&disablekb=1&fs=0&enablejsapi=1&playsinline=1&rel=0&modestbranding=1&iv_load_policy=3`;
}

function studySendCmd(func, args) {
  const frame = document.getElementById('study-video');
  if (!frame || !frame.contentWindow) return;
  try { frame.contentWindow.postMessage(JSON.stringify({ event: 'command', func, args: args || [] }), '*'); } catch (_) {}
}

function studyUnmute() {
  studySendCmd('unMute'); studySendCmd('setVolume', [100]); studySendCmd('playVideo');
  studyState.muted = false;
  const btn = document.getElementById('study-sound-btn');
  if (btn) btn.classList.remove('muted');
}

function toggleStudySound() {
  if (studyState.muted) {
    studyUnmute();
  } else {
    studySendCmd('mute');
    studyState.muted = true;
    const btn = document.getElementById('study-sound-btn');
    if (btn) btn.classList.add('muted');
  }
}

const studyState = {
  active: false,
  muted: true,
  clockInterval: null,
  chatHistory: [],
  wakeRec: null,
  wakeActive: false,
  micRec: null,
};

function setupStudyMode() {
  // Grid back button
  const gridBack = document.getElementById('study-grid-back-btn');
  if (gridBack) gridBack.addEventListener('click', () => switchTab('tab-gamehub'));

  // Grid search
  const searchInput = document.getElementById('study-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.trim().toLowerCase();
      renderStudyGrid(q
        ? STUDY_LOCATIONS.filter(l => l.name.toLowerCase().includes(q) || l.region.toLowerCase().includes(q))
        : STUDY_LOCATIONS
      );
    });
  }

  // Video overlay back button
  const videoBack = document.getElementById('study-back-btn');
  if (videoBack) videoBack.addEventListener('click', closeStudyVideo);

  // Sound toggle (the video itself is non-interactive, so sound lives here)
  const soundBtn = document.getElementById('study-sound-btn');
  if (soundBtn) soundBtn.addEventListener('click', toggleStudySound);

  // Mini chat controls
  const minBtn  = document.getElementById('study-chat-min');
  const head    = document.getElementById('study-chat-head');
  const sendBtn = document.getElementById('study-send-btn');
  const input   = document.getElementById('study-input');
  const micBtn  = document.getElementById('study-mic-btn');

  if (minBtn)  minBtn.addEventListener('click',  (e) => { e.stopPropagation(); toggleStudyChat(); });
  if (head)    head.addEventListener('click',    () => { const c = document.getElementById('study-chat'); if (c && c.classList.contains('minimized')) toggleStudyChat(); });
  if (sendBtn) sendBtn.addEventListener('click', sendStudyMessage);
  if (input)   input.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendStudyMessage(); });
  if (micBtn)  micBtn.addEventListener('click',  triggerStudyMic);

  // Pomodoro timer
  const pomoBtn = document.getElementById('study-pomo-btn');
  if (pomoBtn) pomoBtn.addEventListener('click', togglePomodoro);
}

/* ============ Pomodoro + focus stats ============ */

const POMO_MINUTES = 25;
let pomoEndsAt = null, pomoInterval = null;

function togglePomodoro() {
  if (pomoEndsAt) { stopPomodoro(); return; }
  pomoEndsAt = Date.now() + POMO_MINUTES * 60000;
  document.getElementById('study-pomo-btn')?.classList.add('active');
  const display = document.getElementById('study-pomo-display');
  if (display) display.style.display = '';
  pomoInterval = setInterval(() => {
    const left = pomoEndsAt - Date.now();
    if (left <= 0) {
      stopPomodoro();
      buzz(300);
      recordFocusMinutes(POMO_MINUTES);
      if (App.settings.voiceEnabled) speak('Pomodoro complete. Time for a five minute break.');
      appendStudyMsg('ai', '🍅 Pomodoro complete — take a 5 minute break!');
      return;
    }
    const m = Math.floor(left / 60000), s = Math.floor((left % 60000) / 1000);
    if (display) display.textContent = `🍅 ${m}:${String(s).padStart(2, '0')}`;
  }, 500);
}

function stopPomodoro() {
  if (pomoInterval) { clearInterval(pomoInterval); pomoInterval = null; }
  pomoEndsAt = null;
  document.getElementById('study-pomo-btn')?.classList.remove('active');
  const display = document.getElementById('study-pomo-display');
  if (display) { display.style.display = 'none'; display.textContent = ''; }
}

/* Focus stats — minutes per day + streak, stored per user */
function focusStats() {
  try { return JSON.parse(localStorage.getItem(userKey('focusStats'))) || {}; } catch(_) { return {}; }
}
function recordFocusMinutes(mins) {
  const stats = focusStats();
  const key = new Date().toISOString().slice(0, 10);
  stats[key] = (stats[key] || 0) + mins;
  try { localStorage.setItem(userKey('focusStats'), JSON.stringify(stats)); } catch(_) {}
}
function focusStreak(stats) {
  let streak = 0;
  const d = new Date();
  for (;;) {
    const key = d.toISOString().slice(0, 10);
    if (stats[key] > 0) { streak++; d.setDate(d.getDate() - 1); }
    else break;
  }
  return streak;
}
function renderFocusStats() {
  const el = document.getElementById('study-stats-line');
  if (!el) return;
  const stats = focusStats();
  const today = stats[new Date().toISOString().slice(0, 10)] || 0;
  const week = Object.entries(stats).reduce((sum, [k, v]) =>
    (Date.now() - new Date(k).getTime() < 7 * 86400000) ? sum + v : sum, 0);
  const streak = focusStreak(stats);
  el.textContent = `🍅 Today ${today}m · Week ${week}m${streak > 1 ? ` · ${streak}🔥 day streak` : ''}`;
}

/* openStudyPanel — called from STUDY pill, shows the location grid */
function openStudyPanel() {
  switchTab('tab-study-grid');
  renderStudyGrid(STUDY_LOCATIONS);
  renderFocusStats();
  const s = document.getElementById('study-search-input');
  if (s) s.value = '';
}


/* openStudyVideo — called when a location card is clicked */
function openStudyVideo(loc) {
  const overlay = document.getElementById('study-overlay');
  if (!overlay) return;
  overlay.style.display = 'block';
  studyState.active = true;
  studyState.sessionStart = Date.now();
  studyState.chatHistory = [];

  // Reset chat to welcome
  const msgs = document.getElementById('study-msgs');
  if (msgs) msgs.innerHTML = `<div class="study-msg study-msg-ai"><span>Now in <strong>${loc.flag} ${loc.name}</strong>. Ask me anything, or say <strong>"Hey VOID"</strong> 🎤</span></div>`;

  // Real footage via YouTube embed (loads reliably on slow networks). Thumbnail
  // + gradient show underneath while it buffers; we try to unmute once it loads.
  const grad = REGION_GRADIENTS[loc.region] || 'linear-gradient(135deg,#111418 0%,#1c2028 100%)';
  overlay.style.background = `url('${studyPosterURL(loc)}') center/cover no-repeat, ${grad}`;
  const frame = document.getElementById('study-video');
  if (frame) {
    frame.src = studyEmbedURL(loc);
    // try to start sound automatically; if the browser blocks it, the sound
    // button in the top bar lets the user enable it with one tap.
    frame.onload = () => { studyUnmute(); setTimeout(studyUnmute, 1200); };
  }

  // Max-only: live city time + weather in the overlay
  const cityLiveEl = document.getElementById('study-city-live');
  if (cityLiveEl) {
    if (isMax()) {
      const tz = CITY_TZ[loc.id];
      let cityTime = '';
      if (tz) {
        try { cityTime = new Date().toLocaleTimeString('en-US', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }); } catch(_) {}
      }
      cityLiveEl.textContent = `${loc.flag} ${loc.name}${cityTime ? ' · ' + cityTime : ''} · fetching...`;
      cityLiveEl.style.display = '';
      fetch(`https://wttr.in/${encodeURIComponent(loc.name)}?format=%c%t`)
        .then(r => r.ok ? r.text() : null)
        .then(w => {
          const wt = w?.trim();
          if (wt && !wt.includes('<') && wt.length < 30) cityLiveEl.textContent = `${loc.flag} ${loc.name}${cityTime ? ' · ' + cityTime : ''} · ${wt}`;
        })
        .catch(() => {
          cityLiveEl.textContent = `${loc.flag} ${loc.name}${cityTime ? ' · ' + cityTime : ''}`;
        });
    } else {
      cityLiveEl.style.display = 'none';
      cityLiveEl.textContent = '';
    }
  }

  startStudyClock();
  startWakeWord();
}

function closeStudyVideo() {
  const overlay = document.getElementById('study-overlay');
  if (!overlay) return;
  overlay.style.display = 'none';
  overlay.setAttribute('aria-hidden', 'true');
  studyState.active = false;

  // Log the session's focus minutes and stop any running pomodoro
  if (studyState.sessionStart) {
    const mins = Math.floor((Date.now() - studyState.sessionStart) / 60000);
    if (mins >= 1) recordFocusMinutes(mins);
    studyState.sessionStart = null;
  }
  stopPomodoro();
  renderFocusStats();

  if (studyState.clockInterval) { clearInterval(studyState.clockInterval); studyState.clockInterval = null; }
  stopWakeWord();
  const frame = document.getElementById('study-video');
  if (frame) { frame.onload = null; frame.src = ''; }
  overlay.style.background = '';

  switchTab('tab-study-grid');
}

const REGION_GRADIENTS = {
  'SPACES':      'linear-gradient(135deg,#2a1500 0%,#7a4a1a 60%,#1a0d00 100%)',
  'VIBES':       'linear-gradient(135deg,#1a0533 0%,#3d1a78 60%,#1a0a2e 100%)',
  'JAPAN':       'linear-gradient(135deg,#1a0508 0%,#5c1a2a 60%,#2a0a10 100%)',
  'EAST ASIA':   'linear-gradient(135deg,#050d1f 0%,#0f2d5c 60%,#0a1828 100%)',
  'SE ASIA':     'linear-gradient(135deg,#061208 0%,#1a4a1f 60%,#0a2010 100%)',
  'MIDDLE EAST': 'linear-gradient(135deg,#1a0d00 0%,#5c3000 60%,#2a1500 100%)',
  'SOUTH ASIA':  'linear-gradient(135deg,#1a0800 0%,#5c2000 60%,#2a1000 100%)',
  'EUROPE':      'linear-gradient(135deg,#04080f 0%,#0d1f3c 60%,#0a1428 100%)',
  'AMERICAS':    'linear-gradient(135deg,#04050f 0%,#0d0f3c 60%,#080a28 100%)',
  'AFRICA':      'linear-gradient(135deg,#150800 0%,#4a1e00 60%,#200e00 100%)',
  'OCEANIA':     'linear-gradient(135deg,#001418 0%,#00404a 60%,#001c22 100%)',
};

/* renderStudyGrid — builds the location card grid */
function renderStudyGrid(locs) {
  const grid = document.getElementById('study-loc-grid');
  if (!grid) return;
  if (!locs.length) {
    grid.innerHTML = `<p class="muted small" style="padding:20px 4px;grid-column:1/-1;">No locations found.</p>`;
    return;
  }
  // Grid + square cards are styled INLINE here so they can't be broken by a
  // stale/missing stylesheet — inline styles always win. padding-top:100% on a
  // relative box is a bulletproof square; the image fills it absolutely.
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(140px, 1fr))';
  grid.style.gap = '12px';
  grid.style.alignContent = 'start';

  const cardCSS = 'position:relative;width:100%;padding-top:100%;height:0;border-radius:14px;overflow:hidden;background:#111418;cursor:pointer;border:1px solid rgba(255,255,255,0.08)';
  const imgCSS  = 'position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover';
  const ovCSS   = 'position:absolute;left:0;right:0;bottom:0;padding:18px 8px 8px;background:linear-gradient(to top,rgba(0,0,0,0.92) 0%,rgba(0,0,0,0.4) 55%,transparent 100%)';
  const titleCSS= 'font-family:var(--hub-display);font-weight:800;font-size:13px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:0 1px 4px rgba(0,0,0,0.8)';
  const subCSS  = 'font-size:9px;color:rgba(255,255,255,0.6);letter-spacing:0.04em;margin-top:2px';

  const pro = isPro();
  const max = isMax();
  const lockCSS = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.55);backdrop-filter:blur(2px);';
  const badgeCSS = 'font-family:var(--hub-display);font-weight:800;font-size:10px;letter-spacing:0.08em;color:#fff;background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.4);padding:4px 10px;border-radius:12px;';

  grid.innerHTML = locs.map((loc) => {
    // free users: only the first FREE_STUDY_LIMIT locations are unlocked
    const fullIdx = STUDY_LOCATIONS.indexOf(loc);
    const locked = !pro && fullIdx >= FREE_STUDY_LIMIT;
    const cityTime = max ? getCityTime(loc.id) : '';
    const subText = max && cityTime ? `${loc.region} · ${cityTime}` : loc.region;
    return `
    <div class="study-tile" data-loc-id="${loc.id}" data-locked="${locked ? '1' : ''}" role="button" tabindex="0" aria-label="${loc.name}" style="${cardCSS}">
      <img src="${studyPosterURL(loc)}" alt="${loc.name}" loading="lazy" style="${imgCSS}" onerror="this.style.display='none';">
      <div style="${ovCSS}">
        <div style="${titleCSS}">${loc.flag} ${loc.name}</div>
        <div class="study-tile-sub" data-loc-id="${loc.id}" style="${subCSS}">${subText}</div>
      </div>
      ${locked ? `<div style="${lockCSS}"><span style="${badgeCSS}">🔒 PRO</span></div>` : ''}
    </div>`;
  }).join('');

  grid.querySelectorAll('.study-tile').forEach(card => {
    const handler = () => {
      if (card.dataset.locked === '1') { openBilling(); return; }
      const loc = STUDY_LOCATIONS.find(l => l.id === card.dataset.locId);
      if (loc) openStudyVideo(loc);
    };
    card.addEventListener('click', handler);
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') handler(); });
  });

  // Update city times every 60 seconds for Max users
  if (max) {
    if (grid._cityTimeInterval) clearInterval(grid._cityTimeInterval);
    grid._cityTimeInterval = setInterval(() => {
      grid.querySelectorAll('.study-tile-sub[data-loc-id]').forEach(el => {
        const id = el.dataset.locId;
        const loc = STUDY_LOCATIONS.find(l => l.id === id);
        if (!loc) return;
        const t = getCityTime(id);
        el.textContent = t ? `${loc.region} · ${t}` : loc.region;
      });
    }, 60000);
  }
}

/* Clock */
function startStudyClock() {
  if (studyState.clockInterval) clearInterval(studyState.clockInterval);
  const DAYS   = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];
  const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  function tick() {
    const now = new Date();
    const clockEl = document.getElementById('study-clock');
    const dateEl  = document.getElementById('study-date');
    if (clockEl) clockEl.textContent = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
    if (dateEl)  dateEl.textContent  = `${DAYS[now.getDay()]} · ${MONTHS[now.getMonth()]} ${now.getDate()}`;
  }
  tick();
  studyState.clockInterval = setInterval(tick, 1000);
}

/* Wake Word */
function startWakeWord() {
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRec) return;
  try {
    const rec = new SpeechRec();
    rec.continuous = true; rec.interimResults = true; rec.lang = 'en-US';
    rec.onresult = (e) => {
      const t = Array.from(e.results).map(r => r[0].transcript.toLowerCase()).join(' ');
      if (t.includes('hey void') || t.includes('heyvoid') || t.includes('hey, void')) onWakeWordDetected();
    };
    rec.onend = () => { if (studyState.active) { try { rec.start(); } catch(_) {} } };
    rec.onerror = (e) => { if (e.error !== 'no-speech') updateWakePill(false); };
    rec.start();
    studyState.wakeRec = rec; studyState.wakeActive = true; updateWakePill(true);
  } catch(_) {}
}

function stopWakeWord() {
  if (studyState.wakeRec) { try { studyState.wakeRec.stop(); } catch(_) {} studyState.wakeRec = null; }
  studyState.wakeActive = false; updateWakePill(false);
}

function updateWakePill(on) {
  const pill = document.getElementById('study-wake-pill');
  if (pill) pill.classList.toggle('listening', on);
}

function onWakeWordDetected() {
  const chat = document.getElementById('study-chat');
  if (chat) chat.classList.remove('minimized');
  const minBtn = document.getElementById('study-chat-min');
  if (minBtn) minBtn.textContent = '−';
  triggerStudyMic();
}

/* Chat toggle */
function toggleStudyChat() {
  const chat   = document.getElementById('study-chat');
  const minBtn = document.getElementById('study-chat-min');
  if (!chat) return;
  const minimized = chat.classList.toggle('minimized');
  if (minBtn) minBtn.textContent = minimized ? '+' : '−';
}

/* Mic in study mode */
function triggerStudyMic() {
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  const btn = document.getElementById('study-mic-btn');
  if (!SpeechRec) return;
  if (studyState.micRec) {
    try { studyState.micRec.stop(); } catch(_) {}
    studyState.micRec = null;
    if (btn) btn.classList.remove('active');
    return;
  }
  const rec = new SpeechRec();
  rec.lang = getSTTLang(); rec.interimResults = false;
  rec.onresult = (e) => {
    const transcript = e.results[0][0].transcript;
    const input = document.getElementById('study-input');
    if (input) { input.value = transcript; sendStudyMessage(); }
  };
  rec.onend  = () => { studyState.micRec = null; if (btn) btn.classList.remove('active'); };
  rec.onerror= () => { studyState.micRec = null; if (btn) btn.classList.remove('active'); };
  rec.start();
  studyState.micRec = rec;
  if (btn) btn.classList.add('active');
}

/* Study chat AI */
async function sendStudyMessage() {
  const input = document.getElementById('study-input');
  const msgs  = document.getElementById('study-msgs');
  if (!input || !msgs) return;
  const text = input.value.trim();
  if (!text) return;
  input.value = '';

  appendStudyMsg('user', text);
  studyState.chatHistory.push({ role: 'user', content: text });

  const typingEl = document.createElement('div');
  typingEl.className = 'study-msg study-msg-ai';
  typingEl.innerHTML = '<span style="opacity:0.45">…</span>';
  msgs.appendChild(typingEl);
  msgs.scrollTop = msgs.scrollHeight;

  const messages = [
    { role: 'system', content: buildSystemPrompt() + '\n\nThe user is studying. Keep responses brief and focused.' },
    ...studyState.chatHistory.slice(-10),
  ];

  let reply = null;
  try { if (VOID_CORE_API.url) reply = await callOpenAICompat(VOID_CORE_API.url, VOID_CORE_API.key, VOID_CORE_API.model, messages); } catch(_) {}
  if (!reply && App.settings.geminiKey) { try { reply = await callGemini(messages); } catch(_) {} }
  if (!reply) reply = "Can't reach VOID right now.";

  studyState.chatHistory.push({ role: 'assistant', content: reply });
  typingEl.remove();
  appendStudyMsg('ai', reply);
}

function appendStudyMsg(role, text) {
  const msgs = document.getElementById('study-msgs');
  if (!msgs) return;
  const div = document.createElement('div');
  div.className = `study-msg study-msg-${role === 'user' ? 'user' : 'ai'}`;
  div.innerHTML = `<span>${text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</span>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function renderHeroGrid(heroes) {
  const grid = document.getElementById('hero-grid');
  if (!grid) return;
  if (heroes.length === 0) {
    grid.innerHTML = `<p class="muted small" style="padding:20px 4px;">No matching hero files found.</p>`;
    return;
  }
  grid.innerHTML = heroes.map(h => `
    <div class="hub-card" data-hero-id="${h.id}">
      <div class="hub-card-media">
        <img src="${h.img}" alt="${h.name}" class="hub-card-img" onerror="this.style.display='none';">
        ${h.tier ? `<div class="hero-tier-badge tier-${h.tier}">${h.tier}</div>` : ''}
        <div class="hub-card-overlay">
          <div class="hub-card-title">${h.name}</div>
          <div class="hub-card-sub">${h.role}</div>
        </div>
      </div>
    </div>
  `).join('');

  grid.querySelectorAll('.hub-card').forEach(card => {
    card.addEventListener('click', () => openHeroDetail(card.dataset.heroId));
  });
}

function renderTypeGrid(gridId, items) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  if (items.length === 0) {
    grid.innerHTML = `<p class="muted small" style="padding:20px 4px;">No matching item cores found.</p>`;
    return;
  }
  grid.innerHTML = items.map(i => `
    <div class="hub-card" data-item-id="${i.id}">
      <div class="hub-card-media" data-item-type="${i.type}">
        <img src="${i.img}" alt="${i.name}" class="hub-card-img" referrerpolicy="no-referrer"
          onerror="this.onerror=null;this.style.display='none';this.parentElement.classList.add('item-img-fallback')" loading="lazy">
        <div class="hub-card-overlay">
          <div class="hub-card-title">${i.name}</div>
          <div class="hub-card-sub">${i.type}</div>
        </div>
      </div>
    </div>
  `).join('');
  grid.querySelectorAll('.hub-card').forEach(card => {
    card.addEventListener('click', () => openItemDetail(card.dataset.itemId));
  });
}

function renderAllItemGrids(items) {
  renderTypeGrid('item-grid-physical',  items.filter(i => i.type === 'Physical'));
  renderTypeGrid('item-grid-magic',     items.filter(i => i.type === 'Magic'));
  renderTypeGrid('item-grid-defense',   items.filter(i => i.type === 'Defense'));
  renderTypeGrid('item-grid-movement',  items.filter(i => i.type === 'Movement'));
}

function findHero(id) { return GameHubData.heroes.find(h => h.id === id); }
function findItem(id) { return GameHubData.items.find(i => i.id === id); }

function statTileHTML(label, name, img) {
  return `
    <div class="hub-detail-stat-tile hub-detail-stat-tile-clickable" data-stat-name="${name}">
      ${img ? `<img class="hub-detail-stat-tile-img" src="${img}" alt="" onerror="this.style.display='none'">` : ''}
      <div class="hub-detail-stat-tile-text">
        <span class="hub-detail-stat-label">${label}</span>
        <span class="hub-detail-stat-value">${name}</span>
      </div>
    </div>
  `;
}

function attrBarHTML(label, value, color) {
  return `
    <div class="hd-attr-row">
      <span class="hd-attr-label">${label}</span>
      <div class="hd-attr-bar"><div class="hd-attr-fill" style="width:${value}%;background:${color}"></div></div>
      <span class="hd-attr-value" style="color:${color}">${value}</span>
    </div>`;
}

function openHeroDetail(id) {
  const hero = findHero(id);
  if (!hero) return;
  App.hubDetailReturnTab = 'tab-gamehub';

  document.getElementById('hub-detail-header-title').textContent = hero.name.toUpperCase();

  const heroIndex = GameHubData.heroes.findIndex(h => h.id === id) + 1;
  const fileId = `HF-${String(heroIndex).padStart(3, '0')}`;
  const subtitle = hero.subtitle || '';

  const tierTag = hero.tier ? `<span class="hd-tag tag-tier-${hero.tier.toLowerCase()}">${hero.tier === 'S' ? 'TIER S' : hero.tier + ' TIER'}</span>` : '';
  const roleTag = `<span class="hd-tag tag-role">${hero.role.toUpperCase()}</span>`;
  const laneTag = hero.lane ? `<span class="hd-tag tag-lane">${hero.lane.toUpperCase()}</span>` : '';

  const diffLabel = hero.difficulty >= 80 ? 'HARD' : hero.difficulty >= 50 ? 'MEDIUM' : 'EASY';
  const diffClass = diffLabel === 'EASY' ? 'diff-easy' : diffLabel === 'HARD' ? 'diff-hard' : '';
  const diffTag = hero.difficulty != null ? `<span class="hd-tag tag-diff ${diffClass}">${diffLabel}</span>` : '';

  const atGlance = (hero.winRate != null) ? `
    <div class="hd-section-card hd-glance-card">
      <div class="hd-section-label">AT A GLANCE <span class="hd-live-dot"></span></div>
      <div class="hd-glance-row">
        <div class="hd-glance-stat">
          <span class="hd-glance-label">WIN RATE</span>
          <span class="hd-glance-value wr-color">${hero.winRate}%</span>
        </div>
        <div class="hd-glance-divider"></div>
        <div class="hd-glance-stat">
          <span class="hd-glance-label">PICK RATE</span>
          <span class="hd-glance-value">${hero.pickRate}%</span>
        </div>
        <div class="hd-glance-divider"></div>
        <div class="hd-glance-stat">
          <span class="hd-glance-label">BAN RATE</span>
          <span class="hd-glance-value br-color">${hero.banRate}%</span>
        </div>
      </div>
    </div>` : '';

  const dur = hero.durability ?? 50;
  const off = hero.offense ?? 50;
  const ctrl = hero.control ?? 50;
  const diff = hero.difficulty ?? 50;
  const overviewPane = `
    ${hero.desc ? `<div class="hd-section-card"><p class="hd-desc-para">${hero.desc}</p></div>` : ''}
    ${atGlance}
    <div class="hd-section-card">
      <div class="hd-section-label">ATTRIBUTES</div>
      ${attrBarHTML('DURABILITY', dur, '#4fc3f7')}
      ${attrBarHTML('OFFENSE', off, '#ff6b35')}
      ${attrBarHTML('CONTROL', ctrl, '#4caf50')}
      ${attrBarHTML('DIFFICULTY', diff, '#ab47bc')}
    </div>`;

  const buildEntries = Object.entries(hero.builds || {});
  const buildsPane = buildEntries.map(([buildName, itemIds]) => `
    <div class="hd-section-card">
      <div class="hd-section-label">${buildName.toUpperCase()}</div>
      <div class="hd-build-circles">
        ${itemIds.map(iid => {
          const item = findItem(iid);
          return item ? `
            <div class="hd-build-item hub-detail-stat-tile-clickable" data-stat-name="${item.name}">
              <div class="hd-build-icon"><img src="${item.img}" alt="${item.name}" referrerpolicy="no-referrer" onerror="this.style.opacity='0'"></div>
              <span class="hd-build-name">${item.name}</span>
            </div>` : '';
        }).join('')}
      </div>
    </div>`).join('');

  const ytSearch = `https://www.youtube.com/results?search_query=mlbb+${encodeURIComponent(hero.name)}+combo+montage+player+2025`;
  const comboVid = (typeof HERO_COMBO_VIDEOS !== 'undefined' && HERO_COMBO_VIDEOS[hero.id]) || null;
  const comboCard = `
    <div class="hd-section-card">
      <div class="hd-section-label">COMBOS</div>
      ${comboVid ? `<div class="combo-video-wrap"><iframe src="https://www.youtube.com/embed/${comboVid}?rel=0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>` : ''}
      <a class="combo-yt-btn" href="${ytSearch}" target="_blank" rel="noopener noreferrer">▶ WATCH COMBO VIDEOS</a>
    </div>`;

  // Use scraped weakAgainst data preferably, fall back to counters array
  const weakList = (hero.weakAgainst && hero.weakAgainst.length)
    ? hero.weakAgainst
    : (hero.counters || []).map(cId => {
        const c = findHero(cId); const it = findItem(cId);
        return c ? {slug: c.id, name: c.name, wr: null, img: c.img}
             : it ? {slug: it.id, name: it.name, wr: null, img: it.img, isItem: true}
             : {slug: cId, name: cId.replace(/_/g,' '), wr: null};
      });

  const counterRowHTML = (entry, type) => {
    const targetHero = findHero(entry.slug);
    const targetItem = findItem(entry.slug);
    const imgSrc = entry.img || (targetHero ? targetHero.img : targetItem ? targetItem.img : '');
    const isWeak = type === 'weak';
    return `
      <div class="hd-counter-row">
        <img class="hd-counter-portrait" src="${imgSrc}" alt="${entry.name}" referrerpolicy="no-referrer" onerror="this.style.opacity='0'">
        <span class="hd-counter-name">${entry.name}</span>
        ${entry.wr != null ? `<span class="hd-counter-wr ${isWeak ? 'wr-bad' : 'wr-good'}">${entry.wr}% WR</span>` : `<span class="hd-counter-type">${isWeak ? 'COUNTER' : 'WEAK TO'}</span>`}
      </div>`;
  };

  const weakRows = weakList.map(e => counterRowHTML(e, 'weak')).join('');
  const strongList = hero.strongAgainst || [];
  const strongRows = strongList.map(e => counterRowHTML(e, 'strong')).join('');

  const countersPane = `
    ${weakRows ? `<div class="hd-section-card hd-counter-list">
      <div class="hd-section-label">WEAK AGAINST</div>
      ${weakRows}
    </div>` : ''}
    ${strongRows ? `<div class="hd-section-card hd-counter-list">
      <div class="hd-section-label">STRONG AGAINST</div>
      ${strongRows}
    </div>` : '<p class="muted small">No counter data available.</p>'}
  `;

  document.getElementById('hub-detail-content').innerHTML = `
    <div class="hd-file-header">
      <span class="hd-file-id">HERO FILE · ${fileId}</span>
      <span class="hd-file-updated">UPDATED · JAN 15, 2026</span>
    </div>
    <div class="hd-banner" style="background-image:url('${hero.img}')">
      <div class="hd-banner-gradient"></div>
    </div>
    <div class="hd-identity-row">
      <img class="hd-portrait" src="${hero.img}" alt="${hero.name}" referrerpolicy="no-referrer" onerror="this.style.display='none'">
      <div class="hd-identity-text">
        <div class="hd-codename-label">CODENAME</div>
        <div class="hd-identity-name">${hero.name.toUpperCase()}</div>
        ${subtitle ? `<div class="hd-identity-subtitle">${subtitle}</div>` : ''}
        <div class="hd-tags">${tierTag}${roleTag}${laneTag}${diffTag}</div>
      </div>
    </div>
    <div class="hd-tabs">
      <button class="hd-tab active" data-hdtab="overview">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style="flex-shrink:0"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
        OVERVIEW
      </button>
      <button class="hd-tab" data-hdtab="builds">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="flex-shrink:0"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        BUILDS
      </button>
      <button class="hd-tab" data-hdtab="counters">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/></svg>
        COUNTERS
      </button>
    </div>
    <div class="hd-pane" id="hd-pane-overview">${overviewPane}</div>
    <div class="hd-pane" id="hd-pane-builds" style="display:none">${buildsPane}${comboCard}</div>
    <div class="hd-pane" id="hd-pane-counters" style="display:none">${countersPane}</div>
  `;

  document.getElementById('hub-detail-content').querySelectorAll('.hd-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('hub-detail-content').querySelectorAll('.hd-tab').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      ['overview','builds','counters'].forEach(p => {
        const el = document.getElementById(`hd-pane-${p}`);
        if (el) el.style.display = p === btn.dataset.hdtab ? '' : 'none';
      });
    });
  });

  bindStatTileNav();
  switchTabRaw('tab-hub-detail');
}

function openItemDetail(id) {
  const item = findItem(id);
  if (!item) return;
  App.hubDetailReturnTab = 'tab-gamehub';

  document.getElementById('hub-detail-header-title').textContent = item.name.toUpperCase();

  document.getElementById('hub-detail-content').innerHTML = `
    <div class="hub-detail-header-card">
      <div class="hub-detail-avatar-box">
        <img src="${item.img}" alt="${item.name}" onerror="this.style.display='none';">
      </div>
      <div class="hub-detail-title-area">
        <div class="hub-detail-main-title">${item.name}</div>
      </div>
    </div>
    <div class="hub-detail-desc-card">
      <div class="hub-detail-section-name">TYPE</div>
      <div class="hub-detail-text-body">${item.type}</div>
    </div>
    <div class="hub-detail-desc-card">
      <div class="hub-detail-section-name">CORE LOG</div>
      <div class="hub-detail-text-body monospace">${item.desc}</div>
    </div>
  `;

  switchTabRaw('tab-hub-detail');
}

function bindStatTileNav() {
  document.querySelectorAll('#hub-detail-content .hub-detail-stat-tile-clickable').forEach(tile => {
    tile.addEventListener('click', () => {
      const name = tile.dataset.statName;
      const hero = GameHubData.heroes.find(h => h.name === name);
      if (hero) { openHeroDetail(hero.id); return; }
      const item = GameHubData.items.find(i => i.name === name);
      if (item) openItemDetail(item.id);
    });
  });
}

/* ================================================================
   TRIVIA GAME (Max early access)
   ================================================================ */

const triviaState = { questions: [], current: 0, score: 0 };

function openTriviaView() {
  if (!isMax()) {
    appendMessage('system', '⚡ Trivia is a Max early access feature. Upgrade to Max to unlock it.');
    setTimeout(openBilling, 400);
    return;
  }
  switchTab('trivia-view');
  renderTriviaHome();
}

function renderTriviaHome() {
  const panel = document.getElementById('trivia-view');
  if (!panel) return;
  panel.innerHTML = `
    <div class="trivia-container">
      <div class="trivia-header">
        <button class="icon-btn back-btn" id="trivia-back-btn" aria-label="Back">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span class="system-title">TRIVIA</span>
      </div>
      <div class="trivia-body">
        <div style="font-size:48px;text-align:center;margin:24px 0;">🧠</div>
        <p style="text-align:center;color:var(--muted);font-size:14px;margin-bottom:24px;">Test your knowledge with 10 random questions from OpenTDB.</p>
        <button class="primary-btn full" id="trivia-start-btn">Generate 10 Questions</button>
        <div id="trivia-status" style="text-align:center;color:var(--muted);font-size:12px;margin-top:12px;"></div>
      </div>
    </div>`;
  document.getElementById('trivia-back-btn')?.addEventListener('click', () => switchTab('tab-gamehub'));
  document.getElementById('trivia-start-btn')?.addEventListener('click', startTrivia);
}

async function startTrivia() {
  const statusEl = document.getElementById('trivia-status');
  const btn = document.getElementById('trivia-start-btn');
  if (btn) btn.disabled = true;
  if (statusEl) statusEl.textContent = 'Fetching questions...';
  try {
    const r = await fetch('https://opentdb.com/api.php?amount=10&type=multiple');
    if (!r.ok) throw new Error('API error');
    const data = await r.json();
    if (data.response_code !== 0 || !data.results.length) throw new Error('No questions');
    triviaState.questions = data.results;
    triviaState.current = 0;
    triviaState.score = 0;
    renderTriviaQuestion();
  } catch(e) {
    if (statusEl) statusEl.textContent = 'Failed to load questions. Please try again.';
    if (btn) btn.disabled = false;
  }
}

function decodeHTMLEntities(str) {
  const ta = document.createElement('textarea');
  ta.innerHTML = str;
  return ta.value;
}

function renderTriviaQuestion() {
  const panel = document.getElementById('trivia-view');
  if (!panel) return;
  const q = triviaState.questions[triviaState.current];
  if (!q) { renderTriviaResult(); return; }
  const allAnswers = [...q.incorrect_answers, q.correct_answer].map(decodeHTMLEntities).sort(() => Math.random() - 0.5);
  panel.innerHTML = `
    <div class="trivia-container">
      <div class="trivia-header">
        <button class="icon-btn back-btn" id="trivia-back-btn" aria-label="Back">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span class="system-title">Q${triviaState.current + 1}/10</span>
        <span style="font-size:12px;color:var(--muted)">Score: ${triviaState.score}</span>
      </div>
      <div class="trivia-body">
        <div class="trivia-category">${decodeHTMLEntities(q.category)} · ${q.difficulty.toUpperCase()}</div>
        <div class="trivia-question">${decodeHTMLEntities(q.question)}</div>
        <div class="trivia-answers" id="trivia-answers">
          ${allAnswers.map((a, i) => `<button class="trivia-answer-btn" data-answer="${escapeHTML(a)}">${a}</button>`).join('')}
        </div>
      </div>
    </div>`;
  document.getElementById('trivia-back-btn')?.addEventListener('click', () => { switchTab('tab-gamehub'); });
  document.querySelectorAll('.trivia-answer-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const chosen = btn.dataset.answer;
      const correct = decodeHTMLEntities(q.correct_answer);
      document.querySelectorAll('.trivia-answer-btn').forEach(b => {
        b.disabled = true;
        if (b.dataset.answer === correct) b.classList.add('trivia-correct');
        else if (b.dataset.answer === chosen && chosen !== correct) b.classList.add('trivia-wrong');
      });
      if (chosen === correct) triviaState.score++;
      setTimeout(() => {
        triviaState.current++;
        renderTriviaQuestion();
      }, 900);
    });
  });
}

function renderTriviaResult() {
  const panel = document.getElementById('trivia-view');
  if (!panel) return;
  const pct = Math.round((triviaState.score / 10) * 100);
  const emoji = pct >= 80 ? '🏆' : pct >= 50 ? '👍' : '😅';
  panel.innerHTML = `
    <div class="trivia-container">
      <div class="trivia-header">
        <span class="system-title">RESULTS</span>
      </div>
      <div class="trivia-body" style="text-align:center;">
        <div style="font-size:56px;margin:20px 0;">${emoji}</div>
        <div style="font-size:32px;font-weight:800;margin-bottom:8px;">${triviaState.score}/10</div>
        <div style="color:var(--muted);font-size:14px;margin-bottom:28px;">${pct}% correct</div>
        <button class="primary-btn full" id="trivia-again-btn">Play Again</button>
        <button class="ghost-btn full" id="trivia-home-btn" style="margin-top:8px;">Back to Games</button>
      </div>
    </div>`;
  document.getElementById('trivia-again-btn')?.addEventListener('click', () => { renderTriviaHome(); });
  document.getElementById('trivia-home-btn')?.addEventListener('click', () => { switchTab('tab-gamehub'); });
}

/* ================================================================
   QUOTE WIDGET
   ================================================================ */

function initQuoteWidget() {
  const el = document.getElementById('void-quote-line');
  if (!el) return;
  const quotes = [
    '"The secret of getting ahead is getting started." — Mark Twain',
    '"Focus is the art of knowing what to ignore." — James Clear',
    '"It\'s not that I\'m so smart, it\'s just that I stay with problems longer." — Einstein',
    '"Done is better than perfect." — Sheryl Sandberg',
    '"The best way to predict the future is to invent it." — Alan Kay',
    '"Stay hungry, stay foolish." — Steve Jobs',
    '"Simplicity is the ultimate sophistication." — Leonardo da Vinci',
    '"Move fast and break things." — Mark Zuckerberg',
    '"Code is like humor. When you have to explain it, it\'s bad." — Cory House',
    '"First, solve the problem. Then, write the code." — John Johnson',
    '"Programs must be written for people to read, and only incidentally for machines to execute." — Abelson',
    '"The function of good software is to make the complex appear to be simple." — Grady Booch',
    '"Talk is cheap. Show me the code." — Linus Torvalds',
    '"Any fool can write code that a computer can understand. Good programmers write code that humans can understand." — Martin Fowler',
    '"The most powerful tool we have as developers is automation." — Scott Hanselman',
    '"Without deviation from the norm, progress is not possible." — Frank Zappa',
    '"Creativity is intelligence having fun." — Einstein',
    '"In the middle of difficulty lies opportunity." — Einstein',
    '"Ship early. Ship often." — Reid Hoffman',
    '"The only way to do great work is to love what you do." — Steve Jobs',
    '"Your time is limited, so don\'t waste it living someone else\'s life." — Steve Jobs',
    '"Innovation distinguishes between a leader and a follower." — Steve Jobs',
    '"The expert in anything was once a beginner." — Helen Hayes',
    '"Absorb what is useful, discard what is useless." — Bruce Lee',
    '"Hard work beats talent when talent doesn\'t work hard." — Tim Notke',
    '"You miss 100% of the shots you don\'t take." — Wayne Gretzky',
    '"Whether you think you can or think you can\'t, you\'re right." — Henry Ford',
    '"The people who are crazy enough to think they can change the world are the ones who do." — Apple',
    '"Stay focused and never give up." — Unknown',
    '"Deep work is the superpower of the 21st century." — Cal Newport',
  ];
  const now = new Date();
  const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
  el.textContent = quotes[dayOfYear % quotes.length];
}

/* ================================================================
   FLOATING VOID ASSISTANT
   ================================================================ */

const VoidFloat = (() => {
  let floatEl, panel, orb, log, input;
  let panelOpen = false;
  let history   = [];

  // drag state
  let dragging = false, startX, startY, origLeft, origBottom;

  function init() {
    floatEl = document.getElementById('void-float');
    panel   = document.getElementById('void-float-panel');
    orb     = document.getElementById('void-float-orb');
    log     = document.getElementById('void-float-log');
    input   = document.getElementById('void-float-input');
    if (!floatEl) return;

    // Close button
    document.getElementById('void-float-close-btn')?.addEventListener('click', closePanel);

    // Send button + enter key
    document.getElementById('void-float-send-btn')?.addEventListener('click', sendMsg);
    input?.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); sendMsg(); } });

    // Orb: drag vs tap
    orb.addEventListener('pointerdown', onDown);
    orb.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') togglePanel(); });
  }

  /* ── Drag ─────────────────────────────────────────────── */

  function onDown(e) {
    e.preventDefault();
    orb.setPointerCapture(e.pointerId);
    startX   = e.clientX;
    startY   = e.clientY;
    const style = window.getComputedStyle(floatEl);
    origLeft   = parseInt(style.right, 10)   || 16;
    origBottom = parseInt(style.bottom, 10)  || 88;
    dragging   = false;
    orb.addEventListener('pointermove', onMove);
    orb.addEventListener('pointerup',   onUp,   { once: true });
    orb.addEventListener('pointercancel', onUp, { once: true });
  }

  function onMove(e) {
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (!dragging && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) dragging = true;
    if (dragging) {
      const ORB = 50;
      floatEl.style.right  = Math.min(window.innerWidth  - ORB, Math.max(0, origLeft   - dx)) + 'px';
      floatEl.style.bottom = Math.min(window.innerHeight - ORB, Math.max(0, origBottom - dy)) + 'px';
    }
  }

  function onUp() {
    orb.removeEventListener('pointermove', onMove);
    if (!dragging) togglePanel();
    dragging = false;
  }

  /* ── Panel toggle ─────────────────────────────────────── */

  function togglePanel() { panelOpen ? closePanel() : openPanel(); }

  function openPanel() {
    panelOpen = true;
    // Smart positioning: flip panel to whichever side has room
    const rect = orb.getBoundingClientRect();
    const W = window.innerWidth, H = window.innerHeight;
    const PW = 292, PH = 390, ORB = 50, GAP = 8;
    const goRight = rect.left + PW <= W;
    const goAbove = rect.top  >= PH + GAP;
    panel.style.left   = goRight ? '0' : '';
    panel.style.right  = goRight ? '' : '0';
    panel.style.top    = goAbove ? '' : (ORB + GAP) + 'px';
    panel.style.bottom = goAbove ? (ORB + GAP) + 'px' : '';
    panel.style.transformOrigin = `${goAbove ? 'bottom' : 'top'} ${goRight ? 'left' : 'right'}`;
    panel.classList.add('vf-open');
    panel.setAttribute('aria-hidden', 'false');
    floatEl.setAttribute('aria-hidden', 'false');
    input?.focus();
  }

  function closePanel() {
    panelOpen = false;
    panel.classList.remove('vf-open');
    panel.setAttribute('aria-hidden', 'true');
  }

  /* ── Messaging ────────────────────────────────────────── */

  function sendMsg() {
    const text = input?.value.trim();
    if (!text) return;
    input.value = '';
    addBubble(text, 'vf-user');
    history.push({ role: 'user', content: text });

    const typingId = addBubble('…', 'vf-typing');

    (async () => {
      const weatherCtx = await getWeatherLookupCtx(text);
      const knowledge = await getKnowledgeLookupCtx(text);
      const msgs = [
        { role: 'system', content: buildSystemPrompt(weatherCtx + knowledge.ctx) + '\n\nYou are responding inside a compact floating widget. Keep replies very short (1–3 sentences).' },
        ...history.slice(-10)
      ];
      let reply = null;
      try {
        if (VOID_CORE_API.url) reply = await callOpenAICompat(VOID_CORE_API.url, VOID_CORE_API.key, VOID_CORE_API.model, msgs);
      } catch(_) {}
      if (!reply && App.settings.geminiKey) { try { reply = await callGemini(msgs); } catch(_) {} }
      if (!reply) { try { reply = await callPollinations(msgs); } catch(_) {} }

      removeBubble(typingId);
      if (reply) {
        history.push({ role: 'assistant', content: reply });
        addBubble(reply, 'vf-ai');
        if (App.settings.voiceEnabled) speak(reply);
      } else {
        addBubble('Error — no response.', 'vf-ai');
      }
    })();
  }

  let msgId = 0;
  function addBubble(text, cls) {
    const id  = 'vfm-' + (++msgId);
    const div = document.createElement('div');
    div.id    = id;
    div.className = 'vf-msg ' + cls;
    div.textContent = text;
    log?.appendChild(div);
    log.scrollTop = log.scrollHeight;
    return id;
  }

  function removeBubble(id) {
    document.getElementById(id)?.remove();
  }

  /* ── Show / hide widget ───────────────────────────────── */

  function show() {
    if (!floatEl) init();
    if (floatEl) floatEl.style.display = '';
  }

  function hide() {
    closePanel();
    if (floatEl) floatEl.style.display = 'none';
  }

  return { init, show, hide };
})();

/* Start / stop the floating assistant (web + native) */
async function setFloatingAssistant(enabled) {
  if (enabled && !isMax()) {
    appendMessage('system', '⚡ Floating assistant is a Max early access feature. Upgrade to Max to unlock it.');
    App.settings.floatingAssistantEnabled = false;
    saveSettings();
    const t = document.getElementById('toggle-floating-assistant');
    if (t) t.checked = false;
    document.querySelectorAll('.cap-toggle[data-cap="floatingAssistantEnabled"]').forEach(el => { el.checked = false; });
    setTimeout(openBilling, 400);
    return;
  }
  if (enabled) {
    VoidFloat.show();
  } else {
    VoidFloat.hide();
    if (window.Capacitor?.isNativePlatform?.()) {
      try {
        const { FloatingPlugin } = Capacitor.Plugins;
        if (FloatingPlugin) await FloatingPlugin.stopFloating();
      } catch (e) { console.warn('FloatingPlugin:', e); }
    }
  }
}
