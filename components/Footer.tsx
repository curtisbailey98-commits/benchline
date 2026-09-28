import Link from "next/link";
import { LogoMark } from "./Logo";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-bg-elevated">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <LogoMark />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
            The operating system for solo trades — intake, estimates, job closeout,
            reviews, and weekly money. Built for operators who are skilled at the
            work and done improvising the paperwork.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Product</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li><Link href="/shop" className="hover:text-amber">Shop</Link></li>
            <li><Link href="/shop/core-kit" className="hover:text-amber">Core Kit</Link></li>
            <li><Link href="/shop/updates" className="hover:text-amber">Updates</Link></li>
            <li><Link href="/shop/core-bundle" className="hover:text-amber">Bundle</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Company</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li><Link href="/contact" className="hover:text-amber">Contact</Link></li>
            <li><Link href="/privacy" className="hover:text-amber">Privacy</Link></li>
            <li><Link href="/refunds" className="hover:text-amber">Refunds</Link></li>
            <li><Link href="/shipping" className="hover:text-amber">Delivery</Link></li>
            <li><Link href="/account" className="hover:text-amber">Account</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-muted sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} Benchline. All rights reserved.</span>
          <span>Digital products for solo home-service operators.</span>
        </div>
      </div>
    </footer>
  );
}
