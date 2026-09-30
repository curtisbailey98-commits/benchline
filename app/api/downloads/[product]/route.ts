import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getKit } from "@/lib/kits";
import { orderGrantsDownload, type EntitlementOrder } from "@/lib/entitlements";
import { loadProAccess } from "@/lib/pro-server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, hasSupabaseAdmin } from "@/lib/supabase/admin";

type Params = { params: Promise<{ product: string }> };

export async function GET(request: Request, { params }: Params) {
  const { product } = await params;
  const kit = getKit(product);
  if (!kit) {
    return NextResponse.json({ error: "Unknown product" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId");

  const supabaseConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!supabaseConfigured) {
    return NextResponse.json(
      { error: "Auth/downloads not configured" },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  // Pro Library: unlocked by an active Benchline Pro subscription or bundle months.
  if (kit.key === PRO_LIBRARY_KEY) {
    const access = await loadProAccess(supabase, { id: user.id, email: user.email });
    if (!access.active) {
      return NextResponse.json({ error: "Benchline Pro access required" }, { status: 403 });
    }
    return sendZip(kit.zipName);
  }

  if (!orderId || !/^[0-9a-f-]{36}$/i.test(orderId)) {
    return NextResponse.json({ error: "orderId required" }, { status: 400 });
  }

  // Entitlement: order is paid, belongs to this user, and an item unlocks this kit.
  const select = "id, user_id, email, status, order_items(download_key, download_keys)";
  let order: EntitlementOrder | null = null;
  if (hasSupabaseAdmin()) {
    const { data } = await createAdminClient()
      .from("orders")
      .select(select)
      .eq("id", orderId)
      .maybeSingle();
    order = (data as EntitlementOrder | null) ?? null;
  } else {
    // RLS limits this to the signed-in user's own orders.
    const { data } = await supabase
      .from("orders")
      .select(select)
      .eq("id", orderId)
      .eq("user_id", user.id)
      .maybeSingle();
    order = (data as EntitlementOrder | null) ?? null;
  }

  if (!orderGrantsDownload(order, { id: user.id, email: user.email }, kit.key)) {
    return NextResponse.json({ error: "Not entitled to this download" }, { status: 403 });
  }

  return sendZip(kit.zipName);
}

const PRO_LIBRARY_KEY = "pro-library";

function sendZip(zipName: string) {
  // Paid files live outside public/ so they are never statically served.
  const zipPath = path.join(process.cwd(), "private", "downloads", zipName);
  if (!fs.existsSync(zipPath)) {
    return NextResponse.json({ error: "File missing — run npm run pack:kits" }, { status: 404 });
  }

  const buf = fs.readFileSync(zipPath);
  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${zipName}"`,
      "Cache-Control": "no-store",
    },
  });
}
