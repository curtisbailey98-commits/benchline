import Link from "next/link";
import { TRADES } from "@/lib/trades";
import { LogoMark } from "./Logo";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-bg-elevated">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <LogoMark />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
            Pricing tools, estimate templates, follow-up systems, job checklists, review workflows, and
            money trackers for solo home-service operators.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Product</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li><Link href="/shop/core-kit" className="hover:text-steel">Core Kit</Link></li>
            <li><Link href="/shop/core-bundle" className="hover:text-steel">Core + 3 Months Pro</Link></li>
            <li><Link href="/shop/updates" className="hover:text-steel">Benchline Pro</Link></li>
            <li><Link href="/shop" className="hover:text-steel">Trade kits &amp; add-ons</Link></li>
            <li><Link href="/account" className="hover:text-steel">Account &amp; downloads</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">By trade</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            {TRADES.map((t) => (
              <li key={t.id}>
                <Link href={`/for/${t.landingSlug}`} className="hover:text-steel">{t.name}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Support &amp; legal</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li><Link href="/contact" className="hover:text-steel">Contact &amp; support</Link></li>
            <li><Link href="/terms" className="hover:text-steel">Terms of Sale</Link></li>
            <li><Link href="/privacy" className="hover:text-steel">Privacy Policy</Link></li>
            <li><Link href="/refunds" className="hover:text-steel">Refund Policy</Link></li>
            <li><Link href="/terms#subscriptions" className="hover:text-steel">Renewal &amp; cancellation</Link></li>
            <li><Link href="/shipping" className="hover:text-steel">Digital delivery</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-muted sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} Kaivaryn LLC. Benchline is sold by Kaivaryn LLC.</span>
          <span>Digital products. Prices in USD.</span>
        </div>
      </div>
    </footer>
  );
}
