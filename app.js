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
    lang: 'auto',
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

/* ============ Boot ============ */

document.addEventListener('DOMContentLoaded', () => {
  setupLogin();
});

/* ============ Login System ============ */

function setupLogin() {
  const modal = document.getElementById('login-modal');
  const emailInput = document.getElementById('login-email-input');
  const submitBtn = document.getElementById('login-submit-btn');

  const saved = localStorage.getItem('void_current_user');
  if (saved) {
    App.currentUser = saved;
    if (modal) modal.style.display = 'none';
    bootApp();
    return;
  }

  if (modal) modal.style.display = 'flex';

  function doLogin() {
    const email = emailInput.value.trim();
    if (!email || !email.includes('@')) {
      emailInput.style.borderColor = 'var(--danger)';
      return;
    }
    App.currentUser = email;
    localStorage.setItem('void_current_user', email);
    if (modal) modal.style.display = 'none';
    bootApp();
  }

  if (submitBtn) submitBtn.addEventListener('click', doLogin);
  if (emailInput) {
    emailInput.addEventListener('keydown', (e) => {
      emailInput.style.borderColor = '';
      if (e.key === 'Enter') doLogin();
    });
  }
}

function bootApp() {
  loadSettings();
  applyTheme(App.settings.theme);
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

function applyTheme(name) {
  App.settings.theme = name;
  document.documentElement.setAttribute('data-theme', name === 'frost' ? '' : name);
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
  });
}

function switchTab(targetId) {
  document.querySelectorAll('.view-tab').forEach(t => t.classList.remove('active'));
  document.getElementById(targetId).classList.add('active');

  if (targetId === 'tab-chat' || targetId === 'tab-gamehub') {
    document.querySelectorAll('.tab-pill').forEach(p => {
      p.classList.toggle('active', p.dataset.target === targetId);
    });
  }
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
    recognizer.addEventListener('result', (e) => {
      const text = e.results[0][0].transcript;
      input.value = (input.value ? input.value + ' ' : '') + text;
      input.dispatchEvent(new Event('input'));
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
  const messages = [{ role: 'system', content: VOID_SYSTEM }, ...App.chatHistory.slice(-20)];

  let reply = null;
  let lastError = null;
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

  removeTyping(typingId);

  if (reply) {
    App.chatHistory.push({ role: 'assistant', content: reply });
    saveChatHistory();
    appendMessage('system', reply);
    speak(reply);
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
  const bubbleClass = role === 'user' ? 'user' : 'assistant';
  const label = role === 'user' ? 'USER::NODE' : 'VOID::CORE';

  const el = document.createElement('div');
  el.className = `chat-bubble ${bubbleClass}`;
  el.innerHTML = `
    <div class="bubble-meta">${label} // ${time}</div>
    <div class="bubble-body">${escapeHTML(text)}</div>
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
        ${!p.configured && !p.free ? '<span class="provider-tag setup-tag">ADD KEY</span>' : ''}
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

function updateUserDisplay() {
  const statusEl = document.getElementById('hud-status');
  if (statusEl && App.currentUser) {
    statusEl.textContent = App.currentUser.split('@')[0].toUpperCase() + '::ONLINE';
  }
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

function setupGameHub() {
  document.querySelectorAll('.gamehub-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.gamehub-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.gamehub-content-view').forEach(v => v.classList.remove('active'));
      document.getElementById(`gamehub-view-${btn.dataset.hubTab}`).classList.add('active');
    });
  });

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
      <div class="hub-card-media">
        <img src="${i.img}" alt="${i.name}" class="hub-card-img" onerror="this.style.display='none';">
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

function openHeroDetail(id) {
  const hero = findHero(id);
  if (!hero) return;
  App.hubDetailReturnTab = 'tab-gamehub';

  document.getElementById('hub-detail-header-title').textContent = hero.name.toUpperCase();

  const counterTiles = (hero.counters || []).map(cId => {
    const c = findHero(cId);
    if (c) return statTileHTML('COUNTER', c.name, c.img);
    const it = findItem(cId);
    if (it) return statTileHTML('ITEM', it.name, it.img);
    return statTileHTML('COUNTER', cId.replace(/_/g, ' ').toUpperCase(), '');
  }).join('');

  const buildBlocks = Object.entries(hero.builds || {}).map(([buildName, itemIds]) => `
    <div class="hub-detail-desc-card">
      <div class="hub-detail-section-name">${buildName.toUpperCase()}</div>
      <div class="hub-detail-build-list">
        ${itemIds.map((iid, idx) => {
          const item = findItem(iid);
          return item ? `
            <div class="build-step hub-detail-stat-tile-clickable" data-stat-name="${item.name}">
              <span class="build-step-num">${idx + 1}</span>
              <img class="build-step-img" src="${item.img}" alt="" onerror="this.style.display='none'">
              <div class="hub-detail-stat-tile-text">
                <span class="hub-detail-stat-label">ITEM</span>
                <span class="hub-detail-stat-value">${item.name}</span>
              </div>
            </div>` : '';
        }).join('')}
      </div>
    </div>
  `).join('');

  const comboVid = (typeof HERO_COMBO_VIDEOS !== 'undefined' && HERO_COMBO_VIDEOS[hero.id]) || null;
  const ytSearch = `https://www.youtube.com/results?search_query=mlbb+${encodeURIComponent(hero.name)}+combo+2025`;
  const comboSection = `
    <div class="hub-detail-desc-card">
      <div class="hub-detail-section-name">COMBOS</div>
      ${comboVid ? `
        <div class="combo-video-wrap">
          <iframe src="https://www.youtube.com/embed/${comboVid}?rel=0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen loading="lazy"></iframe>
        </div>` : ''}
      <a class="combo-yt-btn" href="${ytSearch}" target="_blank" rel="noopener noreferrer">WATCH COMBO VIDEOS</a>
    </div>
  `;

  document.getElementById('hub-detail-content').innerHTML = `
    <div class="hub-detail-header-card">
      <div class="hub-detail-avatar-box">
        <img src="${hero.img}" alt="${hero.name}" onerror="this.style.display='none';">
      </div>
      <div class="hub-detail-title-area">
        <div class="hub-detail-main-title">${hero.name}</div>
        ${hero.tier ? `
          <div class="hero-tier-detail">
            <span class="hero-tier-badge tier-${hero.tier}">${hero.tier}-TIER</span>
            ${hero.wr ? `<span class="hero-tier-wr">${hero.wr}% WIN RATE</span>` : ''}
          </div>` : ''}
      </div>
    </div>
    <div class="hub-detail-desc-card">
      <div class="hub-detail-section-name">ROLE</div>
      <div class="hub-detail-text-body">${hero.role}</div>
    </div>
    ${(hero.synergies || []).length ? `
      <div class="hub-detail-desc-card">
        <div class="hub-detail-section-name">BEST MATCHES</div>
        <div class="hub-detail-stats-grid">
          ${hero.synergies.map(sid => {
            const s = findHero(sid);
            return s ? statTileHTML('SYNERGY', s.name, s.img) : '';
          }).join('')}
        </div>
      </div>` : ''}
    ${counterTiles ? `
      <div class="hub-detail-desc-card">
        <div class="hub-detail-section-name">COUNTERED BY</div>
        <div class="hub-detail-stats-grid">${counterTiles}</div>
      </div>` : ''}
    ${buildBlocks}
    ${comboSection}
  `;

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
