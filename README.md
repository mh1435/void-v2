<div align="center">

# VOID AI

**Your personal AI assistant — chat, study, and game hub in one.**

</div>

## Features

- **AI Chat** — powered by 13 free providers (Groq, Cerebras, Gemini, DeepSeek, Mistral, and more). Shuffles providers automatically to avoid rate limits. Falls back to Pollinations if all fail.
- **Study Mode** — 50+ ambient study locations (cities, nature, space) with looping video and optional sound.
- **Game Hub** — MLBB, Valorant, Clash Royale guides powered by AI.
- **VOID Pro** — $5/mo or $15/mo subscription unlocking unlimited chats, all study locations, all themes. Built on Stripe (worldwide cards, Apple Pay, Google Pay).
- **Multi-chat** — create, switch, and delete conversations from the right-side drawer.
- **Themes** — dark, light, cream, paper, soft gray, and more.
- **PWA + Android APK** — installable on Android; auto-updates from the web with no reinstall needed.
- **Multilingual** — AI mirrors the language you write in (Arabic → Arabic, English → English, etc.).

## Tech Stack

| Layer | What |
|---|---|
| Frontend | Vanilla JS, HTML, CSS — no framework |
| Hosting | [Render](https://render.com) — auto-deploys from `main` branch |
| AI Router | Cloudflare Worker (`void-proxy`) — shuffles 13 providers, keys in secrets only |
| Payments | Stripe — subscriptions, worldwide cards |
| Plan storage | Cloudflare KV (`PLANS` namespace) |
| Android | Capacitor — loads live URL, auto-updates when web updates |

## Self-Hosting

### 1. Fork & Deploy to Render
1. Fork this repo
2. Connect to [Render](https://render.com) → New Static Site → point to your fork
3. No build command needed — deploys from root
4. Auto-deploys on every push to `main`

### 2. Cloudflare Worker (AI Router)
```bash
cd worker
npx wrangler deploy
```
Add your AI provider keys as **Secrets** in Cloudflare Dashboard → Workers → void-proxy → Settings → Variables.

Keys: `GROQ_KEY`, `CEREBRAS_KEY`, `SAMBANOVA_KEY`, `DEEPSEEK_KEY`, `OPENROUTER_KEY`, `TOGETHER_KEY`, `FIREWORKS_KEY`, `NVIDIA_KEY`, `HYPERBOLIC_KEY`, `HF_TOKEN`, `MISTRAL_KEY`, `COHERE_KEY`, `GEMINI_KEY`

### 3. Payments (optional)
See [PAYMENTS_SETUP.md](PAYMENTS_SETUP.md) for full Stripe setup.

Secrets to add to Cloudflare Worker:
```
STRIPE_SECRET_KEY       sk_live_…
STRIPE_WEBHOOK_SECRET   whsec_…
STRIPE_PRICE_PRO        price_…
STRIPE_PRICE_MAX        price_…
```

### 4. Android APK
The APK points to your live Render URL — it auto-updates whenever the web app updates. No need to reinstall.

To build:
```bash
npm install
npx cap sync android
cd android && ./gradlew assembleDebug
```
Output: `android/app/build/outputs/apk/debug/app-debug.apk`

## Security

All API keys and secrets live **only in Cloudflare Worker secrets** — never in code or this repo. Users can never see them.

## License

MIT
