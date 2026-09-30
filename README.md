# Benchline

**The operating system for solo trades.**

Original e-commerce product for founder Curtis Bailey (Project $30K). The back office for solo home-service operators — Core Kit (7 business systems), Benchline Pro membership, trade kits, and add-on packs for cleaners, pressure washers, lawn-care operators, mobile detailers, and handymen. Sold by Kaivaryn LLC.

Stack: **Next.js (App Router) · TypeScript · Tailwind CSS · Stripe Checkout · Supabase · Render**

> Principles only from reference models — no brand, asset, or code reuse from other products (including Kaivaryn). Create **separate** Stripe products/prices for Benchline.

## Quick start

```bash
cd /workspace/project-30k/benchline
cp .env.example .env.local
# fill in keys (see below)
npm install
npm run pack:kits
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm test
npm run build
```

## Environment variables

See `.env.example` for the full list (placeholders only).

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL (no trailing slash) — Stripe success/cancel URLs, sitemap, OG |
| `STRIPE_SECRET_KEY` | Stripe secret key (checkout, success-page verification, billing portal) |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Publishable key (reserved; Checkout is server-redirect) |
| `STRIPE_PRICE_*` | **Optional** Price ID overrides — prices are found by lookup key by default |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role — webhook fulfillment, Pro sync, analytics, dashboard |
| `FOUNDER_EMAIL` | Comma-separated allowlist for `/dashboard` |
| `DOWNLOAD_SIGNING_SECRET` | HMAC secret for signed download tokens |
| `OPENAI_API_KEY` | Optional — dashboard AI analyst |

**Never commit `.env.local` or secrets.**

## Stripe setup (Benchline products in Kaivaryn LLC's Stripe account)

Benchline is sold through **Kaivaryn LLC's** Stripe account. Create **separate** Benchline products and prices
(never reuse other Kaivaryn prices). Give every price the **lookup key** below — checkout resolves prices by
lookup key (`lib/stripe-prices.ts`), so no Price-ID env vars are needed. (An env override
`STRIPE_PRICE_<PRODUCT_ID>` or the legacy `STRIPE_PRICE_CORE/_MEMBERSHIP/_BUNDLE` wins if set.)

| Product (Stripe name) | Price | Type | Lookup key |
|---|---|---|---|
| Benchline Core Kit | $199.00 | one-time | `benchline_core_kit` |
| Benchline Pro | $29.00 / month | recurring monthly | `benchline_updates_monthly` |
| Benchline Core + 3 Months Pro | $249.00 | one-time | `benchline_core_bundle` |
| House Cleaning Trade Kit | $129.00 | one-time | `benchline_kit_cleaning` |
| Handyman Trade Kit | $129.00 | one-time | `benchline_kit_handyman` |
| Lawn Care Trade Kit | $129.00 | one-time | `benchline_kit_lawn_care` |
| Pressure Washing Trade Kit | $129.00 | one-time | `benchline_kit_pressure_washing` |
| Mobile Auto Detailing Trade Kit | $129.00 | one-time | `benchline_kit_detailing` |
| Core Kit + House Cleaning Kit | $279.00 | one-time | `benchline_bundle_core_cleaning` |
| Core Kit + Handyman Kit | $279.00 | one-time | `benchline_bundle_core_handyman` |
| Core Kit + Lawn Care Kit | $279.00 | one-time | `benchline_bundle_core_lawn_care` |
| Core Kit + Pressure Washing Kit | $279.00 | one-time | `benchline_bundle_core_pressure_washing` |
| Core Kit + Mobile Auto Detailing Kit | $279.00 | one-time | `benchline_bundle_core_detailing` |
| Pricing Calculator Pack | $39.00 | one-time | `benchline_addon_pricing_calculator` |
| Contracts & Waivers Pack | $49.00 | one-time | `benchline_addon_contracts_waivers` |
| Client Retention Text Pack | $29.00 | one-time | `benchline_addon_client_retention` |
| Hiring Your First Helper Pack | $49.00 | one-time | `benchline_addon_first_helper` |

Suggested product metadata: `business=benchline`.

**Checkout:** `POST /api/checkout` creates a Checkout Session — `mode=payment` for one-time carts,
`mode=subscription` when Pro is in the cart. Success URL: `${NEXT_PUBLIC_SITE_URL}/success?session_id={CHECKOUT_SESSION_ID}`;
cancel URL: `${NEXT_PUBLIC_SITE_URL}/cancel`. Session metadata `source=benchline` (+ `subscription_data.metadata.source=benchline`)
lets the webhook ignore other Kaivaryn LLC events on the shared account. Renewal terms are shown above the pay button
(`custom_text.submit`). With no `STRIPE_SECRET_KEY`, checkout returns a clean `503`.

