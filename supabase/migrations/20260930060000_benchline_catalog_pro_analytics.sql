-- Benchline: trade kits / add-ons catalog, Benchline Pro entitlements, first-party funnel analytics.
-- Applied to project iwgsxwvtjgtryntacrsv as migration "benchline_catalog_pro_analytics".

-- 1) Catalog columns
alter table public.products add column if not exists category text;
alter table public.products add column if not exists trade text;
alter table public.products add column if not exists stripe_lookup_key text;
alter table public.products add column if not exists download_keys text[] not null default '{}';
alter table public.products add column if not exists sort_order integer not null default 0;
create unique index if not exists products_stripe_lookup_key_key on public.products(stripe_lookup_key);

alter table public.prices add column if not exists lookup_key text;
create unique index if not exists prices_lookup_key_key on public.prices(lookup_key);

-- 2) Multi-download entitlements per order item (download_key kept for backwards compatibility)
alter table public.order_items add column if not exists download_keys text[] not null default '{}';
update public.order_items set download_keys = array[download_key]
  where download_key is not null and cardinality(download_keys) = 0;

-- 3) Bundle "3 months Pro" entitlement: set by the webhook to purchase time + 3 months, never auto-renews
alter table public.orders add column if not exists pro_access_until timestamptz;

-- 4) Benchline Pro subscriptions (mirrors Stripe; written only by the webhook via service role)
create table if not exists public.subscriptions (
  id text primary key,                      -- Stripe subscription id (sub_...)
  customer_id uuid references public.customers(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  stripe_customer_id text,
  product_id text references public.products(id) on delete set null,
  status text not null,                     -- Stripe status: active, trialing, past_due, canceled, unpaid, incomplete, ...
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_subscriptions_user_id on public.subscriptions(user_id);
create index if not exists idx_subscriptions_email on public.subscriptions(lower(email));
create index if not exists idx_subscriptions_customer_id on public.subscriptions(customer_id);
create index if not exists idx_subscriptions_product_id on public.subscriptions(product_id);
alter table public.subscriptions enable row level security;
drop policy if exists "Users read own subscriptions" on public.subscriptions;
create policy "Users read own subscriptions" on public.subscriptions for select
  using ((select auth.uid()) = user_id or lower(email) = lower((select auth.jwt()) ->> 'email'));

-- 5) First-party funnel analytics (no PII: no emails, IPs, or user ids; anonymous per-tab id only)
create table if not exists public.analytics_events (
  id bigint generated always as identity primary key,
  event text not null check (event in ('page_view', 'pricing_viewed', 'checkout_click', 'checkout_started', 'purchase')),
  path text check (char_length(path) <= 200),
  product_id text check (char_length(product_id) <= 64),
  anon_id text check (char_length(anon_id) <= 64),
  referrer_host text check (char_length(referrer_host) <= 120),
  value_cents integer,
  created_at timestamptz not null default now()
);
create index if not exists idx_analytics_events_event_created on public.analytics_events(event, created_at desc);
-- RLS on with no policies: only the service role (server routes / webhook) can read or write.
alter table public.analytics_events enable row level security;

-- 6) Seed / refresh catalog (display name "Benchline Pro" keeps id/slug "updates")
insert into public.products (id, slug, name, description, download_key, category, trade, stripe_lookup_key, download_keys, sort_order) values
  ('core-kit', 'core-kit', 'Benchline Core Kit', 'Seven ready-to-use business systems: job pricing, fast estimates, lead follow-up, customer intake, job checklists, review requests, and a weekly money dashboard. Markdown, CSV, and XLSX spreadsheets with working formulas.', 'core-kit', 'core', null, 'benchline_core_kit', array['core-kit']::text[], 10),
  ('updates', 'updates', 'Benchline Pro', 'A monthly membership that keeps adding tools to your Benchline toolkit, starting with the Pro Library. $29/month, renews monthly until you cancel.', null, 'membership', null, 'benchline_updates_monthly', array[]::text[], 20),
  ('core-bundle', 'core-bundle', 'Benchline Core + 3 Months Pro', 'The full Core Kit plus three months of Benchline Pro for one payment of $249 — $199 + $87 = $286 value, you save $37. The 3 Pro months don''t auto-renew.', 'core-kit', 'bundle', null, 'benchline_core_bundle', array['core-kit']::text[], 30),
  ('cleaning-kit', 'cleaning-kit', 'House Cleaning Trade Kit', 'Room-based quote builder spreadsheet, move-out pricing, room-by-room checklists, a cleaning service agreement, intake questions, rebooking and review texts, and a 12-month marketing calendar.', 'cleaning-kit', 'trade-kit', 'cleaning', 'benchline_kit_cleaning', array['cleaning-kit']::text[], 40),
  ('handyman-kit', 'handyman-kit', 'Handyman Trade Kit', 'Task-by-task pricing guide and calculator, change-order form, handyman service agreement, estimate template with exclusions, job checklists, intake questions, follow-up texts, and a seasonal calendar.', 'handyman-kit', 'trade-kit', 'handyman', 'benchline_kit_handyman', array['handyman-kit']::text[], 50),
  ('lawn-care-kit', 'lawn-care-kit', 'Lawn Care Trade Kit', 'Lot-size mowing price calculator, seasonal contract calculator, route planner, seasonal maintenance contract, estimate template, job checklists, intake questions, texts, and a mowing-season marketing calendar.', 'lawn-care-kit', 'trade-kit', 'lawn-care', 'benchline_kit_lawn_care', array['lawn-care-kit']::text[], 60),
  ('pressure-washing-kit', 'pressure-washing-kit', 'Pressure Washing Trade Kit', 'Surface pricing matrix and quote calculator with condition multipliers, pre-job damage waiver, service agreement, estimate template, job checklists, intake questions, texts, and a seasonal calendar.', 'pressure-washing-kit', 'trade-kit', 'pressure-washing', 'benchline_kit_pressure_washing', array['pressure-washing-kit']::text[], 70),
  ('detailing-kit', 'detailing-kit', 'Mobile Auto Detailing Trade Kit', 'Detail package menu, vehicle condition inspection form, package calculator with size multipliers and surcharges, service agreement, estimate template, checklists, intake questions, texts, and a seasonal calendar.', 'detailing-kit', 'trade-kit', 'detailing', 'benchline_kit_detailing', array['detailing-kit']::text[], 80),
  ('core-plus-cleaning', 'core-plus-cleaning', 'Core Kit + House Cleaning Kit', 'Benchline Core Kit ($199) and the House Cleaning Trade Kit ($129) together for $279 — both ZIP downloads unlock right after purchase.', 'core-kit', 'bundle', 'cleaning', 'benchline_bundle_core_cleaning', array['core-kit','cleaning-kit']::text[], 90),
  ('core-plus-handyman', 'core-plus-handyman', 'Core Kit + Handyman Kit', 'Benchline Core Kit ($199) and the Handyman Trade Kit ($129) together for $279 — both ZIP downloads unlock right after purchase.', 'core-kit', 'bundle', 'handyman', 'benchline_bundle_core_handyman', array['core-kit','handyman-kit']::text[], 100),
  ('core-plus-lawn-care', 'core-plus-lawn-care', 'Core Kit + Lawn Care Kit', 'Benchline Core Kit ($199) and the Lawn Care Trade Kit ($129) together for $279 — both ZIP downloads unlock right after purchase.', 'core-kit', 'bundle', 'lawn-care', 'benchline_bundle_core_lawn_care', array['core-kit','lawn-care-kit']::text[], 110),
  ('core-plus-pressure-washing', 'core-plus-pressure-washing', 'Core Kit + Pressure Washing Kit', 'Benchline Core Kit ($199) and the Pressure Washing Trade Kit ($129) together for $279 — both ZIP downloads unlock right after purchase.', 'core-kit', 'bundle', 'pressure-washing', 'benchline_bundle_core_pressure_washing', array['core-kit','pressure-washing-kit']::text[], 120),
  ('core-plus-detailing', 'core-plus-detailing', 'Core Kit + Mobile Auto Detailing Kit', 'Benchline Core Kit ($199) and the Mobile Auto Detailing Trade Kit ($129) together for $279 — both ZIP downloads unlock right after purchase.', 'core-kit', 'bundle', 'detailing', 'benchline_bundle_core_detailing', array['core-kit','detailing-kit']::text[], 130),
  ('pricing-calculator-pack', 'pricing-calculator-pack', 'Pricing Calculator Pack', 'Five spreadsheet calculators with formulas (hourly target, job profit check, drive-time cost, break-even, price increase planner) plus scripts for presenting prices and raising them.', 'pricing-calculator-pack', 'add-on', null, 'benchline_addon_pricing_calculator', array['pricing-calculator-pack']::text[], 140),
  ('contracts-waivers-pack', 'contracts-waivers-pack', 'Contracts & Waivers Pack', 'One-time and recurring service agreements, deposit and cancellation policy, property condition waiver, photo release, change order, payment terms, and a re-do policy. Not legal advice.', 'contracts-waivers-pack', 'add-on', null, 'benchline_addon_contracts_waivers', array['contracts-waivers-pack']::text[], 150),
  ('client-retention-pack', 'client-retention-pack', 'Client Retention Text Pack', 'Lead response, quote follow-up, booking and reminder, review and referral, win-back, and tough-conversation text scripts plus a simple client tracker CSV.', 'client-retention-pack', 'add-on', null, 'benchline_addon_client_retention', array['client-retention-pack']::text[], 160),
  ('first-helper-pack', 'first-helper-pack', 'Hiring Your First Helper Pack', 'Readiness checklist, employee vs contractor overview, job posts, interview and paid trial-day plan, onboarding checklist, SOP template, quality check form, and a helper cost calculator.', 'first-helper-pack', 'add-on', null, 'benchline_addon_first_helper', array['first-helper-pack']::text[], 170)
