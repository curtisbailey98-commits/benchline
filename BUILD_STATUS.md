# Benchline BUILD_STATUS

**Last updated:** Wednesday Sep 30, 2026, ~2:30 AM ET (pre-launch upgrade, local commit — not pushed/deployed)  
**Path:** `/workspace/project-30k/benchline`  
**Repo:** `curtisbailey98-commits/benchline` (branch `main`)

## Live infrastructure

| Piece | Status | Details |
|-------|--------|---------|
| GitHub | Pushed | `curtisbailey98-commits/benchline` @ `main` (deployed commit `60d6f3f`) |
| Render | **Live** (free plan, Virginia) | Service `srv-dau7am7avr4c738088og` → https://benchline.onrender.com — autoDeploy on `main` |
| Supabase | **ACTIVE_HEALTHY** (free, us-east-1) | Project ref `iwgsxwvtjgtryntacrsv` → https://iwgsxwvtjgtryntacrsv.supabase.co — `schema.sql` + migration `benchline_catalog_pro_analytics` applied (11 tables, RLS on, 17 products/prices seeded) |
| Stripe | **Blocked** | Product/price creation failed: the Stripe MCP key lacks `PostProducts` write permission. No Benchline products exist yet. |

### Render env vars set (values not stored here)

- `NODE_VERSION=20`, `NEXT_PUBLIC_SITE_URL=https://benchline.onrender.com`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (legacy anon JWT)
- `FOUNDER_EMAIL=curtisbailey98@gmail.com`
- `DOWNLOAD_SIGNING_SECRET` (random 48-byte hex, set directly in Render only)

### Health check (Sep 29, 2026, ~10:40 PM ET)

- `/`, `/shop`, `/shop/core-kit`, `/shop/updates`, `/shop/core-bundle`, `/cart`, `/account`, `/account/login`, policies → 200
- `POST /api/checkout` → 503 `{"error":"Stripe is not configured (STRIPE_SECRET_KEY)."}` (clean, no crash)
- `POST /api/webhooks/stripe` → 503 `Webhook not configured`
- `/dashboard` → 307 redirect to `/account/login?next=/dashboard` (auth required)
- `/api/downloads/core-kit` → 401 `Sign in required`
- **Security fix (local commit, not yet deployed):** the paid Core Kit ZIP and markdown files were publicly downloadable at `/downloads/...` because they lived in `public/`. Moved the ZIP to `private/downloads/` (served only by the gated API route), removed the `public/downloads/core-kit` mirror (identical to `content/products/core-kit`), pack script now reads from `content/`. Needs push to go live.

## Done (code)

- [x] Storefront, cart, Stripe Checkout API, webhook, Supabase auth, account, founder dashboard, policies
- [x] Pre-launch upgrade (Sep 30): new hero, Core Kit reframed as 7 systems (new files: 00-START-HERE, 07 pricing guide, 08 pricing calculator XLSX, 09 lead follow-up system, 10 weekly money dashboard XLSX), How-it-works flow, previews from real files, 3-card pricing (Best value bundle), Is Benchline for me?, 14-question FAQ, verified success page, Terms page, legal links near checkout, OG/Twitter image, sitemap/robots
- [x] Benchline Updates renamed **Benchline Pro** (id/slug `updates` unchanged) + Pro Library download, subscription sync, bundle 3-month Pro entitlement, billing portal
- [x] Catalog: 5 Trade Kits ($129), 5 Core+Kit bundles ($279), 4 add-ons ($29–$49); `/shop?trade=`, `/for/[trade]` pages, cart bundle-swap + cross-sells
- [x] Webhook: checkout completed/async succeeded, subscription created/updated/deleted, invoice paid/failed, charge.refunded (revoke); ignores non-Benchline events on the shared Stripe account
- [x] First-party analytics (`analytics_events`) + funnel on `/dashboard`
- [x] Vitest 52/52; `npm run build` passing; Playwright QA screenshots in `/workspace/project-30k/qa/`

## Still needed from Curtis (before launch)

- [ ] Push the local commit(s) to GitHub — Render auto-deploys `main`
- [ ] In **Kaivaryn LLC's Stripe account**, create the 17 Benchline prices with the lookup keys in README → "Stripe setup" (at minimum the 3 main offers: `benchline_core_kit`, `benchline_updates_monthly`, `benchline_core_bundle`)
- [ ] Render env: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (build-time), `STRIPE_WEBHOOK_SECRET`, **`SUPABASE_SERVICE_ROLE_KEY`** (without it orders are NOT recorded and downloads never unlock)
- [ ] Stripe webhook endpoint `https://benchline.onrender.com/api/webhooks/stripe` with the events listed in README
- [ ] Enable the Stripe Customer Portal (cancel + update card) so "Manage billing / cancel" works
- [ ] Supabase Auth: Site URL `https://benchline.onrender.com`, redirect `https://benchline.onrender.com/auth/callback`
- [ ] Have an attorney review Terms / Refund / Privacy and the contract templates; confirm support channel (no support email exists — site uses the contact form)
- [ ] One real end-to-end purchase + refund test per mode (one-time, subscription) before announcing

## Notes

- `render.yaml` now uses `plan: free` to match the live service (free plan spins down after ~15 min idle; first request is slow).
- Bundle is a **one-time** Stripe price ($249); its 3 Pro months are granted via `orders.pro_access_until` (no auto-renew). Pro alone uses Checkout `subscription` mode.
- Kaivaryn repo/service/Stripe link/Supabase project were not touched.
