import { NextResponse } from "next/server";
import { z } from "zod";
import { getStripePriceId } from "@/lib/products";
import { calculateCartTotals } from "@/lib/pricing";
import { getStripe } from "@/lib/stripe";

const bodySchema = z.object({
  lines: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().int().min(1).max(20),
    })
  ),
  customerEmail: z.string().email().optional(),
});

export async function POST(request: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Stripe is not configured (STRIPE_SECRET_KEY)." },
        { status: 503 }
      );
    }

    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid cart payload" }, { status: 400 });
    }

    const totals = calculateCartTotals(parsed.data.lines);
    if (totals.lines.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const line_items = totals.lines.map(({ product, quantity }) => {
      const priceId = getStripePriceId(product);
      if (!priceId) {
        throw new Error(
          `Missing env ${product.stripePriceEnvKey} for product ${product.id}. Create the Stripe price and set the env var.`
        );
      }
      return { price: priceId, quantity };
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const stripe = getStripe();

    // Subscription mode only when a recurring Updates line is present.
    // Bundle should be created in Stripe as a one-time price (kit + prepaid months).
    const hasRecurring = totals.lines.some((l) => l.product.billing === "recurring");

    const session = await stripe.checkout.sessions.create({
      mode: hasRecurring ? "subscription" : "payment",
      line_items,
      success_url: `${siteUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/cancel`,
      customer_email: parsed.data.customerEmail,
      allow_promotion_codes: true,
      metadata: {
        product_ids: totals.lines.map((l) => l.product.id).join(","),
        source: "benchline",
      },
    });

    return NextResponse.json({ url: session.url, id: session.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
