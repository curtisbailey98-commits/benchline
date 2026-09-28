# Benchline BUILD_STATUS

**Date:** Sunday Sep 27, 2026 (America/New_York)  
**Path:** `/workspace/project-30k/benchline`  
**Repo target:** `curtisbailey98-commits/benchline` (create/push separately)

## Done

- [x] Next.js App Router scaffold (TypeScript, Tailwind, ESLint, `@/*`)
- [x] Brand UI: dark charcoal + warm amber, Geist fonts, SVG `Logo` component
- [x] Homepage: USP, products, how it works, FAQ (no fake testimonials/counts)
- [x] `/shop` catalog + `/shop/[slug]` PDPs with Core Kit upsells
- [x] Cart (React context + localStorage) + abandoned-cart email capture w/ consent
- [x] Stripe Checkout API (`/api/checkout`) — multi-line; one-time + recurring via env price IDs
- [x] `/success` + `/cancel` pages
- [x] Stripe webhook (`/api/webhooks/stripe`) — signature verify, idempotent `stripe_events`, order + items
- [x] Supabase schema SQL (`supabase/schema.sql`) — products, prices, customers, orders, order_items, stripe_events, profiles, support_tickets, cart_abandonment
- [x] Auth pages — magic link + email/password via Supabase; `/auth/callback`
- [x] `/account` order history (real DB when configured; empty state otherwise)
- [x] `/dashboard` founder KPIs + tickets + AI analyst (OpenAI if key set, else rule-based from real aggregates)
- [x] Policies: privacy, refunds, digital delivery; contact form → `support_tickets`
- [x] Original Core Kit content under `content/products/core-kit/` + mirror + ZIP in `public/downloads/`
- [x] Auth-gated downloads `/api/downloads/[product]`
- [x] `.env.example`, `README.md`, `render.yaml`
- [x] Vitest: pricing, cart totals, webhook idempotency helper — **9/9 passed**
- [x] `npm run build` — **passed**

## Blocked / remaining activation (ops, not code)

- [ ] Create GitHub repo `curtisbailey98-commits/benchline` and push this tree
- [ ] Create **Benchline-only** Stripe products/prices (do not reuse Kaivaryn) and set:
  - `STRIPE_PRICE_CORE`, `STRIPE_PRICE_MEMBERSHIP`, `STRIPE_PRICE_BUNDLE`
  - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] Create Supabase project, run `supabase/schema.sql`, set URL/anon/service role keys
- [ ] Set `FOUNDER_EMAIL`, `NEXT_PUBLIC_SITE_URL`, `DOWNLOAD_SIGNING_SECRET`
- [ ] Optional: `OPENAI_API_KEY` for dashboard analyst
- [ ] Deploy on Render from `render.yaml`; register Stripe webhook URL
- [ ] End-to-end purchase test in Stripe test mode

## Notes

- Without Stripe/Supabase env vars the site still builds and browses; checkout/auth/downloads return clear 503/config messages.
- Bundle is treated as a **one-time** Stripe price ($249). Updates alone uses Checkout `subscription` mode.
- Kaivaryn code/repos were not touched.
