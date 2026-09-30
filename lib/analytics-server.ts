import type { AnalyticsRow } from "./analytics";
import { createAdminClient, hasSupabaseAdmin } from "./supabase/admin";

/** Best-effort insert. Never throws — analytics must not break checkout or webhooks. */
export async function recordAnalyticsEvent(row: AnalyticsRow): Promise<void> {
  if (!hasSupabaseAdmin()) return;
  try {
    await createAdminClient().from("analytics_events").insert(row);
  } catch (err) {
    console.warn("analytics insert failed", err);
  }
}
