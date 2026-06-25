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
  msgCount: 0,
  location: null,
  hubDetailReturnTab: 'tab-gamehub',
};

/* ============ Boot ============ */

document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
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
  await loadTasks();
  await loadCommands();
});

/* ============ Settings persistence ============ */

async function loadSettings() {
  try {
    const res = await fetch('/api/settings');
    if (res.ok) {
      const data = await res.json();
      App.settings = { ...App.settings, ...data };
    }
  } catch (e) { /* fresh defaults are fine */ }
}

async function saveSettings() {
  try {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(App.settings),
    });
    return res.ok;
  } catch (e) {
    return false;
  }
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

/* ============ Top-level nav: Intelligence / Workspace pill + settings ============ */

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

// Like switchTab but doesn't touch pill highlight state (used when pushing
// the detail view, which isn't one of the two top-level pills).
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
    saveKeysBtn.addEventListener('click', async () => {
      App.settings.geminiKey = document.getElementById('input-gemini-key').value.trim() || App.settings.geminiKey;
      App.settings.groqKey = document.getElementById('input-groq-key').value.trim() || App.settings.groqKey;
      App.settings.apiKey = document.getElementById('input-api-key').value.trim() || App.settings.apiKey;
      App.settings.togetherKey = document.getElementById('input-together-key').value.trim() || App.settings.togetherKey;
      App.settings.mistralKey = document.getElementById('input-mistral-key').value.trim() || App.settings.mistralKey;
      const ok = await saveSettings();
      flashButton(saveKeysBtn, ok ? 'SAVED' : 'FAILED');
      updateModelIndicator();
    });
  }

  const saveModelsBtn = document.getElementById('save-models-btn');
  if (saveModelsBtn) {
    saveModelsBtn.addEventListener('click', async () => {
      App.settings.geminiModel = document.getElementById('input-gemini-model').value.trim();
      App.settings.groqModel = document.getElementById('input-groq-model').value.trim();
      App.settings.model = document.getElementById('input-model').value.trim();
      App.settings.togetherModel = document.getElementById('input-together-model').value.trim();
      App.settings.mistralModel = document.getElementById('input-mistral-model').value.trim();
      const ok = await saveSettings();
      flashButton(saveModelsBtn, ok ? 'SAVED' : 'FAILED');
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
    if (rateValue) rateValue.textContent = App.settings.voiceRate.toFixed(1) + '×';
    rateRange.addEventListener('input', () => {
      App.settings.voiceRate = parseFloat(rateRange.value);
      if (rateValue) rateValue.textContent = App.settings.voiceRate.toFixed(1) + '×';
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
  const clearBtn = document.getElementById('util-clear-btn');
  const micBtn = document.getElementById('util-mic-btn');

  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = input.scrollHeight + 'px';
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  sendBtn.addEventListener('click', sendMessage);

  clearBtn.addEventListener('click', async () => {
    try {
      await fetch('/api/clear', { method: 'POST' });
    } catch (e) { /* ignore */ }
    document.getElementById('messages-box').innerHTML = `
      <div class="matrix-welcome">
        <div class="welcome-logo">VOID</div>
        <p>Memory engine cleared. Localized terminal core re-initialized.</p>
        <div class="welcome-stats monospace" id="welcome-stats-line">INT::0 | MSG::0</div>
      </div>
    `;
    App.msgCount = 0;
  });

  if (micBtn) setupMic(micBtn, input);

  updateModelIndicator();
}

function setupMic(micBtn, input) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    micBtn.addEventListener('click', () => flashButton(micBtn, 'UNSUPPORTED'));
    return;
  }
  const recognizer = new SpeechRecognition();
  recognizer.continuous = false;
  recognizer.interimResults = false;

  let listening = false;
  micBtn.addEventListener('click', () => {
    if (listening) {
      recognizer.stop();
      return;
    }
    try {
      recognizer.start();
      listening = true;
      micBtn.classList.add('active');
    } catch (e) { /* already running */ }
  });

  recognizer.addEventListener('result', (e) => {
    const text = e.results[0][0].transcript;
    input.value = (input.value ? input.value + ' ' : '') + text;
    input.dispatchEvent(new Event('input'));
  });
  recognizer.addEventListener('end', () => {
    listening = false;
    micBtn.classList.remove('active');
  });
  recognizer.addEventListener('error', () => {
    listening = false;
    micBtn.classList.remove('active');
  });
}

function updateModelIndicator() {
  const indicator = document.getElementById('active-model-indicator');
  if (!indicator) return;
  const order = App.settings.providerOrder || ['gemini', 'groq', 'openrouter'];
  const firstConfigured = order.find(p => {
    if (p === 'gemini') return !!App.settings.geminiKey;
    if (p === 'groq') return !!App.settings.groqKey;
    if (p === 'openrouter') return !!App.settings.apiKey;
    return false;
  });
  const labels = { gemini: 'GEMINI', groq: 'GROQ', openrouter: 'OPENROUTER' };
  indicator.textContent = firstConfigured ? labels[firstConfigured] : 'NO KEY SET';
}

async function sendMessage() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;

  appendMessage('user', text);
  input.value = '';
  input.style.height = 'auto';

  const typingId = appendTyping();

  try {
    const payload = {
      message: text,
      openrouter_key: App.settings.apiKey,
      model: App.settings.model,
      gemini_key: App.settings.geminiKey,
      gemini_model: App.settings.geminiModel,
      groq_key: App.settings.groqKey,
      groq_model: App.settings.groqModel,
      provider_order: App.settings.providerOrder,
      lang: App.settings.lang,
      response_mode: App.settings.responseMode,
      location: App.location,
    };

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    removeTyping(typingId);

    if (data.status === 'success') {
      appendMessage('system', data.reply);
      speak(data.reply);
    } else {
      appendMessage('system', `ERROR :: ${data.reply || 'Unknown failure.'}`);
    }
  } catch (e) {
    removeTyping(typingId);
    appendMessage('system', `ERROR :: Connection to Void core failed. ${e.message}`);
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
  el.innerHTML = `<div class="bubble-meta">VOID::CORE</div><div class="bubble-body">···</div>`;
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

/* ============ Commands panel ============ */

function setupCommandsPanel() {
  const labelInput = document.getElementById('command-label-input');
  const actionInput = document.getElementById('command-action-input');
  const addBtn = document.getElementById('add-command-btn');

  if (addBtn) {
    addBtn.addEventListener('click', async () => {
      const label = labelInput.value.trim();
      const action = actionInput.value.trim();
      if (!label || !action) return;
      App.commands.push({ label, action });
      labelInput.value = '';
      actionInput.value = '';
      renderCommands();
      await saveCommands();
    });
  }
}

async function loadCommands() {
  try {
    const res = await fetch('/api/commands');
    if (res.ok) {
      const data = await res.json();
      App.commands = data.commands || [];
    }
  } catch (e) { /* keep empty */ }
  renderCommands();
}

async function saveCommands() {
  try {
    await fetch('/api/commands', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commands: App.commands }),
    });
  } catch (e) { /* ignore */ }
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
    btn.addEventListener('click', async () => {
      App.commands.splice(parseInt(btn.dataset.index, 10), 1);
      renderCommands();
      await saveCommands();
    });
  });
}

