"use client";

import Link from "next/link";
import { AbandonedCartCapture } from "@/components/AbandonedCartCapture";
import { AddToCartButton } from "@/components/AddToCartButton";
import { CheckoutButton } from "@/components/CheckoutButton";
import { useCart } from "@/components/CartProvider";
import { LegalLinks } from "@/components/LegalLinks";
import { getCartCrossSells, getCartSuggestions } from "@/lib/cart-suggestions";
import { calculateCartTotals } from "@/lib/pricing";
import { BUNDLE_PRO_DISCLOSURE, PRO_RENEWAL_DISCLOSURE, formatPrice } from "@/lib/products";

export default function CartPage() {
  const { lines, removeItem, addItem, clear, subtotalCents } = useCart();
  const totals = calculateCartTotals(lines);
  const ids = totals.lines.map((l) => l.product.id);
  const suggestions = getCartSuggestions(ids);
  const crossSells = getCartCrossSells(ids);
  const hasRecurring = totals.lines.some((l) => l.product.billing === "recurring");
  const hasPrepaidPro = totals.lines.some((l) => (l.product.proMonths ?? 0) > 0);

  return (
    <div className="container-page py-12 sm:py-14">
      <h1 className="text-3xl font-semibold tracking-tight">Cart</h1>

      {totals.lines.length === 0 ? (
        <div className="card mt-8 max-w-lg">
          <p className="text-muted">Your cart is empty.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/#pricing" className="btn btn-primary">See pricing</Link>
            <Link href="/shop" className="btn btn-secondary">Browse shop</Link>
          </div>
        </div>
      ) : (
        <div className="mt-8 grid gap-10 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {suggestions.map((s) =>
              s.kind === "swap-to-bundle" ? (
                <div key={`swap-${s.bundle.id}`} className="card border-steel/60">
                  <p className="font-medium">Save {formatPrice(s.savingsCents)} with {s.bundle.name}</p>
                  <p className="mt-1 text-sm text-muted">
                    You have {s.replaces.map((p) => p.name).join(" and ")} in your cart. The bundle is the same files for less.
                  </p>
                  <button
                    type="button"
                    className="btn btn-ghost mt-3 !py-2 text-sm"
                    onClick={() => {
                      s.replaces.forEach((p) => removeItem(p.id));
                      addItem(s.bundle.id);
                    }}
                  >
                    Switch to the bundle — {formatPrice(s.bundle.priceCents)}
                  </button>
                </div>
              ) : (
                <div key={`dup-${s.product.id}`} className="card border-steel/40">
                  <p className="text-sm">
                    <span className="font-medium">{s.coveredBy.name}</span> already includes{" "}
                    {s.product.billing === "recurring" ? "3 prepaid months of Benchline Pro" : s.product.name}.
                  </p>
                  <button type="button" className="mt-2 text-sm text-steel underline" onClick={() => removeItem(s.product.id)}>
                    Remove {s.product.name}
                  </button>
                </div>
              )
            )}

            {totals.lines.map(({ product, lineTotalCents }) => (
              <div key={product.id} className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Link href={`/shop/${product.slug}`} className="font-medium hover:text-steel">
                    {product.name}
                  </Link>
                  <p className="text-sm text-muted">
                    {product.billing === "recurring" ? "Monthly membership · renews until canceled" : "One-time purchase · instant download"}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <span className="font-medium">
                    {formatPrice(lineTotalCents)}
                    {product.billing === "recurring" ? "/mo" : ""}
                  </span>
                  <button type="button" className="text-sm text-muted hover:text-danger" onClick={() => removeItem(product.id)}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
            <button type="button" className="text-sm text-muted hover:text-foreground" onClick={clear}>
              Clear cart
            </button>

            {crossSells.length > 0 ? (
              <div className="pt-6">
                <h2 className="text-lg font-semibold">You might also want</h2>
                <div className="mt-4 space-y-3">
                  {crossSells.map((p) => (
                    <div key={p.id} className="card flex flex-col gap-3 !py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <Link href={`/shop/${p.slug}`} className="font-medium hover:text-steel">{p.name}</Link>
                        <p className="text-sm text-muted">
                          {formatPrice(p.priceCents)}
                          {p.billing === "recurring" ? "/mo" : ""} — {p.tagline}
                        </p>
                      </div>
                      <AddToCartButton productId={p.id} label="Add" className="btn btn-ghost shrink-0 !py-2 !px-4 text-sm" />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <aside>
            <div className="card sticky top-20 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted">{hasRecurring ? "Due today" : "Subtotal"}</span>
                <span className="font-semibold">{formatPrice(subtotalCents)}</span>
              </div>
              <p className="text-xs text-muted">
                Taxes, if any, are calculated by Stripe. Digital delivery — see{" "}
                <Link href="/shipping" className="underline">Digital delivery</Link>.
              </p>
              {hasRecurring ? <p className="text-xs text-muted">{PRO_RENEWAL_DISCLOSURE}</p> : null}
              {hasPrepaidPro ? <p className="text-xs text-muted">{BUNDLE_PRO_DISCLOSURE}</p> : null}
              <CheckoutButton />
              <LegalLinks />
              <AbandonedCartCapture />
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
