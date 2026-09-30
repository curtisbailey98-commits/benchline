import type { Metadata } from "next";

export const metadata: Metadata = { title: "Digital delivery" };

export default function ShippingPage() {
  return (
    <div className="container-page prose-bl py-14">
      <h1 className="text-3xl font-semibold text-foreground">Digital delivery terms</h1>
      <p className="mt-2 text-sm text-muted">Last updated: September 30, 2026</p>
      <p className="mt-6">
        Benchline does not ship physical goods. All products are delivered digitally.
      </p>
      <h2>Kits, add-on packs, and bundles</h2>
      <ul>
        <li>After Stripe confirms your payment, your order is marked paid automatically.</li>
        <li>Sign in to your account with the email you used at checkout; your ZIP downloads are listed under &quot;Your downloads&quot;.</li>
        <li>Download links only work for the signed-in account that bought the product.</li>
      </ul>
      <h2>Benchline Pro</h2>
      <ul>
        <li>While Pro is active (subscription or bundle months), the Pro Library download appears on your account page.</li>
        <li>We email members when new Pro tools are added.</li>
        <li>Pro Library access ends when your membership or bundle months end.</li>
      </ul>
      <h2>Access issues</h2>
      <p>
        If payment succeeded but downloads are missing, wait a minute for webhook processing, then refresh
        your account. Still stuck? Contact support with your receipt email.
      </p>
    </div>
  );
}
