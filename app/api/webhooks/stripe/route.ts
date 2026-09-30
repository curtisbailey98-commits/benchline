import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { decodeLinesMetadata, isBenchlineSession } from "@/lib/checkout";
import { recordAnalyticsEvent } from "@/lib/analytics-server";
import { buildOrderItems, bundleProAccessUntil } from "@/lib/entitlements";
import { getProductById, PRODUCTS } from "@/lib/products";
import { getStripe } from "@/lib/stripe";
import { getEnvPriceOverride } from "@/lib/stripe-prices";
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

/**
 * Benchline shares a Stripe account with other Kaivaryn LLC products, so the
 * webhook endpoint may receive events that aren't ours. Only act on sessions
 * created by Benchline's checkout route and on subscriptions to a Benchline price.
 */
function isBenchlineSubscription(sub: Stripe.Subscription): boolean {
  if (sub.metadata?.source === "benchline") return true;
  return (sub.items?.data ?? []).some((item) =>
    PRODUCTS.some(
      (p) =>
        (item.price?.lookup_key && p.stripeLookupKey === item.price.lookup_key) ||
        (item.price?.id && getEnvPriceOverride(p) === item.price.id)
    )
  );
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (!isBenchlineSession(session)) {
    console.info(`Ignoring non-Benchline checkout session ${session.id}`);
    return;
  }
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
  const lines = decodeLinesMetadata(session.metadata as Record<string, string> | null);
  // Delayed payment methods complete the session before funds arrive; don't unlock downloads yet.
  const isPaid = session.payment_status !== "unpaid";
  const paidAt = new Date((session.created ?? Math.floor(Date.now() / 1000)) * 1000);
  // Core + 3 Months Pro: prepaid Pro access for 3 months from purchase, no auto-renew.
  const proUntil = isPaid ? bundleProAccessUntil(lines, paidAt) : null;

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
        status: isPaid ? "paid" : "pending",
        total_cents: totalCents,
        currency: session.currency || "usd",
        paid_at: isPaid ? new Date().toISOString() : null,
        metadata: { mode: session.mode },
        ...(proUntil ? { pro_access_until: proUntil.toISOString() } : {}),
      },
      { onConflict: "stripe_checkout_session_id" }
    )
    .select("id")
    .single();

  if (orderError) throw orderError;

  await admin.from("order_items").delete().eq("order_id", order.id);

  const priceIds = await resolvePaidPriceIds(session, lines.map((l) => l.productId));
  const items = buildOrderItems(order.id, lines, priceIds);

  if (items.length > 0) {
    const { error: itemsError } = await admin.from("order_items").insert(items);
    if (itemsError) throw itemsError;
  }

  // Pro subscription checkout: mirror the subscription immediately (the
  // customer.subscription.* events will keep it current afterwards).
  const subscriptionId =
    typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
  if (subscriptionId) {
    try {
      const sub = await getStripe().subscriptions.retrieve(subscriptionId);
      await upsertSubscription(sub, { email, customerId: customer.id, userId: customer.user_id });
    } catch (err) {
      console.warn("Could not sync subscription after checkout", err);
    }
  }

  if (isPaid) {
    for (const line of lines) {
      await recordAnalyticsEvent({
        event: "purchase",
        path: null,
        product_id: getProductById(line.productId)?.id ?? null,
        anon_id: null,
        referrer_host: null,
        value_cents: getProductById(line.productId)?.priceCents ?? null,
      });
    }
  }
}

function subscriptionPeriodEnd(sub: Stripe.Subscription): string | null {
  // Newer Stripe API versions expose the period on each subscription item.
  const ends = sub.items?.data?.map((i) => i.current_period_end).filter((n): n is number => typeof n === "number") ?? [];
  const legacy = (sub as unknown as { current_period_end?: number }).current_period_end;
  const end = ends.length > 0 ? Math.max(...ends) : legacy;
  return typeof end === "number" ? new Date(end * 1000).toISOString() : null;
}

function productIdForSubscription(sub: Stripe.Subscription): string | null {
  for (const item of sub.items?.data ?? []) {
    const key = item.price?.lookup_key;
    const envMatch = [...PRODUCTS].find(
      (p) => p.billing === "recurring" && (p.stripeLookupKey === key || getEnvPriceOverride(p) === item.price?.id)
    );
    if (envMatch) return envMatch.id;
  }
  // Only one recurring product exists today.
  return PRODUCTS.find((p) => p.billing === "recurring")?.id ?? null;
}

