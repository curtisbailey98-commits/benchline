import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, hasSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * Opens the Stripe Customer Portal so Benchline Pro members can update their
 * card or cancel. The Stripe account is shared with other Kaivaryn LLC products,
 * so Benchline uses its own portal configuration (STRIPE_PORTAL_CONFIGURATION_ID,
 * a non-secret bpc_… id). Without it Stripe falls back to the account default.
 */
function portalConfigurationId(): string | undefined {
  const id = process.env.STRIPE_PORTAL_CONFIGURATION_ID?.trim();
  return id && id.startsWith("bpc_") ? id : undefined;
}

export async function POST(request: Request) {
  if (!process.env.STRIPE_SECRET_KEY || !hasSupabaseAdmin()) {
    return NextResponse.json(
      { error: "Billing management isn't available yet. Please use the contact form to cancel or change your plan." },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user?.email) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const admin = createAdminClient();
  const { data: sub } = await admin
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .not("stripe_customer_id", "is", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  let customerId = sub?.stripe_customer_id as string | undefined;
  if (!customerId) {
    const { data: cust } = await admin
      .from("customers")
      .select("stripe_customer_id")
      .eq("email", user.email)
      .maybeSingle();
    customerId = (cust?.stripe_customer_id as string | null) ?? undefined;
  }
  if (!customerId) {
    return NextResponse.json({ error: "No Stripe billing record found for this account." }, { status: 404 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  try {
    const session = await getStripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: `${siteUrl}/account`,
      ...(portalConfigurationId() ? { configuration: portalConfigurationId() } : {}),
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Billing portal error", err);
    return NextResponse.json(
      { error: "Couldn't open billing management. Please use the contact form and we'll help." },
      { status: 502 }
    );
  }
}
