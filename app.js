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
    floatingAssistantEnabled: false,
    haptic: true,
    accentColor: '', accentColor2: '',
  },
  tasks: [],
  commands: [],
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
- /define <word>, /price <coin>, /image <prompt>, /convert <amount> <from> to <to> quick lookup commands
- Opening other apps/sites on request ("open spotify", "navigate to X", "play X on youtube")

Rules:
- NEVER proactively mention MLBB, gaming, or hero builds unless the user brings it up first
- Match your response length to the question — short question = short answer, complex question = detailed answer
- If asked what you can do, describe the capabilities above naturally
- Be direct, useful, and conversational
- CRITICAL: If a LIVE CONTEXT, WEATHER LOOKUP, or KNOWLEDGE LOOKUP block appears below, that data is real and current — use it directly to answer. NEVER say "I'm just a language model", "I don't have access to real-time information", or suggest the user check a website instead — you DO have this data when it's provided below. Only say data is unavailable if no such block was given for that request.`;

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
  return VOID_SYSTEM + inject + liveCtx + (extraCtx || '');
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
  if (!q) return '';
  try {
    const r = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q.replace(/\s+/g, '_'))}`);
    if (!r.ok) return '';
    const d = await r.json();
    if (!d.extract) return '';
    return `\n\nKNOWLEDGE LOOKUP for "${q}" (Wikipedia): ${d.extract}`;
  } catch(_) { return ''; }
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
  // Try GPS silently — if Android already granted permission it succeeds immediately,
  // if not, error callback fires right away and we fall through to IP-based.
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
      { timeout: 1, maximumAge: Infinity }); // cached only — no dialog, no blocking
    });
  }

  // Fall back to IP-based if GPS didn't give a city
  if (!App.liveContext.city) {
    try {
      const r = await fetch('https://ip-api.com/json/?fields=city,country,countryCode,lat,lon,timezone');
      if (r.ok) {
        const d = await r.json();
        if (d.city) {
          App.liveContext.city     = d.city;
          App.liveContext.country  = d.country;
          App.liveContext.lat      = d.lat;
          App.liveContext.lon      = d.lon;
          App.liveContext.timezone = d.timezone;
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
  setupMemoryPanel();
  setupStudyMode();
  setupNavDrawer();
  setupClonedPanels();
  refreshPlanUI();
  handlePaymentReturn();
  verifyPlanFromServer();
  loadTasks();
  loadCommands();
  loadChats();
  updateUserDisplay();
  initLiveContext();
  initQuoteWidget();
  checkForAppUpdate();
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

  const exportBtn = document.getElementById('export-chat-btn');
  if (exportBtn) exportBtn.addEventListener('click', exportCurrentChat);
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
  const exportBtn = document.getElementById('export-chat-btn');
  if (exportBtn) {
    // visibility (not display) keeps the button's width reserved in the layout,
    // so the centered INTELLIGENCE/WORKSPACE pill doesn't shift when it toggles.
    const show = targetId === 'tab-chat';
    exportBtn.style.visibility = show ? '' : 'hidden';
    exportBtn.style.pointerEvents = show ? '' : 'none';
  }

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
  document.querySelectorAll('.menu-item[data-open-panel="panel-fontstyle"] .sub').forEach(s => s.textContent = (App.settings.fontSize || 'default').replace(/^./, c => c.toUpperCase()));
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
  } else if (panelId === 'panel-fontstyle') {
    syncFontSizeSeg();
  } else if (panelId === 'panel-notifications') {
    refreshNotifStatus();
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
    nameSelect.addEventListener('change', () => {
      App.settings.voiceName = nameSelect.value;
      saveSettings();
    });
  }
  if (window.speechSynthesis) {
    populateVoices();
    window.speechSynthesis.addEventListener('voiceschanged', populateVoices);
  }

  if (testBtn) {
    testBtn.addEventListener('click', () => speak('Void core voice configuration confirmed.'));
  }
}

function speak(text) {
  if (!App.settings.voiceEnabled || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = App.settings.voiceRate;
  utter.pitch = App.settings.voicePitch;
  if (App.settings.voiceName) {
    const voice = window.speechSynthesis.getVoices().find(v => v.name === App.settings.voiceName);
    if (voice) utter.voice = voice;
  }
  window.speechSynthesis.speak(utter);
}

/* ============ Chat ============ */

function setupChat() {
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('send-msg-btn');

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognizer = null;
  let listening = false;

  if (SpeechRecognition) {
    recognizer = new SpeechRecognition();
    recognizer.continuous = false;
    recognizer.interimResults = false;
    recognizer.lang = getSTTLang();
    recognizer.addEventListener('result', (e) => {
      const text = e.results[0][0].transcript;
      input.value = (input.value ? input.value + ' ' : '') + text;
      input.dispatchEvent(new Event('input'));
      App.voiceTriggered = true;
    });
    recognizer.addEventListener('end', () => {
      listening = false;
      sendBtn.classList.remove('mic-active');
      updateSendMicBtn();
    });
    recognizer.addEventListener('error', () => {
      listening = false;
      sendBtn.classList.remove('mic-active');
    });
  }

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
    if (sendBtn.dataset.mode === 'send') {
      sendMessage();
    } else {
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
    }
  });

  updateSendMicBtn();
  updateModelIndicator();
}

function updateSendMicBtn() {
  const input = document.getElementById('chat-input');
  const btn = document.getElementById('send-msg-btn');
  if (!btn || !input) return;
  const hasText = input.value.trim().length > 0;
  const micIcon = btn.querySelector('.btn-icon-mic');
  const sendIcon = btn.querySelector('.btn-icon-send');
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
  const contents = messages.filter(m => m.role !== 'system').map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));
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

async function sendMessage() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;

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

  // /image command — free, no-key image generation via Pollinations
  if (text.toLowerCase().startsWith('/image ')) {
    const prompt = text.slice(7).trim();
    if (prompt) {
      appendMessage('user', text);
      input.value = ''; input.style.height = 'auto'; updateSendMicBtn();
      const seed = Math.floor(Math.random() * 1e9);
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=640&height=640&seed=${seed}&nologo=true`;
      appendImageMessage(url, prompt);
    }
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

  // Natural-language app opening ("open spotify", "navigate to X", "play X on youtube"...)
  const appAction = detectAppAction(text);
  if (appAction) {
    appendMessage('user', text);
    input.value = ''; input.style.height = 'auto'; updateSendMicBtn();
    appendMessage('system', `🚀 ${appAction.label}`);
    window.open(appAction.url, '_blank');
    return;
  }

  if (!consumeFreeMessage()) { showUpgradePrompt(); return; }

  App.chatHistory.push({ role: 'user', content: text });
  appendMessage('user', text, App.chatHistory.length - 1);
  input.value = '';
  input.style.height = 'auto';
  updateSendMicBtn();

  await generateAssistantReply(text);
}

