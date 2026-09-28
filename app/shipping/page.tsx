import type { Metadata } from "next";

export const metadata: Metadata = { title: "Digital delivery" };

export default function ShippingPage() {
  return (
    <div className="container-page prose-bl py-14">
      <h1 className="text-3xl font-semibold text-foreground">Digital delivery terms</h1>
      <p className="mt-2 text-sm text-muted">Last updated: September 27, 2026</p>
      <p className="mt-6">
        Benchline does not ship physical goods. All products are delivered digitally.
      </p>
      <h2>Core Kit</h2>
      <ul>
        <li>After Stripe confirms <code>checkout.session.completed</code>, the order is marked paid.</li>
        <li>Download links appear in your account and are auth-gated (and/or signed).</li>
        <li>Files are also mirrored under the product content directory for our fulfillment pipeline.</li>
      </ul>
      <h2>Updates membership</h2>
      <ul>
        <li>Monthly playbooks are delivered by email and/or member area access while the subscription is active.</li>
        <li>Archive access ends when the subscription ends, except where we state otherwise.</li>
      </ul>
      <h2>Access issues</h2>
      <p>
        If payment succeeded but downloads are missing, wait a minute for webhook processing, then refresh
        your account. Still stuck? Contact support with your receipt email.
      </p>
    </div>
  );
}
