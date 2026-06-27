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
  },
  tasks: [],
  commands: [],
  chatHistory: [],
  msgCount: 0,
  location: null,
  hubDetailReturnTab: 'tab-gamehub',
  currentUser: null,
};

const VOID_SYSTEM = `You are VOID, an intelligent AI assistant and gaming companion. You specialize in Mobile Legends Bang Bang (MLBB) — hero guides, builds, counters, team comps, patch meta — and you also help with general questions. Be concise, helpful, and direct.`;

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

function buildSystemPrompt() {
  const lang = getActiveLang();
  const name = LANG_NAMES[lang] || 'English';
  const inject = lang !== 'en'
    ? `\n\nIMPORTANT: The user's system language is ${name}. Always respond in ${name} unless the user writes in a different language.`
    : '';
  return VOID_SYSTEM + inject;
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
  setupGameHub();
  setupVoice();
  setupCommandsPanel();
  setupTasksPanel();
  setupPreferencesPanel();
  setupProviderPicker();
  setupMemoryPanel();
  setupStudyMode();
  loadTasks();
  loadCommands();
  loadChatHistory();
  updateUserDisplay();
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

function applyTheme(name) {
  App.settings.theme = name;
  const resolved = resolveThemeForSystem(name);
  document.documentElement.setAttribute('data-theme', resolved === 'frost' ? '' : resolved);
  document.querySelectorAll('.theme-swatch').forEach(d => {
    d.classList.toggle('active', d.dataset.theme === name);
  });
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

  document.getElementById('open-settings-btn').addEventListener('click', () => {
    document.getElementById('view-main').classList.remove('active');
    document.getElementById('view-settings').classList.add('active');
  });
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
}

function switchTabRaw(targetId) {
  document.querySelectorAll('.view-tab').forEach(t => t.classList.remove('active'));
  document.getElementById(targetId).classList.add('active');
}

/* ============ Settings panel navigation ============ */

function setupSettingsPanels() {
  document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', () => openSettingsPanel(item.dataset.openPanel));
  });

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
    });
  }
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

  App.chatHistory.push({ role: 'user', content: text });
  appendMessage('user', text);
  input.value = '';
  input.style.height = 'auto';
  updateSendMicBtn();

  const typingId = appendTyping();
  const messages = [{ role: 'system', content: buildSystemPrompt() }, ...App.chatHistory.slice(-20)];

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
    appendMessage('system', reply);
    if (App.voiceTriggered) { speak(reply); App.voiceTriggered = false; }
  } else {
    appendMessage('system', `ERROR :: ${lastError ? lastError.message : 'All providers unavailable.'}`);
  }
}

