import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BuyNowButton } from "@/components/BuyNowButton";
import { LegalLinks } from "@/components/LegalLinks";
import { ProductCard } from "@/components/ProductCard";
import { WhatsInside } from "@/components/WhatsInside";
import { CORE_SYSTEMS, formatPrice, getProductById } from "@/lib/products";
import { TRADES, getTradeByLandingSlug } from "@/lib/trades";

type Props = { params: Promise<{ trade: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return TRADES.map((t) => ({ trade: t.landingSlug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { trade: slug } = await params;
  const trade = getTradeByLandingSlug(slug);
  if (!trade) return { title: "Benchline" };
  const kit = getProductById(trade.kitProductId)!;
  return {
    title: `Benchline for ${trade.name}`,
    description: `Pricing, estimates, follow-up, checklists, and paperwork for ${trade.operators}. ${kit.description}`,
    alternates: { canonical: `/for/${trade.landingSlug}` },
    openGraph: { title: `Benchline for ${trade.name}`, url: `/for/${trade.landingSlug}` },
  };
}

export default async function TradePage({ params }: Props) {
  const { trade: slug } = await params;
  const trade = getTradeByLandingSlug(slug);
  if (!trade) notFound();

  const kit = getProductById(trade.kitProductId)!;
  const bundle = getProductById(trade.bundleProductId)!;
  const core = getProductById("core-kit")!;
  const addOns = trade.recommendedAddOns.map((id) => getProductById(id)!).filter(Boolean);
  const save = (bundle.compareAtCents ?? 0) - bundle.priceCents;

  return (
    <div>
      <section className="border-b border-border">
        <div className="container-page py-12 sm:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber">Benchline for {trade.name}</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">
            The business side of {trade.name.toLowerCase()}, handled.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted">{kit.tagline} {kit.description}</p>
          <div className="mt-8 grid max-w-2xl gap-4 sm:grid-cols-2">
            <div className="card">
              <p className="text-sm font-semibold">{bundle.name}</p>
              <p className="mt-1 text-2xl font-semibold">
                {formatPrice(bundle.priceCents)}{" "}
                <span className="text-sm font-normal text-muted">
                  <span className="line-through">{formatPrice(bundle.compareAtCents ?? 0)}</span> · save {formatPrice(save)}
                </span>
              </p>
              <div className="mt-4">
                <BuyNowButton productId={bundle.id} valueCents={bundle.priceCents} label={`Get both — ${formatPrice(bundle.priceCents)}`} />
              </div>
            </div>
            <div className="card">
              <p className="text-sm font-semibold">{kit.name} only</p>
              <p className="mt-1 text-2xl font-semibold">{formatPrice(kit.priceCents)}</p>
              <p className="text-xs text-muted">Best if you already own the Core Kit.</p>
              <div className="mt-3">
                <BuyNowButton productId={kit.id} valueCents={kit.priceCents} label={`Get the kit — ${formatPrice(kit.priceCents)}`} className="btn btn-secondary w-full" />
              </div>
            </div>
          </div>
          <LegalLinks className="mt-4 max-w-2xl" />
        </div>
      </section>

      <section className="container-page grid gap-10 py-12 lg:grid-cols-2">
        <div className="prose-bl">
          <h2 className="!mt-0 text-foreground">Written for {trade.operators}</h2>
          {kit.longDescription.split("\n\n").map((p) => (
            <p key={p.slice(0, 40)}>{p}</p>
          ))}
          <h3 className="text-foreground">Built on the Core Kit</h3>
          <p>
            The {kit.name} applies Benchline&apos;s seven business systems to your trade. The Core Kit ({formatPrice(core.priceCents)}) includes:
          </p>
          <ul>
            {CORE_SYSTEMS.map((s) => (
              <li key={s.name}>
                <strong className="text-foreground">{s.name}</strong> — {s.outcome}
              </li>
            ))}
          </ul>
          <p>
            <Link href="/shop/core-kit" className="text-amber underline">See every Core Kit file</Link>
          </p>
        </div>
        <WhatsInside downloadKeys={[trade.kitProductId]} />
      </section>

      <section className="container-page pb-6">
        <h2 className="text-xl font-semibold">Popular add-ons for {trade.operators}</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {addOns.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        <p className="mt-8 text-sm text-muted">
          Other trades:{" "}
          {TRADES.filter((t) => t.id !== trade.id).map((t, i, arr) => (
            <span key={t.id}>
              <Link href={`/for/${t.landingSlug}`} className="text-amber underline">{t.name}</Link>
              {i < arr.length - 1 ? " · " : ""}
            </span>
          ))}
        </p>
      </section>
    </div>
  );
}
