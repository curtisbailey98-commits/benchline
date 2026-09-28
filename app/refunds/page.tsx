import type { Metadata } from "next";

export const metadata: Metadata = { title: "Refund policy" };

export default function RefundsPage() {
  return (
    <div className="container-page prose-bl py-14">
      <h1 className="text-3xl font-semibold text-foreground">Refund policy</h1>
      <p className="mt-2 text-sm text-muted">Last updated: September 27, 2026</p>
      <p className="mt-6">
        Benchline products are digital. Because files can be downloaded immediately, refunds are limited.
      </p>
      <h2>Core Kit (one-time)</h2>
      <ul>
        <li>If the download fails or the ZIP is corrupt, contact support — we will fix delivery or refund.</li>
        <li>Once a successful download has occurred, refunds are generally not available.</li>
        <li>If you were charged twice in error, we refund the duplicate charge.</li>
      </ul>
      <h2>Updates membership</h2>
      <ul>
        <li>Cancel anytime from Stripe customer portal / support to stop future renewals.</li>
        <li>Partial-month refunds are not standard; we may make exceptions for billing errors.</li>
      </ul>
      <h2>Bundle</h2>
      <p>
        Bundle refunds follow Core Kit download rules for the kit portion and membership rules for Updates.
      </p>
      <h2>How to request</h2>
      <p>
        Use the <a href="/contact" className="text-amber">contact form</a> with your order email and
        Stripe receipt. We typically respond within 2 business days.
      </p>
    </div>
  );
}
