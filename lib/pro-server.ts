import type { SupabaseClient } from "@supabase/supabase-js";
import { computeProAccess, type ProAccess, type ProOrderRow, type SubscriptionRow } from "./pro-access";
import { createAdminClient, hasSupabaseAdmin } from "./supabase/admin";

type User = { id: string; email?: string | null };

async function byOwner<T>(
  client: SupabaseClient,
  table: string,
  columns: string,
  user: User
): Promise<T[]> {
  const rows = new Map<string, T>();
  const run = async (col: string, val: string) => {
    const { data } = await client.from(table).select(columns).eq(col, val);
    for (const r of (data as unknown as Array<T & { id: string }>) ?? []) rows.set(String(r.id), r);
  };
  await run("user_id", user.id);
  if (user.email) {
    await run("email", user.email);
    if (user.email.toLowerCase() !== user.email) await run("email", user.email.toLowerCase());
  }
  return [...rows.values()];
}

/**
 * Loads the signed-in user's Pro access (subscription or bundle months).
 * Uses the service role when available (orders linked by email before the user
 * signed up); otherwise the user's RLS-scoped client.
 */
export async function loadProAccess(userClient: SupabaseClient, user: User): Promise<ProAccess> {
  const client = hasSupabaseAdmin() ? (createAdminClient() as unknown as SupabaseClient) : userClient;
  try {
    const [subs, orders] = await Promise.all([
      byOwner<SubscriptionRow>(client, "subscriptions", "id, status, current_period_end, cancel_at_period_end, updated_at", user),
      byOwner<ProOrderRow & { id: string }>(client, "orders", "id, status, pro_access_until", user),
    ]);
    subs.sort((a, b) => String((b as { updated_at?: string }).updated_at ?? "").localeCompare(String((a as { updated_at?: string }).updated_at ?? "")));
    return computeProAccess(subs, orders);
  } catch {
    return { active: false, lapsedSubscription: null };
  }
}