// Runs the provider fallback chain against the current App.chatHistory and appends the
// result. Shared by sendMessage() (new user turn) and regenerateMessageAt() (no new turn).
async function generateAssistantReply(triggerText) {
  const typingId = appendTyping();
  const weatherCtx = await getWeatherLookupCtx(triggerText || '');
  const knowledgeCtx = await getKnowledgeLookupCtx(triggerText || '');
  const messages = [{ role: 'system', content: buildSystemPrompt(weatherCtx + knowledgeCtx) }, ...App.chatHistory.slice(-20)];

  let reply = null;
  let lastError = null;

  // Always try the shared VOID core first
  if (VOID_CORE_API.url) {
    try {
      reply = await callOpenAICompat(VOID_CORE_API.url, VOID_CORE_API.key, VOID_CORE_API.model, messages);
    } catch(e) { lastError = e; }
  }

  if (!reply) {
  const order = App.settings.providerOrder || ['gemini', 'groq', 'openrouter'];
  const tryProviders = [...order, 'together', 'mistral', 'pollinations'];
  const tried = new Set();

  for (const p of tryProviders) {
    if (tried.has(p)) continue;
    tried.add(p);
    try {
      if (p === 'gemini' && App.settings.geminiKey) {
        reply = await callGemini(messages); break;
      } else if (p === 'groq' && App.settings.groqKey) {
        reply = await callOpenAICompat('https://api.groq.com/openai/v1/chat/completions',
          App.settings.groqKey, App.settings.groqModel || 'llama-3.3-70b-versatile', messages); break;
      } else if (p === 'openrouter' && App.settings.apiKey) {
        reply = await callOpenAICompat('https://openrouter.ai/api/v1/chat/completions',
          App.settings.apiKey, App.settings.model || 'meta-llama/llama-3.2-3b-instruct:free', messages); break;
      } else if (p === 'together' && App.settings.togetherKey) {
        reply = await callOpenAICompat('https://api.together.xyz/v1/chat/completions',
          App.settings.togetherKey, App.settings.togetherModel || 'meta-llama/Llama-3.2-70B-Instruct-Turbo', messages); break;
      } else if (p === 'mistral' && App.settings.mistralKey) {
        reply = await callOpenAICompat('https://api.mistral.ai/v1/chat/completions',
          App.settings.mistralKey, App.settings.mistralModel || 'mistral-large-latest', messages); break;
      } else if (p === 'pollinations') {
        reply = await callPollinations(messages); break;
      }
    } catch(e) { lastError = e; }
  }
  } // end if (!reply) fallback chain

  removeTyping(typingId);

  if (reply) {
    App.chatHistory.push({ role: 'assistant', content: reply });
    saveChatHistory();
    appendMessage('system', reply, App.chatHistory.length - 1);
    if (App.voiceTriggered) { speak(reply); App.voiceTriggered = false; }
  } else {
    appendMessage('system', `ERROR :: ${lastError ? lastError.message : 'All providers unavailable.'}`);
  }
}

