import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isFounderEmail } from "@/lib/auth";
import { summarizeDashboard, type DashboardAggregates } from "@/lib/analyst";
import { PRODUCTS as PRODUCTS_BY_NAME } from "@/lib/products";
import { ANALYTICS_EVENTS, summarizeFunnel, type FunnelCounts } from "@/lib/analytics";
import { CATEGORY_LABELS, formatPrice, getProductById } from "@/lib/products";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, hasSupabaseAdmin } from "@/lib/supabase/admin";

// Per-user page: always render at request time (reads the auth cookie).
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Founder dashboard" };

function emptyAggregates(): DashboardAggregates {
  return {
    revenueCents: 0,
    orderCount: 0,
    customerCount: 0,
    paidOrderCount: 0,
    productBreakdown: [],
    openTickets: 0,
    recentOrders: [],
  };
}

async function loadAggregates(): Promise<DashboardAggregates> {
  if (!hasSupabaseAdmin()) return emptyAggregates();

  const admin = createAdminClient();
  const { data: orders } = await admin
    .from("orders")
    .select("id, email, total_cents, status, created_at")
    .order("created_at", { ascending: false });

  const all = orders ?? [];
  const paid = all.filter((o) => o.status === "paid" || o.status === "fulfilled");
  const revenueCents = paid.reduce((s, o) => s + (o.total_cents || 0), 0);
  const emails = new Set(all.map((o) => o.email?.toLowerCase()).filter(Boolean));

  const { data: items } = await admin
    .from("order_items")
    .select("product_name, quantity, unit_amount_cents, order_id");

  const paidIds = new Set(paid.map((o) => o.id));
  const breakdownMap = new Map<string, { units: number; revenueCents: number }>();
  for (const item of items ?? []) {
    if (!paidIds.has(item.order_id)) continue;
    const cur = breakdownMap.get(item.product_name) || { units: 0, revenueCents: 0 };
    cur.units += item.quantity || 0;
    cur.revenueCents += (item.unit_amount_cents || 0) * (item.quantity || 0);
    breakdownMap.set(item.product_name, cur);
  }

  const { count: openTickets } = await admin
    .from("support_tickets")
    .select("*", { count: "exact", head: true })
    .eq("status", "open");

  const { count: customerCount } = await admin
    .from("customers")
    .select("*", { count: "exact", head: true });

  return {
    revenueCents,
    orderCount: all.length,
    customerCount: customerCount ?? emails.size,
    paidOrderCount: paid.length,
    productBreakdown: [...breakdownMap.entries()].map(([name, v]) => ({
      name,
      units: v.units,
      revenueCents: v.revenueCents,
    })),
    openTickets: openTickets ?? 0,
    recentOrders: all.slice(0, 20).map((o) => ({
      id: o.id,
      email: o.email,
      totalCents: o.total_cents,
      status: o.status,
      createdAt: o.created_at,
    })),
  };
}

const FUNNEL_LABELS: Record<string, string> = {
  page_view: "Page views",
  pricing_viewed: "Saw pricing",
  checkout_click: "Clicked checkout",
  checkout_started: "Checkout opened (Stripe)",
  purchase: "Purchased (paid, per product)",
};

async function loadFunnel(days: number): Promise<{ funnel: FunnelCounts; byProduct: Array<{ id: string; clicks: number; purchases: number }> } | null> {
  if (!hasSupabaseAdmin()) return null;
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const { data, error } = await createAdminClient()
    .from("analytics_events")
    .select("event, anon_id, product_id")
    .gte("created_at", since)
    .limit(50000);
  if (error) return null;
  const rows = data ?? [];
  const byProduct = new Map<string, { clicks: number; purchases: number }>();
  for (const r of rows) {
    if (!r.product_id) continue;
    const cur = byProduct.get(r.product_id) ?? { clicks: 0, purchases: 0 };
    if (r.event === "checkout_click") cur.clicks += 1;
    if (r.event === "purchase") cur.purchases += 1;
    byProduct.set(r.product_id, cur);
  }
  return {
    funnel: summarizeFunnel(rows),
    byProduct: [...byProduct.entries()].map(([id, v]) => ({ id, ...v })).sort((a, b) => b.clicks - a.clicks),
  };
}

