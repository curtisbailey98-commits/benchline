import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/products";
import { hasSupabaseAdmin } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Account" };

type OrderRow = {
  id: string;
  status: string;
  total_cents: number;
  created_at: string;
  order_items?: Array<{
    product_name: string;
    download_key: string | null;
    quantity: number;
  }>;
};

export default async function AccountPage() {
  const configured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!configured) {
    return (
      <div className="container-page py-14">
        <h1 className="text-3xl font-semibold">Account</h1>
        <div className="card mt-6 max-w-xl">
          <p className="text-muted">
            Supabase is not configured yet. Set{" "}
            <code className="text-amber">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code className="text-amber">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, then
            run <code className="text-amber">supabase/schema.sql</code>.
          </p>
          <Link href="/account/login" className="btn btn-primary mt-4">
            Login page
          </Link>
        </div>
      </div>
    );
  }

  let user = null;
  let orders: OrderRow[] = [];

  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;

    if (user) {
      const { data: orderData } = await supabase
        .from("orders")
        .select("id, status, total_cents, created_at, order_items(product_name, download_key, quantity)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      orders = (orderData as OrderRow[] | null) ?? [];
    }
  } catch {
    // Misconfigured env at runtime
  }

  if (!user) {
    return (
      <div className="container-page py-14">
        <h1 className="text-3xl font-semibold">Account</h1>
        <p className="mt-3 text-muted">Sign in to view order history and downloads.</p>
        <Link href="/account/login" className="btn btn-primary mt-6">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-14">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Your account</h1>
          <p className="mt-2 text-sm text-muted">{user.email}</p>
        </div>
        <Link href="/account/login" className="text-sm text-amber hover:underline">
          Switch account
        </Link>
      </div>

      <h2 className="mt-10 text-xl font-semibold">Orders</h2>
      {orders.length === 0 ? (
        <div className="card mt-4 max-w-xl">
          <p className="text-muted">No orders yet.</p>
          <Link href="/shop" className="btn btn-secondary mt-4">
            Browse shop
          </Link>
          {!hasSupabaseAdmin() ? (
            <p className="mt-3 text-xs text-muted">
              Tip: after purchase, the Stripe webhook links orders to your user by email.
            </p>
          ) : null}
        </div>
      ) : (
        <ul className="mt-4 space-y-4">
          {orders.map((order) => (
            <li key={order.id} className="card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{formatPrice(order.total_cents)}</p>
                  <p className="text-xs text-muted">
                    {new Date(order.created_at).toLocaleString("en-US", {
                      timeZone: "America/New_York",
                    })}{" "}
                    ET · {order.status}
                  </p>
                </div>
                <span className="badge">{order.status}</span>
              </div>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                {(order.order_items || []).map((item, idx) => (
                  <li key={`${order.id}-${idx}`} className="flex flex-wrap items-center justify-between gap-2">
                    <span>
                      {item.product_name} × {item.quantity}
                    </span>
                    {order.status === "paid" || order.status === "fulfilled"
                      ? item.download_key && (
                          <a
                            className="text-amber hover:underline"
                            href={`/api/downloads/${item.download_key}?orderId=${order.id}`}
                          >
                            Download
                          </a>
                        )
                      : null}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
