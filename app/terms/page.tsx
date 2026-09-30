import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Sale",
  description: "Terms for Benchline digital products and the Benchline Pro membership, sold by Kaivaryn LLC.",
};

export default function TermsPage() {
  return (
    <div className="container-page prose-bl max-w-3xl py-14">
      <h1 className="text-3xl font-semibold text-foreground">Terms of Sale</h1>
      <p className="mt-2 text-sm text-muted">Last updated: September 30, 2026</p>

      <p className="mt-6">
        Benchline products are sold by <strong className="text-foreground">Kaivaryn LLC</strong> (&quot;we&quot;, &quot;us&quot;).
        Payments are processed by Stripe on Kaivaryn LLC&apos;s account, so your card statement and receipt may show
        Kaivaryn LLC. By buying, you agree to these terms, our{" "}
        <Link href="/refunds" className="text-steel">Refund Policy</Link>, and our{" "}
        <Link href="/privacy" className="text-steel">Privacy Policy</Link>.
      </p>

      <h2 className="text-foreground">What you&apos;re buying</h2>
      <ul>
        <li>
          <strong className="text-foreground">Core Kit, Trade Kits, add-on packs, and bundles</strong> are one-time purchases of
          downloadable files (Markdown, CSV, and XLSX) delivered as ZIP downloads in your Benchline account.
        </li>
        <li>
          <strong className="text-foreground">Benchline Pro</strong> is a monthly membership that gives access to the Pro
          Library download and tools we add to it while your membership is active. What we add, and when, is up to us; we
          don&apos;t promise specific files on specific dates.
        </li>
        <li>
          <strong className="text-foreground">Core + 3 Months Pro</strong> is a one-time purchase of the Core Kit plus three
          prepaid months of Pro access starting at purchase.
        </li>
      </ul>

      <h2 className="text-foreground">Delivery and access</h2>
      <p>
        Downloads unlock in your account (sign in with the email used at checkout) once Stripe confirms payment. Please save
        your files; we aim to keep downloads available in your account, but you should keep your own copy. See{" "}
        <Link href="/shipping" className="text-steel">Digital delivery</Link>.
      </p>

      <h2 className="text-foreground">License</h2>
      <p>
        You may use, edit, and print the files for your own business (one business per purchase), including with employees
        or helpers in that business. You may not resell, share publicly, or republish the files or substantial parts of them.
      </p>

      <h2 className="text-foreground">Prices and taxes</h2>
      <p>
        Prices are in US dollars and shown before checkout. Any applicable taxes are calculated by Stripe at checkout.
      </p>

      <h2 id="subscriptions" className="scroll-mt-24 text-foreground">Benchline Pro: renewal and cancellation</h2>
      <ul>
        <li>
          <strong className="text-foreground">Automatic renewal.</strong> Benchline Pro costs $29 per month and renews
          automatically each month, charging the card on file, until you cancel.
        </li>
        <li>
          <strong className="text-foreground">How to cancel.</strong> Anytime from your account page (&quot;Manage billing /
          cancel&quot;), or by sending a request through the <Link href="/contact" className="text-steel">contact form</Link>{" "}
          from the email on your account. Cancellation stops future renewals.
        </li>
        <li>
          <strong className="text-foreground">After you cancel.</strong> You keep Pro access until the end of the month you
          already paid for. We don&apos;t charge cancellation fees. Partial months aren&apos;t refunded except for billing
          errors (see the <Link href="/refunds" className="text-steel">Refund Policy</Link>).
        </li>
        <li>
          <strong className="text-foreground">Failed payments.</strong> If a renewal payment fails, Stripe may retry it. If it
          can&apos;t be collected, the membership ends.
        </li>
        <li>
          <strong className="text-foreground">Price changes.</strong> If the Pro price changes, we&apos;ll email members before
          it applies to their next renewal; you can cancel before then.
        </li>
        <li>
          <strong className="text-foreground">Bundle Pro months.</strong> The 3 months of Pro in Core + 3 Months Pro are
          prepaid and do not auto-renew. When they end, Pro access stops unless you choose to start a subscription.
        </li>
      </ul>

      <h2 className="text-foreground">Not professional advice</h2>
      <p>
        Benchline files are practical templates and examples. They are not legal, tax, accounting, insurance, or financial
        advice. Contracts, waivers, and policies should be reviewed by a licensed attorney in your state before use; tax and
        worker-classification questions belong with your accountant. Pricing examples are starting points, not predictions of
        what you will earn.
      </p>

      <h2 className="text-foreground">Refunds</h2>
      <p>
        See the <Link href="/refunds" className="text-steel">Refund Policy</Link>.
      </p>

      <h2 className="text-foreground">Contact</h2>
      <p>
        Questions about an order or these terms: use the <Link href="/contact" className="text-steel">contact form</Link>.
      </p>
    </div>
  );
}
