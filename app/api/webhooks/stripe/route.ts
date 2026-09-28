import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getProductById } from "@/lib/products";
import { getStripe } from "@/lib/stripe";
import { createAdminClient, hasSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

async function alreadyProcessed(eventId: string): Promise<boolean> {
  if (!hasSupabaseAdmin()) return false;
  const admin = createAdminClient();
  const { data } = await admin.from("stripe_events").select("id").eq("id", eventId).maybeSingle();
  return Boolean(data);
}

async function markProcessed(eventId: string, type: string, payload: unknown) {
  if (!hasSupabaseAdmin()) return;
  const admin = createAdminClient();
  await admin.from("stripe_events").upsert({
    id: eventId,
    type,
    payload: payload as object,
  });
}

async function upsertCustomer(email: string, stripeCustomerId?: string | null) {
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("customers")
    .select("id, user_id")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    if (stripeCustomerId) {
      await admin
        .from("customers")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("id", existing.id);
    }
    return existing;
  }

  let userId: string | null = null;
  try {
    const { data: users } = await admin.auth.admin.listUsers({ perPage: 200 });
    const match = users?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    userId = match?.id ?? null;
  } catch {
    // auth admin may be unavailable in some setups
  }

  const { data: created, error } = await admin
    .from("customers")
    .insert({
      email,
      stripe_customer_id: stripeCustomerId || null,
      user_id: userId,
    })
    .select("id, user_id")
    .single();

  if (error) throw error;
  return created;
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (!hasSupabaseAdmin()) {
    console.warn("Supabase admin not configured — skipping order persistence");
    return;
  }

  const admin = createAdminClient();
  const email =
    session.customer_details?.email ||
    session.customer_email ||
    "unknown@benchline.local";

  const customer = await upsertCustomer(
    email,
    typeof session.customer === "string" ? session.customer : session.customer?.id
  );

  const totalCents = session.amount_total ?? 0;
  const productIds = (session.metadata?.product_ids || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const { data: order, error: orderError } = await admin
    .from("orders")
    .upsert(
      {
        email,
        customer_id: customer.id,
        user_id: customer.user_id,
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id ?? null,
        status: "paid",
        total_cents: totalCents,
        currency: session.currency || "usd",
        paid_at: new Date().toISOString(),
        metadata: { mode: session.mode },
      },
      { onConflict: "stripe_checkout_session_id" }
    )
    .select("id")
    .single();

  if (orderError) throw orderError;

  await admin.from("order_items").delete().eq("order_id", order.id);

  const items = productIds.map((pid) => {
    const product = getProductById(pid);
    return {
      order_id: order.id,
      product_id: product?.id ?? pid,
      product_name: product?.name ?? pid,
      quantity: 1,
      unit_amount_cents: product?.priceCents ?? 0,
      download_key: product?.downloadKey ?? null,
      stripe_price_id: product ? process.env[product.stripePriceEnvKey] || null : null,
    };
  });

  if (items.length > 0) {
    await admin.from("order_items").insert(items);
  }
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const stripe = getStripe();
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (await alreadyProcessed(event.id)) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    if (event.type === "checkout.session.completed") {
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
    }
    await markProcessed(event.id, event.type, event.data.object);
  } catch (err) {
    console.error("Webhook handler error", err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
