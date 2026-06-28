# VOID Pro — Payments Setup

The full payment flow is already built. To turn on **real** money you just create
two merchant accounts and add the keys to the Cloudflare Worker (`void-proxy`).
Keys live **only** in Cloudflare secrets — never in the app or this repo.

- **Stripe** → cards worldwide + Apple/Google Pay
- **Xendit** → Touch 'n Go (TNG), GrabPay, ShopeePay, FPX online banking, local cards

You can set up one or both. Until a provider's keys are present, its button just
says it isn't configured yet (codes still work).

---

## 1. Cloudflare KV (remembers who paid) — 2 min
```
cd worker
npx wrangler kv namespace create PLANS
```
Copy the printed `id` into `worker/wrangler.toml` (replace `REPLACE_WITH_KV_ID`).

## 2. Stripe (worldwide cards) — 10 min
1. Sign up at https://dashboard.stripe.com
2. **Products** → add **VOID Pro** (recurring, $5/mo) and **VOID Max** ($15/mo).
   Copy each **Price ID** (`price_…`).
3. **Developers → API keys** → copy the **Secret key** (`sk_live_…`).
4. **Developers → Webhooks** → Add endpoint:
   `https://void-proxy.<your>.workers.dev/pay/stripe-webhook`
   Events: `checkout.session.completed`, `invoice.paid`,
   `customer.subscription.deleted`. Copy the **Signing secret** (`whsec_…`).

## 3. Xendit (TNG / e-wallets / FPX) — 10 min
1. Sign up at https://dashboard.xendit.co (business in Malaysia/SEA).
2. Enable the methods you want (TNG, GrabPay, ShopeePay, FPX, cards).
3. **Settings → API Keys** → copy the **Secret key** (`xnd_…`).
4. **Settings → Callbacks** → set Invoice callback URL:
   `https://void-proxy.<your>.workers.dev/pay/xendit-webhook`
   Copy the **callback verification token**.

## 4. Add the secrets to Cloudflare
Dashboard → Workers → **void-proxy** → Settings → Variables → **Add (Secret)**:
```
STRIPE_SECRET_KEY       sk_live_…
STRIPE_WEBHOOK_SECRET   whsec_…
STRIPE_PRICE_PRO        price_…
STRIPE_PRICE_MAX        price_…
XENDIT_SECRET_KEY       xnd_…
XENDIT_CALLBACK_TOKEN   …
```
(`APP_URL` is already set in `wrangler.toml`.)

## 5. Deploy the Worker
```
cd worker
npx wrangler deploy
```

That's it. The **Upgrade** buttons now open real Stripe / Xendit checkout, the
webhook marks the account Pro in KV, and the app verifies the plan on load via
`/pay/status`. Cancel a Stripe sub → the webhook flips them back to Free.

> If you only do Stripe now, TNG simply won't appear until Xendit keys are added.
> Just send me the account once it's made and I'll confirm the webhook URLs.
