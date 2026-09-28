import { NextResponse } from "next/server";
import { isFounderEmail } from "@/lib/auth";
import { summarizeDashboard, type DashboardAggregates } from "@/lib/analyst";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, hasSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user || !isFounderEmail(data.user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const aggregates: DashboardAggregates = {
    revenueCents: 0,
    orderCount: 0,
    customerCount: 0,
    paidOrderCount: 0,
    productBreakdown: [],
    openTickets: 0,
    recentOrders: [],
  };

  if (hasSupabaseAdmin()) {
    const admin = createAdminClient();
    const { data: orders } = await admin.from("orders").select("id, email, total_cents, status, created_at");
    const all = orders ?? [];
    const paid = all.filter((o) => o.status === "paid" || o.status === "fulfilled");
    aggregates.orderCount = all.length;
    aggregates.paidOrderCount = paid.length;
    aggregates.revenueCents = paid.reduce((s, o) => s + (o.total_cents || 0), 0);
    aggregates.customerCount = new Set(all.map((o) => o.email)).size;
    const { count } = await admin
      .from("support_tickets")
      .select("*", { count: "exact", head: true })
      .eq("status", "open");
    aggregates.openTickets = count ?? 0;
  }

  const result = await summarizeDashboard(aggregates);
  return NextResponse.json(result);
}
