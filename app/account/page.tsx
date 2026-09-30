import type { Metadata } from "next";
import Link from "next/link";
import { ManageBillingButton } from "@/components/ManageBillingButton";
import { itemDownloadKeys, PAID_STATUSES } from "@/lib/entitlements";
import { KITS } from "@/lib/kits";
import type { ProAccess } from "@/lib/pro-access";
import { loadProAccess } from "@/lib/pro-server";
import { formatPrice, PRO_RENEWAL_DISCLOSURE } from "@/lib/products";
import { createAdminClient, hasSupabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// Per-user page: always render at request time (reads the auth cookie).
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Account", robots: { index: false, follow: false } };

type OrderRow = {
  id: string;
  status: string;
  total_cents: number;
  created_at: string;
  order_items?: Array<{
    product_name: string;
    download_key: string | null;
    download_keys: string[] | null;
    quantity: number;
  }>;
};

const ORDER_SELECT =
  "id, status, total_cents, created_at, order_items(product_name, download_key, download_keys, quantity)";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { timeZone: "America/New_York", dateStyle: "medium" });
}

function ProCard({ access }: { access: ProAccess }) {
  if (!access.active) {
    const lapsed = access.lapsedSubscription;
    return (
      <div className="card">
        <p className="text-sm font-semibold">Benchline Pro</p>
        <p className="mt-1 text-sm text-muted">
          {lapsed ? `Your Pro subscription is ${lapsed.status.replace(/_/g, " ")}.` : "Not active."} Pro adds the Pro Library
          and new tools over time — $29/month, cancel anytime.
        </p>
        <Link href="/shop/updates" className="btn btn-secondary mt-4 !py-2 text-sm">About Benchline Pro</Link>
      </div>
    );
  }
  return (
    <div className="card border-steel/60">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">Benchline Pro</p>
        <span className="badge">{access.pastDue ? "Payment issue" : "Active"}</span>
      </div>
      {access.source === "bundle" ? (
        <p className="mt-2 text-sm text-muted">
          Included with your Core + 3 Months Pro purchase{access.until ? `, through ${fmtDate(access.until)}` : ""}. Prepaid —
          it won&apos;t auto-renew or charge you.
        </p>
      ) : (
        <>
          <p className="mt-2 text-sm text-muted">
            {access.cancelAtPeriodEnd
              ? `Canceled — access continues through ${access.until ? fmtDate(access.until) : "the end of this period"}, then stops. No further charges.`
              : `Renews monthly at $29${access.until ? `; next renewal ${fmtDate(access.until)}` : ""}.`}
            {access.pastDue ? " Your last payment failed — update your card to keep Pro." : ""}
          </p>
          {!access.cancelAtPeriodEnd ? <p className="mt-2 text-xs text-muted">{PRO_RENEWAL_DISCLOSURE}</p> : null}
          <div className="mt-4">
            <ManageBillingButton />
          </div>
        </>
      )}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- file download from an API route */}
      <a className="btn btn-primary mt-4 !py-2 text-sm" href="/api/downloads/pro-library">
        Download the Pro Library
      </a>
    </div>
  );
}

