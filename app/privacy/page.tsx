import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <div className="container-page prose-bl py-14">
      <h1 className="text-3xl font-semibold text-foreground">Privacy policy</h1>
      <p className="mt-2 text-sm text-muted">Last updated: September 30, 2026</p>
      <p className="mt-6">
        Benchline is operated by Kaivaryn LLC (&quot;we&quot;), which sells Benchline digital products to solo
        home-service operators. This policy explains what we collect and why.
      </p>
      <h2>What we collect</h2>
      <ul>
        <li>Account email and authentication data (via Supabase Auth)</li>
        <li>Order and payment metadata (processed by Stripe — we do not store full card numbers)</li>
        <li>Support messages you send through our contact form</li>
        <li>Optional cart-reminder email if you consent on the cart page</li>
        <li>Basic technical logs needed to operate the site</li>
        <li>
          First-party usage events (page viewed, pricing seen, checkout clicked/started, purchase) stored in our own
          database with a random per-tab id — no cookies, no names or emails, no IP addresses, and no third-party
          advertising or analytics trackers
        </li>
      </ul>
      <h2>How we use data</h2>
      <ul>
        <li>Fulfill purchases and gate downloads to the buying account</li>
        <li>Provide Benchline Pro membership access and show its status in your account</li>
        <li>Respond to support requests</li>
        <li>Send cart reminders only with explicit consent</li>
        <li>Understand, in aggregate, how visitors move from the homepage to checkout, and operate founder reporting from real order data</li>
      </ul>
      <h2>Processors</h2>
      <p>
        We use Stripe for payments and Supabase for database/auth. Each has its own privacy policy.
        Optional OpenAI API calls for the founder dashboard summarize aggregates you already store —
        never customer message content unless you later enable that separately.
      </p>
      <h2>Retention & rights</h2>
      <p>
        We retain order records as needed for accounting and fraud prevention. Contact us to request
        access or deletion where legally required. Some records may be retained when legally necessary.
      </p>
      <h2>Contact</h2>
      <p>
        Privacy questions: use the <a href="/contact" className="text-amber">contact form</a>.
      </p>
    </div>
  );
}
