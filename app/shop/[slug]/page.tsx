import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/AddToCartButton";
import { BuyNowButton } from "@/components/BuyNowButton";
import { LegalLinks } from "@/components/LegalLinks";
import { WhatsInside } from "@/components/WhatsInside";
import { KITS } from "@/lib/kits";
import {
  BUNDLE_PRO_DISCLOSURE,
  CATEGORY_LABELS,
  PRO_RENEWAL_DISCLOSURE,
  PRODUCTS,
  formatPrice,
  getProductBySlug,
} from "@/lib/products";
import { getTradeById } from "@/lib/trades";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return { title: "Product" };
  return {
    title: product.name,
    description: product.description,
    alternates: { canonical: `/shop/${product.slug}` },
    openGraph: { title: `${product.name} · Benchline`, description: product.description, url: `/shop/${product.slug}` },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const upsells = (product.recommendedUpsells || [])
    .map((id) => PRODUCTS.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));
  const trade = product.trade ? getTradeById(product.trade) : undefined;
  const recurring = product.billing === "recurring";
  const priceLabel = `${formatPrice(product.priceCents)}${recurring ? "/mo" : ""}`;

  return (
    <div className="container-page py-12 sm:py-14">
      <nav className="mb-6 text-sm text-muted" aria-label="Breadcrumb">
        <Link href="/shop" className="hover:text-amber">Shop</Link> <span aria-hidden>/</span>{" "}
        <span>{CATEGORY_LABELS[product.category]}</span>
      </nav>
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
        <div>
          {product.badge ? <span className="badge">{product.badge}</span> : null}
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">{product.name}</h1>
          <p className="mt-3 text-lg text-muted">{product.tagline}</p>
          <p className="mt-6 text-3xl font-semibold">
            {formatPrice(product.priceCents)}
            {recurring ? <span className="text-base font-normal text-muted"> / month</span> : <span className="ml-2 text-base font-normal text-muted">one-time</span>}
            {product.compareAtCents ? (
              <span className="ml-3 text-base font-normal text-muted">
                <span className="line-through">{formatPrice(product.compareAtCents)}</span> value · save{" "}
                {formatPrice(product.compareAtCents - product.priceCents)}
              </span>
            ) : null}
          </p>
          <div className="mt-8 max-w-md space-y-3">
            <BuyNowButton productId={product.id} valueCents={product.priceCents} label={recurring ? `Start Pro — ${priceLabel}` : `Buy now — ${priceLabel}`} />
            <AddToCartButton productId={product.id} className="btn btn-secondary w-full" />
            {recurring ? <p className="text-xs text-muted">{PRO_RENEWAL_DISCLOSURE}</p> : null}
            {product.proMonths ? <p className="text-xs text-muted">{BUNDLE_PRO_DISCLOSURE}</p> : null}
            <LegalLinks />
          </div>
          <div className="card mt-8">
            <h2 className="font-semibold">Included</h2>
            <ul className="mt-4 space-y-2">
              {product.features.map((f) => (
                <li key={f} className="flex gap-2 text-sm text-foreground/90">
                  <span className="text-amber" aria-hidden>✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            {product.includes.length > 0 ? (
              <ul className="mt-4 space-y-1 border-t border-border pt-4 text-sm text-muted">
                {product.includes.map((f) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>

        <div className="space-y-8">
          <div className="prose-bl">
            {product.longDescription.split("\n\n").map((para) => (
              <p key={para.slice(0, 40)}>{para}</p>
            ))}
          </div>
          {product.downloadKeys.length > 0 ? <WhatsInside downloadKeys={product.downloadKeys} /> : null}
          {recurring ? <WhatsInside downloadKeys={["pro-library"]} /> : null}
          {product.proMonths && KITS["pro-library"] ? (
            <p className="text-sm text-muted">
              Plus Pro Library access for {product.proMonths} months — see{" "}
              <Link href="/shop/updates" className="text-amber underline">Benchline Pro</Link>.
            </p>
          ) : null}
          {trade ? (
            <p className="text-sm text-muted">
              More for {trade.operators}:{" "}
              <Link href={`/for/${trade.landingSlug}`} className="text-amber underline">
                Benchline for {trade.name}
              </Link>
            </p>
          ) : null}
        </div>
      </div>

      {upsells.length > 0 ? (
        <section className="mt-16 border-t border-border pt-12">
          <h2 className="text-xl font-semibold">Goes well with this</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {upsells.map((u) => (
              <div key={u.id} className="card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{u.name}</p>
                  <p className="text-sm text-muted">
                    {formatPrice(u.priceCents)}
                    {u.billing === "recurring" ? "/mo" : ""} — {u.tagline}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <AddToCartButton productId={u.id} label="Add" className="btn btn-ghost !py-2 !px-4 text-sm" />
                  <Link href={`/shop/${u.slug}`} className="btn btn-secondary !py-2 !px-4 text-sm">
                    Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
