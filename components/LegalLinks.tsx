import Link from "next/link";

/** Compact legal/support links shown next to pricing, cart, and checkout. */
export function LegalLinks({ className = "" }: { className?: string }) {
  return (
    <p className={`text-xs leading-relaxed text-muted ${className}`}>
      Secure checkout by Stripe. Sold by Kaivaryn LLC.{" "}
      <Link href="/terms" className="underline hover:text-steel">Terms</Link> ·{" "}
      <Link href="/refunds" className="underline hover:text-steel">Refunds</Link> ·{" "}
      <Link href="/privacy" className="underline hover:text-steel">Privacy</Link> ·{" "}
      <Link href="/terms#subscriptions" className="underline hover:text-steel">Renewal &amp; cancellation</Link> ·{" "}
      <Link href="/contact" className="underline hover:text-steel">Support</Link>
    </p>
  );
}