function appendMessage(role, text) {
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
  el.innerHTML = `
    <div class="bubble-meta">${label} // ${time}</div>
    <div class="bubble-body${isUser ? '' : ' bubble-ai'}">${escapeHTML(text)}</div>
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
  el.innerHTML = `<div class="bubble-meta">VOID::CORE</div><div class="bubble-body">...</div>`;
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

/* ============ Chat History Persistence ============ */

function saveChatHistory() {
  try {
    localStorage.setItem(userKey('chat'), JSON.stringify(App.chatHistory.slice(-100)));
  } catch(e) {}
}

function loadChatHistory() {
  try {
    const raw = localStorage.getItem(userKey('chat'));
    if (raw) {
      App.chatHistory = JSON.parse(raw) || [];
      if (App.chatHistory.length > 0) {
        const box = document.getElementById('messages-box');
        box.innerHTML = '';
        App.chatHistory.forEach(msg => {
          appendMessage(msg.role === 'user' ? 'user' : 'system', msg.content);
        });
      }
    }
  } catch(e) { App.chatHistory = []; }
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
      App.chatHistory = [];
      saveChatHistory();
      App.msgCount = 0;
      const box = document.getElementById('messages-box');
      box.innerHTML = `
        <div class="matrix-welcome">
          <div class="welcome-logo">VOID</div>
          <p>Memory cleared. Fresh session started.</p>
          <div class="welcome-stats monospace" id="welcome-stats-line">INT::0 | MSG::0</div>
        </div>
      `;
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
  const addBtn = document.getElementById('add-task-btn');

  if (addBtn) {
    addBtn.addEventListener('click', () => {
      const text = taskInput.value.trim();
      if (!text) return;
      App.tasks.push({ text, done: false });
      taskInput.value = '';
      renderTasks();
      saveTasks();
    });
  }
  if (taskInput) {
    taskInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') addBtn.click();
    });
  }
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
      <span class="item-meta task-text">${escapeHTML(task.text)}</span>
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

const STUDY_LOCATIONS = [
  // VIBES
  { id:'lofi-cafe',     name:'LOFI CAFÉ',       region:'VIBES',      flag:'🎵', videoId:'jfKfPfyJRdk' },
  { id:'rain',          name:'RAIN SOUNDS',      region:'VIBES',      flag:'🌧️', videoId:'yIQd2Ya0Ziw' },
  { id:'ocean',         name:'OCEAN WAVES',      region:'VIBES',      flag:'🌊', videoId:'kpSEtzFd_J4' },
  { id:'fireplace',     name:'FIREPLACE',        region:'VIBES',      flag:'🔥', videoId:'L_LUpnjgPso' },
  { id:'forest',        name:'FOREST',           region:'VIBES',      flag:'🌿', videoId:'eKFTSSKCzWA' },
  { id:'night-sky',     name:'NIGHT SKY',        region:'VIBES',      flag:'🌌', videoId:'f_lQQSfN35A' },
  // JAPAN
  { id:'tokyo',         name:'TOKYO',            region:'JAPAN',      flag:'🇯🇵', videoId:'iYWIZeDdq5A' },
  { id:'kyoto',         name:'KYOTO',            region:'JAPAN',      flag:'🇯🇵', videoId:'_Whyf8mMoSk' },
  { id:'osaka',         name:'OSAKA',            region:'JAPAN',      flag:'🇯🇵', videoId:'lCxaJTJkYkI' },
  // KOREA & CHINA
  { id:'seoul',         name:'SEOUL',            region:'EAST ASIA',  flag:'🇰🇷', videoId:'g7G0MRVbM6o' },
  { id:'busan',         name:'BUSAN',            region:'EAST ASIA',  flag:'🇰🇷', videoId:'4wxGVidILnI' },
  { id:'shanghai',      name:'SHANGHAI',         region:'EAST ASIA',  flag:'🇨🇳', videoId:'vxMYH3FpS9Q' },
  { id:'hong-kong',     name:'HONG KONG',        region:'EAST ASIA',  flag:'🇭🇰', videoId:'xNxFmIzBjv0' },
  // SOUTHEAST ASIA
  { id:'bali',          name:'BALI',             region:'SE ASIA',    flag:'🇮🇩', videoId:'PaSKoJvNEwY' },
  { id:'bangkok',       name:'BANGKOK',          region:'SE ASIA',    flag:'🇹🇭', videoId:'rHRK65m7d8Y' },
  { id:'singapore',     name:'SINGAPORE',        region:'SE ASIA',    flag:'🇸🇬', videoId:'99SFP4JTVSY' },
  { id:'hanoi',         name:'HANOI',            region:'SE ASIA',    flag:'🇻🇳', videoId:'EGbU6FUBhT4' },
  // MIDDLE EAST & SOUTH ASIA
  { id:'dubai',         name:'DUBAI',            region:'MIDDLE EAST',flag:'🇦🇪', videoId:'6apS_4LFYAM' },
  { id:'istanbul',      name:'ISTANBUL',         region:'MIDDLE EAST',flag:'🇹🇷', videoId:'B3xGj-0VZFI' },
  { id:'mumbai',        name:'MUMBAI',           region:'SOUTH ASIA', flag:'🇮🇳', videoId:'yMYIwKnRF7Q' },
  // EUROPE — WEST
  { id:'paris',         name:'PARIS',            region:'EUROPE',     flag:'🇫🇷', videoId:'EkzQ6nEhG-E' },
  { id:'london',        name:'LONDON',           region:'EUROPE',     flag:'🇬🇧', videoId:'bnkVkoHEWoQ' },
  { id:'rome',          name:'ROME',             region:'EUROPE',     flag:'🇮🇹', videoId:'JMJ7GjAWvXE' },
  { id:'barcelona',     name:'BARCELONA',        region:'EUROPE',     flag:'🇪🇸', videoId:'fqJMKP3AGWQ' },
  { id:'amsterdam',     name:'AMSTERDAM',        region:'EUROPE',     flag:'🇳🇱', videoId:'CZIXbPjbBFI' },
  { id:'madrid',        name:'MADRID',           region:'EUROPE',     flag:'🇪🇸', videoId:'37Vd6BFHKBU' },
  { id:'milan',         name:'MILAN',            region:'EUROPE',     flag:'🇮🇹', videoId:'PQ3X3FEMEFg' },
  // EUROPE — NORTH/EAST
  { id:'prague',        name:'PRAGUE',           region:'EUROPE',     flag:'🇨🇿', videoId:'InjwvdDijwE' },
  { id:'vienna',        name:'VIENNA',           region:'EUROPE',     flag:'🇦🇹', videoId:'5VhHJMHPX6I' },
  { id:'berlin',        name:'BERLIN',           region:'EUROPE',     flag:'🇩🇪', videoId:'nT4JFHWbHss' },
  { id:'zurich',        name:'ZURICH',           region:'EUROPE',     flag:'🇨🇭', videoId:'fEu4EXSQ4EM' },
  { id:'santorini',     name:'SANTORINI',        region:'EUROPE',     flag:'🇬🇷', videoId:'QIiCbzGjwJ8' },
  { id:'lisbon',        name:'LISBON',           region:'EUROPE',     flag:'🇵🇹', videoId:'FpMzJY7WL7o' },
  { id:'edinburgh',     name:'EDINBURGH',        region:'EUROPE',     flag:'🇬🇧', videoId:'sZ5XFnBPtI8' },
  { id:'copenhagen',    name:'COPENHAGEN',       region:'EUROPE',     flag:'🇩🇰', videoId:'kEgouIO0FpA' },
  // AMERICAS
  { id:'new-york',      name:'NEW YORK',         region:'AMERICAS',   flag:'🇺🇸', videoId:'n61ULEU7CO0' },
  { id:'los-angeles',   name:'LOS ANGELES',      region:'AMERICAS',   flag:'🇺🇸', videoId:'bkXSaS1cT5I' },
  { id:'chicago',       name:'CHICAGO',          region:'AMERICAS',   flag:'🇺🇸', videoId:'KmMGS7FKOBM' },
  { id:'miami',         name:'MIAMI',            region:'AMERICAS',   flag:'🇺🇸', videoId:'jJjSFCWZ8Y8' },
  { id:'san-francisco', name:'SAN FRANCISCO',    region:'AMERICAS',   flag:'🇺🇸', videoId:'w2TbAXFCGxA' },
  { id:'toronto',       name:'TORONTO',          region:'AMERICAS',   flag:'🇨🇦', videoId:'PO8PvKUmXes' },
  { id:'rio',           name:'RIO DE JANEIRO',   region:'AMERICAS',   flag:'🇧🇷', videoId:'7VqsQ96uVTs' },
  { id:'mexico-city',   name:'MEXICO CITY',      region:'AMERICAS',   flag:'🇲🇽', videoId:'IHlrRSz1kLU' },
  // AFRICA & OCEANIA
  { id:'cape-town',     name:'CAPE TOWN',        region:'AFRICA',     flag:'🇿🇦', videoId:'tQwEzrJXLls' },
  { id:'marrakech',     name:'MARRAKECH',        region:'AFRICA',     flag:'🇲🇦', videoId:'eY6wEYsomj8' },
  { id:'sydney',        name:'SYDNEY',           region:'OCEANIA',    flag:'🇦🇺', videoId:'Ey3Buk4NJrE' },
];

const studyState = {
  active: false,
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

  // Show real thumbnail instantly — YouTube image CDN works globally even when videos are geo-blocked
  const grad = REGION_GRADIENTS[loc.region] || 'linear-gradient(135deg,#111418 0%,#1c2028 100%)';
  if (loc.videoId) {
    overlay.style.backgroundImage = `url('https://img.youtube.com/vi/${loc.videoId}/maxresdefault.jpg'), ${grad}`;
    overlay.style.backgroundSize = 'cover, cover';
    overlay.style.backgroundPosition = 'center, center';
  } else {
    overlay.style.background = grad;
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
  overlay.style.backgroundImage = '';
  overlay.style.backgroundSize = '';
  overlay.style.backgroundPosition = '';

  switchTab('tab-study-grid');
}

const REGION_GRADIENTS = {
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
  grid.innerHTML = locs.map(loc => {
    const thumb = loc.videoId ? `https://img.youtube.com/vi/${loc.videoId}/hqdefault.jpg` : '';
    const bg = thumb ? `background-image:url('${thumb}')` : `background:${REGION_GRADIENTS[loc.region] || '#111'}`;
    return `<div class="study-loc-card" data-loc-id="${loc.id}" role="button" tabindex="0" aria-label="${loc.name}" style="${bg}">
      <div class="study-card-overlay">
        <span class="study-card-flag">${loc.flag}</span>
        <span class="study-card-name">${loc.name}</span>
        <span class="study-card-region">${loc.region}</span>
      </div>
    </div>`;
  }).join('');

  grid.querySelectorAll('.study-loc-card').forEach(card => {
    const handler = () => {
      const loc = STUDY_LOCATIONS.find(l => l.id === card.dataset.locId);
      if (loc) openStudyVideo(loc);
    };
    card.addEventListener('click', handler);
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') handler(); });
  });
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
