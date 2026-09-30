import { NextResponse } from "next/server";
import { recordAnalyticsEvent } from "@/lib/analytics-server";
import { checkoutDisclosure, encodeLinesMetadata, validateCheckoutPayload } from "@/lib/checkout";
import { getStripe } from "@/lib/stripe";
import { MissingStripePriceError, resolveStripePriceIds } from "@/lib/stripe-prices";

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid cart payload" }, { status: 400 });
  }

  // Validate the cart first so bad/stale product slugs get a clear 400 even before Stripe is live.
  const validated = validateCheckoutPayload(json);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: validated.status });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "Stripe is not configured (STRIPE_SECRET_KEY)." },
      { status: 503 }
    );
  }

  try {
    const stripe = getStripe();
    const priceIds = await resolveStripePriceIds(
      validated.lines.map((l) => l.product),
      stripe.prices
    );

    const line_items = validated.lines.map(({ product, quantity }) => ({
      price: priceIds.get(product.id)!,
      quantity,
    }));

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    // Subscription mode only when a recurring Updates line is present (one-time
    // prices are allowed alongside it and are charged on the first invoice).
    const hasRecurring = validated.lines.some((l) => l.product.billing === "recurring");

    const disclosure = checkoutDisclosure(validated.lines);

    const session = await stripe.checkout.sessions.create({
      mode: hasRecurring ? "subscription" : "payment",
      line_items,
      success_url: `${siteUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/cancel`,
      customer_email: validated.customerEmail,
      allow_promotion_codes: true,
      ...(disclosure ? { custom_text: { submit: { message: disclosure } } } : {}),
      ...(hasRecurring ? { subscription_data: { metadata: { source: "benchline" } } } : {}),
      metadata: {
        product_ids: validated.lines.map((l) => l.product.id).join(","),
        lines: encodeLinesMetadata(validated.lines),
        source: "benchline",
      },
    });

    for (const { product } of validated.lines) {
      await recordAnalyticsEvent({
        event: "checkout_started",
        path: null,
        product_id: product.id,
        anon_id: typeof (json as { anonId?: unknown }).anonId === "string"
          ? String((json as { anonId: string }).anonId).replace(/[^A-Za-z0-9_-]/g, "").slice(0, 64) || null
          : null,
        referrer_host: null,
        value_cents: product.priceCents,
      });
    }

    return NextResponse.json({ url: session.url, id: session.id });
  } catch (err) {
    if (err instanceof MissingStripePriceError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    console.error("Checkout error", err);
    return NextResponse.json({ error: "Checkout error" }, { status: 500 });
  }
}