on conflict (id) do update set slug = excluded.slug, name = excluded.name, description = excluded.description, download_key = excluded.download_key, category = excluded.category, trade = excluded.trade, stripe_lookup_key = excluded.stripe_lookup_key, download_keys = excluded.download_keys, sort_order = excluded.sort_order, active = true;

insert into public.prices (id, product_id, unit_amount, billing_type, interval, lookup_key) values
  ('price_core', 'core-kit', 19900, 'one_time', null, 'benchline_core_kit'),
  ('price_updates', 'updates', 2900, 'recurring', 'month', 'benchline_updates_monthly'),
  ('price_bundle', 'core-bundle', 24900, 'bundle', null, 'benchline_core_bundle'),
  ('price_cleaning_kit', 'cleaning-kit', 12900, 'one_time', null, 'benchline_kit_cleaning'),
  ('price_handyman_kit', 'handyman-kit', 12900, 'one_time', null, 'benchline_kit_handyman'),
  ('price_lawn_care_kit', 'lawn-care-kit', 12900, 'one_time', null, 'benchline_kit_lawn_care'),
  ('price_pressure_washing_kit', 'pressure-washing-kit', 12900, 'one_time', null, 'benchline_kit_pressure_washing'),
  ('price_detailing_kit', 'detailing-kit', 12900, 'one_time', null, 'benchline_kit_detailing'),
  ('price_core_plus_cleaning', 'core-plus-cleaning', 27900, 'bundle', null, 'benchline_bundle_core_cleaning'),
  ('price_core_plus_handyman', 'core-plus-handyman', 27900, 'bundle', null, 'benchline_bundle_core_handyman'),
  ('price_core_plus_lawn_care', 'core-plus-lawn-care', 27900, 'bundle', null, 'benchline_bundle_core_lawn_care'),
  ('price_core_plus_pressure_washing', 'core-plus-pressure-washing', 27900, 'bundle', null, 'benchline_bundle_core_pressure_washing'),
  ('price_core_plus_detailing', 'core-plus-detailing', 27900, 'bundle', null, 'benchline_bundle_core_detailing'),
  ('price_pricing_calculator_pack', 'pricing-calculator-pack', 3900, 'one_time', null, 'benchline_addon_pricing_calculator'),
  ('price_contracts_waivers_pack', 'contracts-waivers-pack', 4900, 'one_time', null, 'benchline_addon_contracts_waivers'),
  ('price_client_retention_pack', 'client-retention-pack', 2900, 'one_time', null, 'benchline_addon_client_retention'),
  ('price_first_helper_pack', 'first-helper-pack', 4900, 'one_time', null, 'benchline_addon_first_helper')
on conflict (id) do update set unit_amount = excluded.unit_amount, billing_type = excluded.billing_type, interval = excluded.interval, lookup_key = excluded.lookup_key, active = true;
