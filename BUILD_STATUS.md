# Benchline BUILD_STATUS

**Last updated:** Tuesday Sep 29, 2026, ~10:45 PM ET  
**Path:** `/workspace/project-30k/benchline`  
**Repo:** `curtisbailey98-commits/benchline` (branch `main`)

## Live infrastructure

| Piece | Status | Details |
|-------|--------|---------|
| GitHub | Pushed | `curtisbailey98-commits/benchline` @ `main` (deployed commit `60d6f3f`) |
| Render | **Live** (free plan, Virginia) | Service `srv-dau7am7avr4c738088og` → https://benchline.onrender.com — autoDeploy on `main` |
| Supabase | **ACTIVE_HEALTHY** (free, us-east-1) | Project ref `iwgsxwvtjgtryntacrsv` → https://iwgsxwvtjgtryntacrsv.supabase.co — `supabase/schema.sql` applied (9 tables, RLS on, seed products/prices) |
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

- [x] Next.js App Router storefront, cart, Stripe Checkout API, webhook, Supabase auth, account, founder dashboard, policies
- [x] Core Kit content in `content/products/core-kit/`; ZIP built to `private/downloads/` by `npm run pack:core-kit`
- [x] Auth-gated downloads `/api/downloads/[product]`
- [x] Vitest 9/9 passing; `npm run build` passing

## Still needed from Curtis

- [ ] Push local commits to GitHub (agent has no GitHub write access) — Render auto-deploys `main`
- [ ] Grant Stripe MCP product/price write permission (or create in Dashboard): Benchline Core Kit $199 one-time, Benchline Updates $29/mo, Benchline Core + 3 Months Updates $249 one-time (metadata `business=benchline`); then set `STRIPE_PRICE_CORE`, `STRIPE_PRICE_MEMBERSHIP`, `STRIPE_PRICE_BUNDLE` on Render
- [ ] `STRIPE_SECRET_KEY` (secure input) and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (triggers rebuild — NEXT_PUBLIC_ is build-time)
- [ ] Create Stripe webhook → `https://benchline.onrender.com/api/webhooks/stripe` (`checkout.session.completed`) and provide `STRIPE_WEBHOOK_SECRET`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (Supabase Dashboard → Project Settings → API; not available via connector)
- [ ] Supabase Auth: set Site URL `https://benchline.onrender.com` and redirect URL `https://benchline.onrender.com/auth/callback`
- [ ] Optional: `OPENAI_API_KEY` for dashboard analyst
- [ ] End-to-end purchase test (live mode only — use a real card + refund, or a Stripe test-mode account)

## Notes

- `render.yaml` now uses `plan: free` to match the live service (free plan spins down after ~15 min idle; first request is slow).
- Bundle is a **one-time** Stripe price ($249). Updates alone uses Checkout `subscription` mode.
- Kaivaryn repo/service/Stripe link/Supabase project were not touched.
