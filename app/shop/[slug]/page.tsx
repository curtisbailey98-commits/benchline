import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/AddToCartButton";
import { formatPrice, getProductBySlug, PRODUCTS } from "@/lib/products";

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
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const upsells = (product.recommendedUpsells || [])
    .map((id) => PRODUCTS.find((p) => p.id === id))
    .filter(Boolean);

  return (
    <div className="container-page py-14">
      <div className="grid gap-12 lg:grid-cols-2">
        <div>
          {product.badge ? <span className="badge">{product.badge}</span> : null}
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            {product.name}
          </h1>
          <p className="mt-3 text-lg text-muted">{product.tagline}</p>
          <p className="mt-6 text-3xl font-semibold text-amber">
            {formatPrice(product.priceCents)}
            {product.billing === "recurring" ? (
              <span className="text-base font-normal text-muted"> / month</span>
            ) : null}
          </p>
          <div className="mt-8 max-w-md space-y-3">
            <AddToCartButton productId={product.id} />
            <Link href="/cart" className="btn btn-secondary w-full">
              View cart
            </Link>
          </div>
        </div>

        <div className="space-y-8">
          <div className="prose-bl">
            {product.longDescription.split("\n\n").map((para) => (
              <p key={para.slice(0, 24)}>{para}</p>
            ))}
          </div>
          <div className="card">
            <h2 className="font-semibold">What&apos;s included</h2>
            <ul className="mt-4 space-y-2">
              {product.features.map((f) => (
                <li key={f} className="flex gap-2 text-sm text-muted">
                  <span className="text-amber">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="card">
            <h2 className="font-semibold">Files / delivery</h2>
            <ul className="mt-4 space-y-1 text-sm text-muted">
              {product.includes.map((f) => (
                <li key={f}>• {f}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {upsells.length > 0 ? (
        <section className="mt-16 border-t border-border pt-12">
          <h2 className="text-xl font-semibold">Recommended with this</h2>
          <p className="mt-2 text-sm text-muted">
            Keep systems compounding — membership drops or the money-saving bundle.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {upsells.map((u) =>
              u ? (
                <div key={u.id} className="card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{u.name}</p>
                    <p className="text-sm text-muted">
                      {formatPrice(u.priceCents)}
                      {u.billing === "recurring" ? "/mo" : ""} — {u.tagline}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <AddToCartButton
                      productId={u.id}
                      label="Add"
                      className="btn btn-ghost !py-2 !px-4 text-sm"
                    />
                    <Link href={`/shop/${u.slug}`} className="btn btn-secondary !py-2 !px-4 text-sm">
                      Details
                    </Link>
                  </div>
                </div>
              ) : null
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
