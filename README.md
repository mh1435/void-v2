<div align="center">

```
██╗   ██╗ ██████╗ ██╗██████╗
██║   ██║██╔═══██╗██║██╔══██╗
██║   ██║██║   ██║██║██║  ██║
╚██╗ ██╔╝██║   ██║██║██║  ██║
 ╚████╔╝ ╚██████╔╝██║██████╔╝
  ╚═══╝   ╚═════╝ ╚═╝╚═════╝
```

**AI assistant & MLBB game companion**

[![Build APK](https://img.shields.io/github/actions/workflow/status/mh1435/void-v2/build-apk.yml?branch=main&label=APK%20Build&logo=android&logoColor=white)](https://github.com/mh1435/void-v2/actions)
[![PWA](https://img.shields.io/badge/PWA-ready-7c5cff?logo=pwa&logoColor=white)](https://github.com/mh1435/void-v2)
[![License](https://img.shields.io/badge/license-MIT-00cc55)](LICENSE)

</div>

---

VOID is a dark-themed Progressive Web App and Android app that combines an AI chat assistant with a Mobile Legends Bang Bang game hub. Chat with AI, look up heroes, builds, and counters — all in one place, with no account required beyond an email to keep your chat memory private.

## Features

- **AI Chat** — Powered by a shared backend model. Falls back to Gemini, Groq, OpenRouter, Together, Mistral, or Pollinations.ai (free, no key needed)
- **MLBB Game Hub** — Hero database with roles, tier ratings, builds, counters, and synergies. Item database with stats and descriptions
- **Per-user memory** — Chat history stored per email in localStorage, stays private on your device
- **Multi-provider support** — Connect your own API keys for any provider in Settings
- **Voice I/O** — Mic input (Speech Recognition) and TTS output (SpeechSynthesis)
- **PWA + Android** — Install as a home screen app or download the APK
- **Themes** — Frost, Neon, Ember, Void, Ocean

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla JS, HTML5, CSS3 (no framework) |
| AI Providers | Gemini, Groq, OpenRouter, Together, Mistral, Pollinations.ai |
| Proxy | Cloudflare Worker (hides backend URL) |
| Android | Capacitor 5 |
| CI/CD | GitHub Actions → APK release |
| PWA | Service Worker, Web App Manifest |

## Project Structure

```
void-v2/
├── index.html          # App shell & all views
├── app.js              # Core logic — chat, AI, nav, settings
├── style.css           # All styles + themes
├── gamehub-data.js     # Hero & item database
├── sw.js               # Service worker (offline cache)
├── manifest.json       # PWA manifest
├── icon-192.png        # App icon
├── icon-512.png        # App icon (large)
├── images/
│   ├── heroes/         # Hero portrait images
│   └── items/          # Item icon images
├── worker/
│   ├── index.js        # Cloudflare Worker proxy script
│   └── wrangler.toml   # Wrangler deploy config
├── android/            # Capacitor Android project
└── .github/
    └── workflows/
        └── build-apk.yml  # Auto-build APK on push to main
```

## Getting Started

### Use as PWA

Open the app in Chrome or any modern browser and tap **Add to Home Screen**. No installation needed.

### Download APK

Grab the latest APK from [Releases](https://github.com/mh1435/void-v2/releases) and install on your Android device.

### Build APK locally

```bash
npm install
npx cap sync android
cd android && ./gradlew assembleDebug
```

APK outputs to `android/app/build/outputs/apk/debug/app-debug.apk`

### Auto-build via GitHub Actions

Every push to `main` triggers a build and creates a release with the APK attached. No local setup required.

## AI Provider Setup

VOID ships with a shared AI backend for all users. To use your own keys instead:

1. Open the app → **Settings** (gear icon) → **API Gateways**
2. Enter your key for any provider (Gemini, Groq, OpenRouter, Together, or Mistral)
3. Hit **COMMIT CONFIGURATION**
4. In the chat bar, tap **VOID AI** to pick your active provider

All keys are stored locally on your device — never sent anywhere except directly to the provider's API.

### Cloudflare Worker Proxy

The shared backend is routed through a Cloudflare Worker so the real endpoint URL is never exposed to clients. To deploy your own:

```bash
cd worker
npx wrangler deploy
```

Then set `BACKEND_URL` as a **Secret** in the Cloudflare dashboard (Workers → void-proxy → Settings → Variables).

## License

[MIT](LICENSE) — free to use, modify, and distribute.
