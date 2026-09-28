# Benchline

**The operating system for solo trades.**

Original e-commerce product for founder Curtis Bailey (Project $30K). Digital kits and membership for solo home-service operators — cleaners, handymen, lawn care, pressure washing, HVAC helpers, detailers.

Stack: **Next.js (App Router) · TypeScript · Tailwind CSS · Stripe Checkout · Supabase · Render**

> Principles only from reference models — no brand, asset, or code reuse from other products (including Kaivaryn). Create **separate** Stripe products/prices for Benchline.

## Quick start

```bash
cd /workspace/project-30k/benchline
cp .env.example .env.local
# fill in keys (see below)
npm install
npm run pack:core-kit
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm test
npm run build
```

## Environment variables

See `.env.example` for the full list.

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL (no trailing slash) |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Publishable key (client) |
| `STRIPE_PRICE_CORE` | Price ID for Core Kit ($199 one-time) |
| `STRIPE_PRICE_MEMBERSHIP` | Price ID for Updates ($29/mo) |
| `STRIPE_PRICE_BUNDLE` | Price ID for Core + 3 Months ($249) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role (webhooks, dashboard) |
| `FOUNDER_EMAIL` | Comma-separated allowlist for `/dashboard` |
| `DOWNLOAD_SIGNING_SECRET` | HMAC secret for signed download tokens |
| `OPENAI_API_KEY` | Optional — dashboard AI analyst |

**Never commit `.env.local` or secrets.**

## Stripe product setup (Benchline-only)

Create these in the **Benchline** Stripe account/mode — do **not** reuse Kaivaryn price IDs.

1. **Benchline Core Kit** — one-time price **$199.00** USD → copy Price ID → `STRIPE_PRICE_CORE`
2. **Benchline Updates** — recurring **$29.00** / month → `STRIPE_PRICE_MEMBERSHIP`
3. **Core + 3 Months Updates** — one-time **$249.00** (represents kit + prepaid Updates) → `STRIPE_PRICE_BUNDLE`

Webhook endpoint (production):

```
POST https://YOUR_DOMAIN/api/webhooks/stripe
```

Subscribe at least to `checkout.session.completed`. Copy the signing secret to `STRIPE_WEBHOOK_SECRET`.

Local test:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## Supabase setup

1. Create a new Supabase project for Benchline.
2. Enable Email auth (magic link and/or password).
3. In **SQL Editor**, run `supabase/schema.sql` (tables, RLS, seed products, profile trigger).
4. Copy Project URL + anon key + service role key into env.
5. Add redirect URL: `https://YOUR_DOMAIN/auth/callback` (and localhost for dev).

## Digital delivery

- Core Kit files live in `content/products/core-kit/` and `public/downloads/core-kit/`.
- `npm run pack:core-kit` builds `public/downloads/benchline-core-kit.zip`.
- After a verified webhook marks an order `paid`, the buyer’s `/account` page shows download links to `/api/downloads/core-kit?orderId=…` (auth + entitlement check).

## Founder dashboard

- Route: `/dashboard`
- Protected by `FOUNDER_EMAIL` allowlist (must match signed-in Supabase user email).
- KPIs and AI analyst use **real** `orders` / `order_items` / `support_tickets` aggregates only.
- If `OPENAI_API_KEY` is unset, a rule-based summary is used.

## Deploy on Render

Blueprint: `render.yaml`

1. Push this repo to `curtisbailey98-commits/benchline`.
2. In Render, **New → Blueprint** and select the repo, or create a Web Service with:
   - Build: `npm ci && npm run pack:core-kit && npm run build`
   - Start: `npm run start`
3. Set all env vars from `.env.example`.
4. Point Stripe webhook at `https://YOUR_RENDER_URL/api/webhooks/stripe`.

## Tests

```bash
npm test
```

Covers cart/price totals, bundle savings, and webhook idempotency helper.

## Catalog

| Product | Price | Type |
|---------|-------|------|
| Benchline Core Kit | $199 | One-time ZIP |
| Benchline Updates | $29/mo | Subscription |
| Core + 3 Months Updates | $249 | Bundle (save $37) |

## Project layout (high level)

```
app/                 # App Router pages + API routes
components/          # UI + cart provider
lib/                 # products, pricing, stripe, supabase, webhook, analyst
content/products/    # Source kit content (owned)
public/downloads/    # Gated ZIP + unpacked kit mirror
supabase/schema.sql  # DB migration
```