// Drops the given assistant reply (and anything after it) from history, then re-asks.
async function regenerateMessageAt(index) {
  if (index == null || !App.chatHistory[index] || App.chatHistory[index].role !== 'assistant') return;
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
  const text = App.chatHistory[index].content;
  App.chatHistory = App.chatHistory.slice(0, index);
  saveChats();
  renderActiveChat();
  input.value = text;
  input.style.height = 'auto';
  input.style.height = input.scrollHeight + 'px';
  updateSendMicBtn();
  input.focus();
}

function appendMessage(role, text, historyIndex = null) {
  const box = document.getElementById('messages-box');
  const welcome = box.querySelector('.matrix-welcome');
  if (welcome) welcome.remove();

  App.msgCount++;
  updateWelcomeStatsLine();

  const time = new Date().toLocaleTimeString('en-US', { hour12: false });
  const isUser = role === 'user';
  const bubbleClass = isUser ? 'user' : 'assistant';
  const label = isUser ? 'YOU' : 'VOID';

  const el = document.createElement('div');
  el.className = `chat-bubble ${bubbleClass}`;
  if (historyIndex != null) el.dataset.historyIndex = historyIndex;
  el.innerHTML = `
    <div class="bubble-meta">${label} // ${time}</div>
    <div class="bubble-body${isUser ? '' : ' bubble-ai'}">${renderMarkdownLite(text)}</div>
    <div class="bubble-actions">
      <button class="bubble-act-btn" data-act="copy" aria-label="Copy message">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      </button>${isUser && historyIndex != null ? `
      <button class="bubble-act-btn" data-act="edit" aria-label="Edit message">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
      </button>` : ''}${!isUser && historyIndex != null ? `
      <button class="bubble-act-btn" data-act="regen" aria-label="Regenerate response">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
      </button>` : ''}
      <button class="bubble-act-btn" data-act="del" aria-label="Delete message">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </button>
    </div>
  `;
  box.appendChild(el);
  box.scrollTop = box.scrollHeight;
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
    const rawText = (index != null && App.chatHistory[index]) ? App.chatHistory[index].content : (bodyEl ? bodyEl.textContent : '');

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
    }
  });
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
    blocks.push(`<pre><code>${escapeHTML(code.replace(/\n$/, ''))}</code></pre>`);
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
    if (firstUser) cur.title = firstUser.content.slice(0, 40).trim() || 'New chat';
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

function titleFromMessages(msgs) {
  const u = (msgs || []).find(m => m.role === 'user');
  return u ? u.content.slice(0, 40).trim() : 'New chat';
}

function exportCurrentChat() {
  if (!App.chatHistory.length) return;
  const chat = getCurrentChat();
  const title = chat?.title || 'VOID Chat';
  let md = `# ${title}\n\n`;
  App.chatHistory.forEach(m => {
    md += `**${m.role === 'user' ? 'You' : 'VOID'}:**\n${m.content}\n\n`;
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

// Re-render the message area for the active chat.
function renderActiveChat() {
  const box = document.getElementById('messages-box');
  if (!box) return;
  box.innerHTML = '';
  App.msgCount = 0;
  if (App.chatHistory.length) {
    App.chatHistory.forEach((msg, i) => appendMessage(msg.role === 'user' ? 'user' : 'system', msg.content, i));
  } else {
    box.innerHTML = `<div class="matrix-welcome"><div class="welcome-logo">VOID</div>
      <p>AI assistant &amp; game companion. Ask anything — MLBB heroes, builds, strategy, or general questions.</p>
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
  const sorted = [...App.chats].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  list.innerHTML = sorted.map(c => `
    <div class="nav-chat-item${c.id === App.currentChatId ? ' active' : ''}" data-chat-id="${c.id}">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      <span class="nav-chat-title">${escapeHTML(c.title || 'New chat')}</span>
      <button class="nav-chat-del" data-del-id="${c.id}" aria-label="Delete chat">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </button>
    </div>`).join('');
  list.querySelectorAll('.nav-chat-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (e.target.closest('.nav-chat-del')) return;
      switchChat(item.dataset.chatId);
    });
  });
  list.querySelectorAll('.nav-chat-del').forEach(btn => {
    btn.addEventListener('click', (e) => { e.stopPropagation(); deleteChat(btn.dataset.delId); });
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
      const hay = ((chat?.title || '') + ' ' + (chat?.messages || []).map(m => m.content).join(' ')).toLowerCase();
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
  }, 30000);
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
}

/* openStudyPanel — called from STUDY pill, shows the location grid */
function openStudyPanel() {
  switchTab('tab-study-grid');
  renderStudyGrid(STUDY_LOCATIONS);
  const s = document.getElementById('study-search-input');
  if (s) s.value = '';
}


/* openStudyVideo — called when a location card is clicked */
function openStudyVideo(loc) {
  const overlay = document.getElementById('study-overlay');
  if (!overlay) return;
  overlay.style.display = 'block';
  studyState.active = true;
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
      const knowledgeCtx = await getKnowledgeLookupCtx(text);
      const msgs = [
        { role: 'system', content: buildSystemPrompt(weatherCtx + knowledgeCtx) + '\n\nYou are responding inside a compact floating widget. Keep replies very short (1–3 sentences).' },
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
