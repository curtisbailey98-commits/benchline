import Link from "next/link";

/** Compact legal/support links shown next to pricing, cart, and checkout. */
export function LegalLinks({ className = "" }: { className?: string }) {
  return (
    <p className={`text-xs leading-relaxed text-muted ${className}`}>
      Secure checkout by Stripe. Sold by Kaivaryn LLC.{" "}
      <Link href="/terms" className="underline hover:text-amber">Terms</Link> ·{" "}
      <Link href="/refunds" className="underline hover:text-amber">Refunds</Link> ·{" "}
      <Link href="/privacy" className="underline hover:text-amber">Privacy</Link> ·{" "}
      <Link href="/terms#subscriptions" className="underline hover:text-amber">Renewal &amp; cancellation</Link> ·{" "}
      <Link href="/contact" className="underline hover:text-amber">Support</Link>
    </p>
  );
}
