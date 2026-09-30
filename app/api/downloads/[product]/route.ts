import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { DOWNLOADABLE_PRODUCTS } from "@/lib/downloads";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, hasSupabaseAdmin } from "@/lib/supabase/admin";

type Params = { params: Promise<{ product: string }> };

export async function GET(request: Request, { params }: Params) {
  const { product } = await params;
  const meta = DOWNLOADABLE_PRODUCTS[product];
  if (!meta) {
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

  if (!orderId) {
    return NextResponse.json({ error: "orderId required" }, { status: 400 });
  }

  // Verify entitlement: order belongs to user and is paid, item has download_key
  let entitled = false;
  if (hasSupabaseAdmin()) {
    const admin = createAdminClient();
    const { data: order } = await admin
      .from("orders")
      .select("id, user_id, email, status, order_items(download_key)")
      .eq("id", orderId)
      .maybeSingle();

    if (
      order &&
      (order.status === "paid" || order.status === "fulfilled") &&
      (order.user_id === user.id ||
        order.email?.toLowerCase() === user.email?.toLowerCase())
    ) {
      const items = (order.order_items as Array<{ download_key: string | null }>) || [];
      entitled = items.some((i) => i.download_key === product);
    }
  } else {
    const { data: order } = await supabase
      .from("orders")
      .select("id, status, order_items(download_key)")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (order && (order.status === "paid" || order.status === "fulfilled")) {
      const items = (order.order_items as Array<{ download_key: string | null }>) || [];
      entitled = items.some((i) => i.download_key === product);
    }
  }

  if (!entitled) {
    return NextResponse.json({ error: "Not entitled to this download" }, { status: 403 });
  }

  // Paid files live outside public/ so they are never statically served.
  const zipPath = path.join(process.cwd(), "private", "downloads", meta.zipName);
  if (!fs.existsSync(zipPath)) {
    return NextResponse.json({ error: "File missing — run npm run pack:core-kit" }, { status: 404 });
  }

  const buf = fs.readFileSync(zipPath);
  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${meta.zipName}"`,
      "Cache-Control": "no-store",
    },
  });
}
