import type { Metadata } from "next";
import Link from "next/link";
import { LegalLinks } from "@/components/LegalLinks";
import { ProductCard } from "@/components/ProductCard";
import { PRODUCTS, getProductById } from "@/lib/products";
import { TRADES, getTradeById } from "@/lib/trades";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Benchline Core Kit, Core + 3 Months Pro, Benchline Pro, trade kits for cleaning, handyman, lawn care, pressure washing, and detailing, plus add-on packs.",
};

type Props = { searchParams: Promise<{ trade?: string }> };

function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="text-xl font-semibold">{title}</h2>
      {sub ? <p className="mt-1 text-sm text-muted">{sub}</p> : null}
      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </section>
  );
}

export default async function ShopPage({ searchParams }: Props) {
  const { trade: tradeParam } = await searchParams;
  const trade = tradeParam ? getTradeById(tradeParam) : undefined;

  const start = ["core-kit", "core-bundle", "updates"].map((id) => getProductById(id)!);
  const kits = PRODUCTS.filter((p) => p.category === "trade-kit" && (!trade || p.trade === trade.id));
  const tradeBundles = PRODUCTS.filter(
    (p) => p.category === "bundle" && p.trade && (!trade || p.trade === trade.id)
  );
  const addOns = PRODUCTS.filter((p) => p.category === "add-on");
  const recommended = new Set(trade?.recommendedAddOns ?? []);
  const sortedAddOns = [...addOns].sort((a, b) => Number(recommended.has(b.id)) - Number(recommended.has(a.id)));

  const chip = (href: string, label: string, active: boolean) => (
    <Link
      key={href}
      href={href}
      scroll={false}
      aria-current={active ? "page" : undefined}
      className={`rounded-md border px-3 py-2 text-sm ${active ? "border-steel bg-steel text-on-steel font-semibold" : "border-border text-muted hover:border-steel hover:text-foreground"}`}
    >
      {label}
    </Link>
  );

  return (
    <div className="container-page py-12 sm:py-14">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Shop</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Start with the Core Kit. Add a Trade Kit if you want pricing and paperwork written for your trade.
        All prices in USD; downloads are instant after payment.
      </p>

      <Section title="Start here" sub="The Core Kit is the foundation. Pro is optional.">
        {start.map((p) => (
          <ProductCard key={p.id} product={p} featured={p.id === "core-bundle"} />
        ))}
      </Section>

      <div className="mt-14 border-t border-border pt-10" id="trade-kits">
        <p className="text-sm font-semibold">Filter by trade</p>
        <nav className="mt-3 flex flex-wrap gap-2" aria-label="Filter by trade">
          {chip("/shop#trade-kits", "All trades", !trade)}
          {TRADES.map((t) => chip(`/shop?trade=${t.id}#trade-kits`, t.shortLabel, trade?.id === t.id))}
        </nav>
        {trade ? (
          <p className="mt-3 text-sm text-muted">
            Showing {trade.name.toLowerCase()} products.{" "}
            <Link href={`/for/${trade.landingSlug}`} className="text-steel underline">
              See the {trade.name} page
            </Link>
          </p>
        ) : null}
      </div>

      <Section title="Trade kits" sub="Trade-specific pricing calculator, service agreement, checklists, scripts, and seasonal calendar. $129 each.">
        {kits.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </Section>

      <Section title="Core + Trade Kit bundles" sub="The Core Kit and one Trade Kit together — save $49.">
        {tradeBundles.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </Section>

      <Section title="Add-on packs" sub={trade ? `Works for any trade. Recommended for ${trade.operators} listed first.` : "Works for any trade."}>
        {sortedAddOns.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </Section>

      <LegalLinks className="mt-12" />
    </div>
  );
}
