import Link from "next/link";
import { BuyNowButton } from "./BuyNowButton";
import { LegalLinks } from "./LegalLinks";
import {
  BUNDLE_PRO_DISCLOSURE,
  CORE_BUNDLE_PRICE,
  PRO_BUNDLE_MONTHS,
  PRO_MONTHLY_CENTS,
  PRO_RENEWAL_DISCLOSURE,
  formatPrice,
  getProductById,
} from "@/lib/products";

function Check({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2 text-sm">
      <span className="text-amber" aria-hidden>✓</span>
      <span className="text-foreground/90">{children}</span>
    </li>
  );
}

/**
 * The three main offers. Trade kits and add-ons are deliberately NOT here —
 * they live in the shop, trade pages, and upsells.
 */
export function PricingCards() {
  const core = getProductById("core-kit")!;
  const bundle = getProductById("core-bundle")!;
  const pro = getProductById("updates")!;
  const proValue = PRO_MONTHLY_CENTS * PRO_BUNDLE_MONTHS;
  const totalValue = core.priceCents + proValue;
  const savings = totalValue - CORE_BUNDLE_PRICE;

  return (
    <div>
      <div className="grid gap-6 lg:grid-cols-3 lg:items-stretch">
        {/* Core */}
        <article className="card flex flex-col">
          <h3 className="text-lg font-semibold">Benchline Core</h3>
          <p className="mt-1 text-sm text-muted">All seven business systems.</p>
          <p className="mt-5 text-4xl font-semibold">
            {formatPrice(core.priceCents)}
            <span className="ml-2 text-sm font-normal text-muted">one-time</span>
          </p>
          <ul className="mt-6 space-y-2.5">
            <Check>7 business systems: pricing, estimates, follow-up, intake, checklists, reviews, money</Check>
            <Check>Pricing calculator + weekly money dashboard (XLSX with working formulas)</Check>
            <Check>Scripts, templates, and checklists (Markdown + CSV)</Check>
            <Check>Start Here guide with a day-by-day first week</Check>
            <Check>Instant download; re-download anytime from your account</Check>
          </ul>
          <div className="mt-auto pt-8">
            <BuyNowButton productId={core.id} valueCents={core.priceCents} label={`Get Benchline — ${formatPrice(core.priceCents)}`} className="btn btn-secondary w-full" />
          </div>
        </article>

        {/* Featured bundle */}
        <article className="card relative flex flex-col border-2 border-amber lg:-my-3">
          <span className="absolute -top-3 left-6 rounded bg-amber px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-[#14110b]">
            Best value
          </span>
          <h3 className="text-lg font-semibold">Core + 3 Months Pro</h3>
          <p className="mt-1 text-sm text-muted">Everything in Core, plus three months of Pro.</p>
          <p className="mt-5 text-4xl font-semibold">
            {formatPrice(bundle.priceCents)}
            <span className="ml-2 text-sm font-normal text-muted">one-time</span>
          </p>
          <table className="mt-5 w-full text-sm" aria-label="Bundle value">
            <tbody className="font-mono">
              <tr><td className="py-0.5 font-sans text-muted">Core Kit</td><td className="text-right">{formatPrice(core.priceCents)}</td></tr>
              <tr><td className="py-0.5 font-sans text-muted">3 months Pro ({formatPrice(PRO_MONTHLY_CENTS)} × {PRO_BUNDLE_MONTHS})</td><td className="text-right">{formatPrice(proValue)}</td></tr>
              <tr className="border-t border-border"><td className="py-0.5 font-sans text-muted">Total value</td><td className="text-right">{formatPrice(totalValue)}</td></tr>
              <tr><td className="py-0.5 font-sans font-semibold">You pay</td><td className="text-right font-semibold text-amber">{formatPrice(bundle.priceCents)}</td></tr>
              <tr><td className="py-0.5 font-sans font-semibold">You save</td><td className="text-right font-semibold text-amber">{formatPrice(savings)}</td></tr>
            </tbody>
          </table>
          <ul className="mt-5 space-y-2.5">
            <Check>Everything in Benchline Core</Check>
            <Check>Pro Library access for 3 months</Check>
            <Check>Prepaid — no subscription, nothing auto-renews</Check>
          </ul>
          <div className="mt-auto pt-8">
            <BuyNowButton productId={bundle.id} valueCents={bundle.priceCents} label={`Get Core + 3 Months Pro — ${formatPrice(bundle.priceCents)}`} />
            <p className="mt-3 text-xs text-muted">{BUNDLE_PRO_DISCLOSURE}</p>
          </div>
        </article>

        {/* Pro */}
        <article className="card flex flex-col">
          <h3 className="text-lg font-semibold">Benchline Pro</h3>
          <p className="mt-1 text-sm text-muted">For Benchline owners who want ongoing tools.</p>
          <p className="mt-5 text-4xl font-semibold">
            {formatPrice(pro.priceCents)}
            <span className="ml-2 text-sm font-normal text-muted">/ month</span>
          </p>
          <ul className="mt-6 space-y-2.5">
            <Check>Pro Library: seasonal pricing planner + upsell script library</Check>
            <Check>New tools added over time (see examples below)</Check>
            <Check>Updated versions of Benchline templates</Check>
            <Check>Cancel anytime from your account</Check>
          </ul>
          <p className="mt-4 text-xs text-muted">Pro doesn&apos;t include the Core Kit.</p>
          <div className="mt-auto pt-8">
            <BuyNowButton productId={pro.id} valueCents={pro.priceCents} label={`Start Pro — ${formatPrice(pro.priceCents)}/mo`} className="btn btn-secondary w-full" />
            <p className="mt-3 text-xs text-muted">{PRO_RENEWAL_DISCLOSURE}</p>
          </div>
        </article>
      </div>
      <div className="mt-8 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
        <LegalLinks />
        <Link href="/shop" className="shrink-0 text-sm font-medium text-amber hover:underline">
          Trade kits & add-ons →
        </Link>
      </div>
    </div>
  );
}