/* ============ Tasks panel ============ */

function setupTasksPanel() {
  const taskInput = document.getElementById('task-input');
  const addBtn = document.getElementById('add-task-btn');

  if (addBtn) {
    addBtn.addEventListener('click', async () => {
      const text = taskInput.value.trim();
      if (!text) return;
      App.tasks.push({ text, done: false });
      taskInput.value = '';
      renderTasks();
      await saveTasks();
    });
  }
  if (taskInput) {
    taskInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') addBtn.click();
    });
  }
}

async function loadTasks() {
  try {
    const res = await fetch('/api/tasks');
    if (res.ok) {
      const data = await res.json();
      App.tasks = data.tasks || [];
    }
  } catch (e) { /* keep empty */ }
  renderTasks();
}

async function saveTasks() {
  try {
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tasks: App.tasks }),
    });
  } catch (e) { /* ignore */ }
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
    box.addEventListener('change', async () => {
      App.tasks[parseInt(box.dataset.index, 10)].done = box.checked;
      renderTasks();
      await saveTasks();
    });
  });
  list.querySelectorAll('.task-delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      App.tasks.splice(parseInt(btn.dataset.index, 10), 1);
      renderTasks();
      await saveTasks();
    });
  });
}

/* ============ GameHub (Hero Files / Item Cores) ============ */

