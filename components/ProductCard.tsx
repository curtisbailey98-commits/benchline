import Link from "next/link";
import { formatPrice, type Product } from "@/lib/products";

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="card flex h-full flex-col transition hover:border-amber/40">
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold tracking-tight">{product.name}</h3>
        {product.badge ? <span className="badge shrink-0">{product.badge}</span> : null}
      </div>
      <p className="text-sm leading-relaxed text-muted">{product.tagline}</p>
      <div className="mt-auto pt-6">
        <p className="text-2xl font-semibold text-amber">
          {formatPrice(product.priceCents)}
          {product.billing === "recurring" ? (
            <span className="text-sm font-normal text-muted">/mo</span>
          ) : null}
        </p>
        <Link href={`/shop/${product.slug}`} className="btn btn-secondary mt-4 w-full">
          View details
        </Link>
      </div>
    </article>
  );
}