async function loadProCounts(): Promise<{ activeSubs: number; pastDue: number; bundleActive: number }> {
  if (!hasSupabaseAdmin()) return { activeSubs: 0, pastDue: 0, bundleActive: 0 };
  const admin = createAdminClient();
  const [{ count: activeSubs }, { count: pastDue }, { count: bundleActive }] = await Promise.all([
    admin.from("subscriptions").select("*", { count: "exact", head: true }).in("status", ["active", "trialing"]),
    admin.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "past_due"),
    admin
      .from("orders")
      .select("*", { count: "exact", head: true })
      .in("status", ["paid", "fulfilled"])
      .gt("pro_access_until", new Date().toISOString()),
  ]);
  return { activeSubs: activeSubs ?? 0, pastDue: pastDue ?? 0, bundleActive: bundleActive ?? 0 };
}

export default async function DashboardPage() {
  const configured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!configured) {
    return (
      <div className="container-page py-14">
        <h1 className="text-3xl font-semibold">Founder dashboard</h1>
        <p className="mt-4 text-muted">Configure Supabase and FOUNDER_EMAIL to use this page.</p>
      </div>
    );
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) {
    redirect("/account/login?next=/dashboard");
  }

  if (!isFounderEmail(user.email)) {
    return (
      <div className="container-page py-14">
        <h1 className="text-3xl font-semibold">Founder dashboard</h1>
        <p className="mt-4 text-muted">
          Access restricted. Sign in with an email listed in{" "}
          <code className="text-amber">FOUNDER_EMAIL</code>.
        </p>
        <Link href="/account" className="btn btn-secondary mt-6">
          Back to account
        </Link>
      </div>
    );
  }

  const [aggregates, funnel30, proCounts] = await Promise.all([loadAggregates(), loadFunnel(30), loadProCounts()]);
  const { summary, source } = await summarizeDashboard(aggregates);

  const { data: tickets } = hasSupabaseAdmin()
    ? await createAdminClient()
        .from("support_tickets")
        .select("id, email, subject, status, created_at")
        .order("created_at", { ascending: false })
        .limit(15)
    : { data: [] as Array<{ id: string; email: string; subject: string; status: string; created_at: string }> };

  const { data: products } = hasSupabaseAdmin()
    ? await createAdminClient().from("products").select("id, name, slug, active")
    : { data: [] as Array<{ id: string; name: string; slug: string; active: boolean }> };

  return (
    <div className="container-page py-14">
      <h1 className="text-3xl font-semibold tracking-tight">Founder dashboard</h1>
      <p className="mt-2 text-sm text-muted">Signed in as {user.email}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Revenue (paid)", formatPrice(aggregates.revenueCents)],
          ["Paid orders", String(aggregates.paidOrderCount)],
          ["Customers", String(aggregates.customerCount)],
          ["Open tickets", String(aggregates.openTickets)],
        ].map(([label, value]) => (
          <div key={label} className="card">
            <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-amber">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {[
          ["Active Pro subscriptions", String(proCounts.activeSubs)],
          ["Pro past due", String(proCounts.pastDue)],
          ["Bundle Pro months active", String(proCounts.bundleActive)],
        ].map(([label, value]) => (
          <div key={label} className="card !py-4">
            <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
            <p className="mt-1 text-xl font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <section className="card mt-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Funnel — last 30 days</h2>
          <span className="text-xs text-muted">First-party events · no cookies · no third-party trackers</span>
        </div>
        {!funnel30 ? (
          <p className="mt-3 text-sm text-muted">Analytics unavailable (needs SUPABASE_SERVICE_ROLE_KEY and the analytics_events table).</p>
        ) : (
          <>
            <table className="mt-4 w-full text-sm">
              <thead className="text-xs text-muted">
                <tr>
                  <th className="py-1 text-left font-normal">Step</th>
                  <th className="py-1 text-right font-normal">Events</th>
                  <th className="py-1 text-right font-normal">Visitors*</th>
                  <th className="py-1 text-right font-normal">vs. previous step</th>
                </tr>
              </thead>
              <tbody>
                {ANALYTICS_EVENTS.map((e, i) => {
                  const cur = funnel30.funnel[e].visitors;
                  const prev = i > 0 ? funnel30.funnel[ANALYTICS_EVENTS[i - 1]].visitors : 0;
                  return (
                    <tr key={e} className="border-t border-border">
                      <td className="py-2">{FUNNEL_LABELS[e]}</td>
                      <td className="py-2 text-right font-mono">{funnel30.funnel[e].events}</td>
                      <td className="py-2 text-right font-mono">{cur}</td>
                      <td className="py-2 text-right font-mono text-muted">
                        {i === 0 || prev === 0 ? "—" : `${Math.round((cur / prev) * 100)}%`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="mt-2 text-xs text-muted">
              *Visitors = distinct anonymous browser-tab ids. Purchases come from the Stripe webhook (one per product bought).
            </p>
            {funnel30.byProduct.length > 0 ? (
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {funnel30.byProduct.map((p) => (
                  <li key={p.id} className="flex justify-between rounded-md border border-border px-3 py-2 text-sm">
                    <span>{getProductById(p.id)?.name ?? p.id}</span>
                    <span className="font-mono text-muted">{p.clicks} clicks · {p.purchases} sold</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        )}
      </section>

      <section className="card mt-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-semibold">AI analyst</h2>
          <span className="badge">{source === "openai" ? "OpenAI" : "Rule-based"}</span>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted">{summary}</p>
        <p className="mt-2 text-xs text-muted">
          Summaries use live order aggregates only — never invented metrics.
        </p>
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="font-semibold">Products</h2>
          <ul className="mt-3 space-y-2">
            {(products ?? []).length === 0 ? (
              <li className="text-sm text-muted">No products in DB yet — run schema.sql and supabase/migrations.</li>
            ) : (
              (products ?? []).map((p) => (
                <li key={p.id} className="card !py-3 text-sm">
                  {p.name}{" "}
                  <span className="text-muted">({p.slug})</span>
                </li>
              ))
            )}
          </ul>
        </section>

        <section>
          <h2 className="font-semibold">Product breakdown (paid)</h2>
          <ul className="mt-3 flex flex-wrap gap-2 text-xs">
            {Object.entries(
              aggregates.productBreakdown.reduce<Record<string, number>>((acc, p) => {
                const prod = [...PRODUCTS_BY_NAME].find((x) => x.name === p.name);
                const key = prod ? CATEGORY_LABELS[prod.category] + (prod.trade ? ` · ${prod.trade}` : "") : "Other";
                acc[key] = (acc[key] ?? 0) + p.revenueCents;
                return acc;
              }, {})
            ).map(([k, v]) => (
              <li key={k} className="rounded border border-border px-2 py-1 text-muted">
                {k}: <span className="text-foreground">{formatPrice(v)}</span>
              </li>
            ))}
          </ul>
          <ul className="mt-3 space-y-2">
            {aggregates.productBreakdown.length === 0 ? (
              <li className="text-sm text-muted">No paid line items yet.</li>
            ) : (
              aggregates.productBreakdown.map((p) => (
                <li key={p.name} className="card !py-3 flex justify-between text-sm">
                  <span>{p.name}</span>
                  <span className="text-muted">
                    {p.units} · {formatPrice(p.revenueCents)}
                  </span>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>

      <section className="mt-8">
        <h2 className="font-semibold">Recent orders</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs text-muted">
              <tr>
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Total</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {aggregates.recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 text-muted">
                    No orders yet.
                  </td>
                </tr>
              ) : (
                aggregates.recentOrders.map((o) => (
                  <tr key={o.id} className="border-t border-border">
                    <td className="py-2 pr-4 text-muted">
                      {new Date(o.createdAt).toLocaleString("en-US", {
                        timeZone: "America/New_York",
                      })}{" "}
                      ET
                    </td>
                    <td className="py-2 pr-4">{o.email}</td>
                    <td className="py-2 pr-4">{formatPrice(o.totalCents)}</td>
                    <td className="py-2">{o.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-semibold">Support tickets</h2>
        <ul className="mt-3 space-y-2">
          {(tickets ?? []).length === 0 ? (
            <li className="text-sm text-muted">No tickets.</li>
          ) : (
            (tickets ?? []).map((t) => (
              <li key={t.id} className="card !py-3 text-sm">
                <span className="badge mr-2">{t.status}</span>
                <span className="font-medium">{t.subject}</span>
                <span className="text-muted"> — {t.email}</span>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