**Success page:** `/success` retrieves the session server-side and shows "Your back office is ready." only when it is
`complete` and `paid` (or the subscription is active). Otherwise it shows a neutral "couldn't confirm" state.
Fulfillment never depends on the success page.

**Webhook:** `POST https://YOUR_DOMAIN/api/webhooks/stripe` — subscribe to:

- `checkout.session.completed`, `checkout.session.async_payment_succeeded` — create order + items (download keys); bundle sets `orders.pro_access_until` = purchase + 3 months (no auto-renew); records `purchase` analytics
- `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted` — mirror Pro status into `subscriptions`
- `invoice.paid`, `invoice.payment_failed` — refresh subscription status (active / past_due)
- `charge.refunded` — full refund marks the order `refunded`, revoking its downloads and bundle Pro months

**Customer portal:** enable Stripe Billing → Customer portal (allow cancel + update payment method). `/account` →
"Manage billing / cancel" opens it via `/api/billing-portal`.

Local test: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

**Pro access rules** (`lib/pro-access.ts`): an active/trialing/past_due subscription, or a paid bundle order whose
`pro_access_until` is in the future. The Pro Library (`content/products/pro-library`) downloads at
`/api/downloads/pro-library` only while access is active.

## Supabase setup

1. Create a new Supabase project for Benchline.
2. Enable Email auth (magic link and/or password).
3. In **SQL Editor**, run `supabase/schema.sql`, then every file in `supabase/migrations/` in order
   (catalog columns + 17 products, `subscriptions`, `orders.pro_access_until`, `analytics_events`).
4. Copy Project URL + anon key + service role key into env.
5. Add redirect URL: `https://YOUR_DOMAIN/auth/callback` (and localhost for dev).

## Digital delivery

- Kit source files live in `content/products/<kit>/` (never in `public/`). `lib/kits.ts` lists every file; a test asserts it matches disk.
- `npm run pack:kits` zips every kit to `private/downloads/benchline-<kit>.zip` (`pack:core-kit` is an alias). The ZIPs are committed.
- `npm run generate:sheets` regenerates every XLSX (live formulas) and trade rate-card CSV.
- `node scripts/build-previews.mjs` rebuilds `content/previews.json` (homepage excerpts) from the real files (needs LibreOffice locally).
- After the webhook marks an order `paid`, `/account` lists one download per kit → `/api/downloads/<kit>?orderId=…` (auth + ownership + entitlement).

## Analytics (first-party)

`analytics_events` (RLS on, service-role only) stores `page_view`, `pricing_viewed`, `checkout_click` (browser →
`/api/analytics`), `checkout_started` (checkout route) and `purchase` (webhook). No cookies, emails, IPs, or third-party
trackers — just path, product id, a random per-tab id, and referrer host. The funnel shows on `/dashboard`.

## Founder dashboard

- Route: `/dashboard`
- Protected by `FOUNDER_EMAIL` allowlist (must match signed-in Supabase user email).
- KPIs and AI analyst use **real** `orders` / `order_items` / `support_tickets` aggregates only.
- If `OPENAI_API_KEY` is unset, a rule-based summary is used.

## Deploy on Render

Blueprint: `render.yaml`

1. Push this repo to `curtisbailey98-commits/benchline`.
2. In Render, **New → Blueprint** and select the repo, or create a Web Service with:
   - Build: `npm ci && npm run pack:kits && npm run build`
   - Start: `npm run start`
3. Set all env vars from `.env.example`.
4. Point Stripe webhook at `https://YOUR_RENDER_URL/api/webhooks/stripe`.

## Tests

```bash
npm test
```

Covers the catalog and pricing math, kit files vs disk, ZIPs present, checkout validation, Stripe price resolution,
success-page verification, entitlements, Pro access, cart suggestions, analytics sanitizing, and the downloads /
checkout / analytics routes.

## Catalog

See `lib/products.ts`. Main offers: Core Kit $199 · Core + 3 Months Pro $249 (Best value) · Benchline Pro $29/mo.
Secondary: 5 Trade Kits $129, 5 Core + Trade Kit bundles $279, 4 add-on packs $29–$49.

## Project layout (high level)

```
app/                 # App Router pages + API routes
components/          # UI + cart provider
lib/                 # products, pricing, stripe, supabase, webhook, analyst
content/products/    # Source kit content (owned)
private/downloads/   # Gated ZIPs (served only via /api/downloads)
supabase/            # schema.sql + migrations/
```