export default async function AccountPage() {
  const configured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) && Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!configured) {
    return (
      <div className="container-page py-14">
        <h1 className="text-3xl font-semibold">Account</h1>
        <div className="card mt-6 max-w-xl">
          <p className="text-muted">Accounts aren&apos;t available right now. Please try again shortly or contact support.</p>
          <Link href="/contact" className="btn btn-primary mt-4">Contact support</Link>
        </div>
      </div>
    );
  }

  let user: { id: string; email?: string | null } | null = null;
  let orders: OrderRow[] = [];
  let pro: ProAccess = { active: false, lapsedSubscription: null };

  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;

    if (user) {
      const byId = new Map<string, OrderRow>();
      if (hasSupabaseAdmin()) {
        // Include orders placed with this email before the account existed.
        const admin = createAdminClient();
        const queries = [admin.from("orders").select(ORDER_SELECT).eq("user_id", user.id)];
        if (user.email) queries.push(admin.from("orders").select(ORDER_SELECT).eq("email", user.email));
        for (const { data: rows } of await Promise.all(queries)) {
          for (const r of (rows as OrderRow[] | null) ?? []) byId.set(r.id, r);
        }
      } else {
        const { data: rows } = await supabase.from("orders").select(ORDER_SELECT).eq("user_id", user.id);
        for (const r of (rows as OrderRow[] | null) ?? []) byId.set(r.id, r);
      }
      orders = [...byId.values()].sort((a, b) => b.created_at.localeCompare(a.created_at));
      pro = await loadProAccess(supabase, { id: user.id, email: user.email });
    }
  } catch {
    // Misconfigured env at runtime
  }

  if (!user) {
    return (
      <div className="container-page py-14">
        <h1 className="text-3xl font-semibold">Account</h1>
        <p className="mt-3 text-muted">
          Sign in with the email you used at checkout to see your downloads and Pro status.
        </p>
        <Link href="/account/login" className="btn btn-primary mt-6">Sign in</Link>
      </div>
    );
  }

  // One download button per kit, from the most recent paid order that unlocks it.
  const downloads = new Map<string, string>();
  for (const order of orders) {
    if (!PAID_STATUSES.has(order.status)) continue;
    for (const item of order.order_items ?? []) {
      for (const key of itemDownloadKeys(item)) {
        if (KITS[key] && !downloads.has(key)) downloads.set(key, order.id);
      }
    }
  }

  return (
    <div className="container-page py-12 sm:py-14">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Your account</h1>
          <p className="mt-2 text-sm text-muted">{user.email}</p>
        </div>
        <Link href="/account/login" className="text-sm text-steel hover:underline">Switch account</Link>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <h2 className="text-xl font-semibold">Your downloads</h2>
          {downloads.size === 0 ? (
            <div className="card mt-4">
              <p className="text-muted">
                No downloads yet. If you just paid, give it a minute and refresh — downloads unlock when Stripe confirms payment.
              </p>
              <Link href="/#pricing" className="btn btn-secondary mt-4">See pricing</Link>
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {[...downloads.entries()].map(([key, orderId]) => (
                <li key={key} className="card flex flex-col gap-3 !py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{KITS[key].name}</p>
                    <p className="text-xs text-muted">{KITS[key].files.length} files · ZIP · start with 00-START-HERE.md</p>
                  </div>
                  <a className="btn btn-primary !py-2 text-sm" href={`/api/downloads/${key}?orderId=${orderId}`}>
                    Download
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
        <aside>
          <h2 className="text-xl font-semibold">Membership</h2>
          <div className="mt-4">
            <ProCard access={pro} />
          </div>
        </aside>
      </div>

      <h2 className="mt-12 text-xl font-semibold">Order history</h2>
      {orders.length === 0 ? (
        <p className="mt-3 text-sm text-muted">No orders yet.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {orders.map((order) => (
            <li key={order.id} className="card !py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{formatPrice(order.total_cents)}</p>
                  <p className="text-xs text-muted">
                    {new Date(order.created_at).toLocaleString("en-US", { timeZone: "America/New_York" })} ET
                  </p>
                </div>
                <span className="badge">{order.status}</span>
              </div>
              <ul className="mt-2 text-sm text-muted">
                {(order.order_items || []).map((item, idx) => (
                  <li key={`${order.id}-${idx}`}>{item.product_name}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-8 text-xs text-muted">
        Need help? <Link href="/contact" className="underline">Contact support</Link> ·{" "}
        <Link href="/refunds" className="underline">Refund policy</Link> ·{" "}
        <Link href="/terms#subscriptions" className="underline">Renewal &amp; cancellation</Link>
      </p>
    </div>
  );
}