function setupGameHub() {
  document.querySelectorAll('.gamehub-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.gamehub-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.gamehub-content-view').forEach(v => v.classList.remove('active'));
      document.getElementById(`gamehub-view-${btn.dataset.hubTab}`).classList.add('active');
    });
  });

  renderHeroGrid(GameHubData.heroes);
  renderItemGrid(GameHubData.items);

  const heroSearch = document.getElementById('hero-search-input');
  if (heroSearch) {
    heroSearch.addEventListener('input', () => {
      const q = heroSearch.value.trim().toLowerCase();
      const filtered = GameHubData.heroes.filter(h =>
        h.name.toLowerCase().includes(q) || h.role.toLowerCase().includes(q)
      );
      renderHeroGrid(filtered);
    });
  }

  const itemSearch = document.getElementById('item-search-input');
  if (itemSearch) {
    itemSearch.addEventListener('input', () => {
      const q = itemSearch.value.trim().toLowerCase();
      const filtered = GameHubData.items.filter(i =>
        i.name.toLowerCase().includes(q) || i.type.toLowerCase().includes(q)
      );
      renderItemGrid(filtered);
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

function renderItemGrid(items) {
  const grid = document.getElementById('item-grid');
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

function findHero(id) { return GameHubData.heroes.find(h => h.id === id); }
function findItem(id) { return GameHubData.items.find(i => i.id === id); }

function statTileHTML(label, name, img) {
  return `
    <div class="hub-detail-stat-tile hub-detail-stat-tile-clickable" data-stat-name="${name}">
      <span class="hub-detail-stat-label">${label}</span>
      <span class="hub-detail-stat-value">${name}</span>
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
    return c ? statTileHTML('COUNTER', c.name, c.img) : '';
  }).join('');

  const buildBlocks = Object.entries(hero.builds || {}).map(([buildName, itemIds]) => `
    <div class="hub-detail-desc-card">
      <div class="hub-detail-section-name">${buildName.toUpperCase()}</div>
      <div class="hub-detail-stats-grid">
        ${itemIds.map(iid => {
          const item = findItem(iid);
          return item ? statTileHTML('ITEM', item.name, item.img) : '';
        }).join('')}
      </div>
    </div>
  `).join('');

  document.getElementById('hub-detail-content').innerHTML = `
    <div class="hub-detail-header-card">
      <div class="hub-detail-avatar-box">
        <img src="${hero.img}" alt="${hero.name}" onerror="this.style.display='none';">
      </div>
      <div class="hub-detail-title-area">
        <div class="hub-detail-main-title">${hero.name}</div>
      </div>
    </div>

    <div class="hub-detail-desc-card">
      <div class="hub-detail-section-name">ROLE</div>
      <div class="hub-detail-text-body">${hero.role}</div>
    </div>

    <div class="hub-detail-desc-card">
      <div class="hub-detail-section-name">FILE LOG</div>
      <div class="hub-detail-text-body monospace">${hero.desc}</div>
    </div>

    ${counterTiles ? `
      <div class="hub-detail-desc-card">
        <div class="hub-detail-section-name">COUNTERED BY</div>
        <div class="hub-detail-stats-grid">${counterTiles}</div>
      </div>
    ` : ''}

    ${buildBlocks}
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

// Stat tiles in the detail view (counters / build items) are clickable —
// tapping a counter or build-item tile navigates to that hero/item's own
// detail page, since both heroes and items share the same id namespace
// lookup pattern (findHero falls through to findItem).
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