async function upsertSubscription(
  sub: Stripe.Subscription,
  known?: { email: string; customerId: string | null; userId: string | null }
) {
  if (!hasSupabaseAdmin()) return;
  if (!isBenchlineSubscription(sub)) {
    console.info(`Ignoring non-Benchline subscription ${sub.id}`);
    return;
  }
  const admin = createAdminClient();
  const stripeCustomerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? null;

  let owner = known ?? null;
  if (!owner && stripeCustomerId) {
    const { data } = await admin
      .from("customers")
      .select("id, user_id, email")
      .eq("stripe_customer_id", stripeCustomerId)
      .maybeSingle();
    if (data) owner = { email: data.email, customerId: data.id, userId: data.user_id };
  }
  if (!owner && stripeCustomerId) {
    try {
      const c = await getStripe().customers.retrieve(stripeCustomerId);
      if (!("deleted" in c && c.deleted) && c.email) {
        const created = await upsertCustomer(c.email, stripeCustomerId);
        owner = { email: c.email, customerId: created.id, userId: created.user_id };
      }
    } catch (err) {
      console.warn("Could not resolve subscription customer", err);
    }
  }
  if (!owner) {
    console.warn(`Subscription ${sub.id}: no customer email found; skipping`);
    return;
  }

  const { error } = await admin.from("subscriptions").upsert(
    {
      id: sub.id,
      customer_id: owner.customerId,
      user_id: owner.userId,
      email: owner.email,
      stripe_customer_id: stripeCustomerId,
      product_id: productIdForSubscription(sub),
      status: sub.status,
      current_period_end: subscriptionPeriodEnd(sub),
      cancel_at_period_end: Boolean(sub.cancel_at_period_end),
      canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );
  if (error) throw error;
}

function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const fromParent = invoice.parent?.subscription_details?.subscription;
  const legacy = (invoice as unknown as { subscription?: string | { id: string } | null }).subscription;
  const v = fromParent ?? legacy ?? null;
  if (!v) return null;
  return typeof v === "string" ? v : v.id;
}

/** Full refund → order marked refunded, which revokes downloads and bundle Pro access. */
async function handleChargeRefunded(charge: Stripe.Charge) {
  if (!hasSupabaseAdmin()) return;
  if (!charge.refunded) {
    console.info(`Partial refund on ${charge.id}; access left unchanged`);
    return;
  }
  const paymentIntent =
    typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
  if (!paymentIntent) return;
  const { error } = await createAdminClient()
    .from("orders")
    .update({ status: "refunded" })
    .eq("stripe_payment_intent_id", paymentIntent);
  if (error) throw error;
}

/**
 * Best-effort: record which Stripe price was actually charged per product.
 * Matches session line items by lookup_key, falling back to env overrides.
 */
async function resolvePaidPriceIds(
  session: Stripe.Checkout.Session,
  productIds: string[]
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const products = productIds.map((id) => getProductById(id)).filter((p) => p !== undefined);
  try {
    const lineItems = await getStripe().checkout.sessions.listLineItems(session.id, { limit: 100 });
    const byLookup = new Map<string, string>();
    const seen = new Set<string>();
    for (const li of lineItems.data) {
      if (!li.price) continue;
      seen.add(li.price.id);
      if (li.price.lookup_key) byLookup.set(li.price.lookup_key, li.price.id);
    }
    for (const p of products) {
      const fromLookup = byLookup.get(p.stripeLookupKey);
      const fromEnv = getEnvPriceOverride(p);
      if (fromLookup) out.set(p.id, fromLookup);
      else if (fromEnv && seen.has(fromEnv)) out.set(p.id, fromEnv);
    }
  } catch (err) {
    console.warn("Could not list checkout line items", err);
  }
  return out;
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
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await upsertSubscription(event.data.object as Stripe.Subscription);
        break;
      case "invoice.paid":
      case "invoice.payment_failed": {
        // Re-read the subscription so status (active / past_due) and period end stay current.
        const subId = invoiceSubscriptionId(event.data.object as Stripe.Invoice);
        if (subId) await upsertSubscription(await stripe.subscriptions.retrieve(subId));
        break;
      }
      case "charge.refunded":
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;
      default:
        break;
    }
    await markProcessed(event.id, event.type, event.data.object);
  } catch (err) {
    console.error("Webhook handler error", err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
