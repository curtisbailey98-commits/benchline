-- Benchline schema — run in Supabase SQL editor
-- Idempotent-ish: uses IF NOT EXISTS where practical

create extension if not exists "pgcrypto";

-- Products catalog (mirror of code catalog; Stripe price IDs live in prices)
create table if not exists products (
  id text primary key,
  slug text unique not null,
  name text not null,
  description text,
  active boolean not null default true,
  download_key text,
  created_at timestamptz not null default now()
);

create table if not exists prices (
  id text primary key,
  product_id text not null references products(id) on delete cascade,
  stripe_price_id text unique,
  currency text not null default 'usd',
  unit_amount integer not null,
  billing_type text not null check (billing_type in ('one_time', 'recurring', 'bundle')),
  interval text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  stripe_customer_id text unique,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  is_founder boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'fulfilled', 'refunded', 'canceled')),
  total_cents integer not null default 0,
  currency text not null default 'usd',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id text references products(id) on delete set null,
  price_id text references prices(id) on delete set null,
  stripe_price_id text,
  quantity integer not null default 1,
  unit_amount_cents integer not null,
  product_name text not null,
  download_key text,
  created_at timestamptz not null default now()
);

create table if not exists stripe_events (
  id text primary key,
  type text not null,
  processed_at timestamptz not null default now(),
  payload jsonb
);

create table if not exists support_tickets (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text,
  subject text not null,
  message text not null,
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'closed')),
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Stub for abandoned cart recovery
create table if not exists cart_abandonment (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  cart_snapshot jsonb not null default '[]'::jsonb,
  consent boolean not null default false,
  recovered boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_orders_email on orders(email);
create index if not exists idx_orders_user_id on orders(user_id);
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_order_items_order_id on order_items(order_id);
create index if not exists idx_support_tickets_status on support_tickets(status);
create index if not exists idx_cart_abandonment_email on cart_abandonment(email);

-- Seed products
insert into products (id, slug, name, description, download_key) values
  ('core-kit', 'core-kit', 'Benchline Core Kit', 'Notion-compatible packs + PDFs + CSV pricing for solo trades.', 'core-kit'),
  ('updates', 'updates', 'Benchline Updates', 'Monthly playbook drops for solo operators.', null),
  ('core-bundle', 'core-bundle', 'Core + 3 Months Updates', 'Core Kit plus three months of Updates.', 'core-kit')
on conflict (id) do nothing;

insert into prices (id, product_id, unit_amount, billing_type, interval) values
  ('price_core', 'core-kit', 19900, 'one_time', null),
  ('price_updates', 'updates', 2900, 'recurring', 'month'),
  ('price_bundle', 'core-bundle', 24900, 'bundle', null)
on conflict (id) do nothing;

-- RLS
alter table products enable row level security;
alter table prices enable row level security;
alter table customers enable row level security;
alter table profiles enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table stripe_events enable row level security;
alter table support_tickets enable row level security;
alter table cart_abandonment enable row level security;

-- Public read for products/prices
create policy "Public read products" on products for select using (active = true);
create policy "Public read prices" on prices for select using (active = true);

-- Users read own profile / orders
create policy "Users read own profile" on profiles for select using (auth.uid() = id);
create policy "Users update own profile" on profiles for update using (auth.uid() = id);
create policy "Users read own orders" on orders for select using (auth.uid() = user_id);
create policy "Users read own order items" on order_items for select using (
  exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid())
);

-- Support: anyone can insert; users read own
create policy "Anyone insert support" on support_tickets for insert with check (true);
create policy "Users read own tickets" on support_tickets for select using (
  auth.uid() = user_id or email = (auth.jwt() ->> 'email')
);

-- Cart abandonment: insert with consent only (enforced in app; allow insert)
create policy "Anyone insert cart abandonment" on cart_abandonment for insert with check (consent = true);

-- Service role bypasses RLS for webhooks / admin

-- Profile bootstrap on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email, updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
