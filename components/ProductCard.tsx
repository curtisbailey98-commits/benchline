import Link from "next/link";
import { CATEGORY_LABELS, formatPrice, type Product } from "@/lib/products";

export function ProductCard({ product, featured = false }: { product: Product; featured?: boolean }) {
  return (
    <article className={`card flex h-full flex-col transition hover:border-steel/60 ${featured ? "border-steel/60" : ""}`}>
      <div className="mb-2 flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{CATEGORY_LABELS[product.category]}</p>
        {product.badge ? <span className="badge shrink-0">{product.badge}</span> : null}
      </div>
      <h3 className="text-lg font-semibold leading-snug tracking-tight">
        <Link href={`/shop/${product.slug}`} className="hover:text-steel">
          {product.name}
        </Link>
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{product.tagline}</p>
      <div className="mt-auto pt-6">
        <p className="text-2xl font-semibold">
          {formatPrice(product.priceCents)}
          {product.billing === "recurring" ? <span className="text-sm font-normal text-muted"> / month</span> : null}
          {product.compareAtCents ? (
            <span className="ml-2 text-sm font-normal text-muted line-through">{formatPrice(product.compareAtCents)}</span>
          ) : null}
        </p>
        <Link href={`/shop/${product.slug}`} className="btn btn-secondary mt-4 w-full">
          View details
        </Link>
      </div>
    </article>
  );
}
