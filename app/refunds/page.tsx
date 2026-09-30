import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Refund policy" };

export default function RefundsPage() {
  return (
    <div className="container-page prose-bl max-w-3xl py-14">
      <h1 className="text-3xl font-semibold text-foreground">Refund policy</h1>
      <p className="mt-2 text-sm text-muted">Last updated: September 30, 2026</p>
      <p className="mt-6">
        Benchline products are digital and sold by Kaivaryn LLC. Because files can be downloaded immediately, refunds are
        limited — but we always fix delivery problems and billing mistakes.
      </p>
      <h2 className="text-foreground">Kits, add-on packs, and bundles (one-time)</h2>
      <ul>
        <li>If the download fails or the ZIP is corrupt, contact support — we will fix delivery or refund.</li>
        <li>Once a successful download has occurred, refunds are generally not available.</li>
        <li>If you were charged twice in error, we refund the duplicate charge.</li>
        <li>A refunded order&apos;s downloads (and any bundle Pro months) are removed from your account.</li>
      </ul>
      <h2 className="text-foreground">Benchline Pro ($29/month)</h2>
      <ul>
        <li>Pro renews monthly until you cancel. Cancel anytime from your account (Manage billing) or via the contact form.</li>
        <li>Canceling stops future charges; you keep access through the end of the month you paid for.</li>
        <li>Partial-month refunds aren&apos;t standard; we make exceptions for billing errors.</li>
      </ul>
      <h2 className="text-foreground">Core + 3 Months Pro</h2>
      <p>
        This is a one-time purchase. Refunds follow the one-time rules above. The 3 Pro months are prepaid and never
        auto-renew, so there is nothing to cancel.
      </p>
      <h2 className="text-foreground">How to request</h2>
      <p>
        Use the <Link href="/contact" className="text-amber">contact form</Link> with your order email and Stripe receipt. We
        aim to respond within 2 business days.
      </p>
      <p className="text-sm">
        See also: <Link href="/terms" className="text-amber">Terms of Sale</Link> ·{" "}
        <Link href="/terms#subscriptions" className="text-amber">Renewal &amp; cancellation</Link>
      </p>
    </div>
  );
}
