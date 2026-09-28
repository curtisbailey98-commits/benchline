"use client";

import Link from "next/link";
import { AbandonedCartCapture } from "@/components/AbandonedCartCapture";
import { CheckoutButton } from "@/components/CheckoutButton";
import { useCart } from "@/components/CartProvider";
import { calculateCartTotals } from "@/lib/pricing";
import { formatPrice } from "@/lib/products";

export default function CartPage() {
  const { lines, setQuantity, removeItem, clear, subtotalCents } = useCart();
  const totals = calculateCartTotals(lines);

  return (
    <div className="container-page py-14">
      <h1 className="text-3xl font-semibold tracking-tight">Cart</h1>

      {totals.lines.length === 0 ? (
        <div className="card mt-8 max-w-lg">
          <p className="text-muted">Your cart is empty.</p>
          <Link href="/shop" className="btn btn-primary mt-4">
            Browse shop
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-10 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {totals.lines.map(({ product, quantity, lineTotalCents }) => (
              <div key={product.id} className="card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Link href={`/shop/${product.slug}`} className="font-medium hover:text-amber">
                    {product.name}
                  </Link>
                  <p className="text-sm text-muted">
                    {formatPrice(product.priceCents)}
                    {product.billing === "recurring" ? "/mo" : ""} each
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-xs text-muted">
                    Qty
                    <input
                      type="number"
                      min={1}
                      max={10}
                      className="input ml-2 !w-20 !py-1.5"
                      value={quantity}
                      onChange={(e) => setQuantity(product.id, Number(e.target.value) || 1)}
                    />
                  </label>
                  <span className="w-20 text-right font-medium">{formatPrice(lineTotalCents)}</span>
                  <button
                    type="button"
                    className="text-sm text-muted hover:text-danger"
                    onClick={() => removeItem(product.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            <button type="button" className="text-sm text-muted hover:text-foreground" onClick={clear}>
              Clear cart
            </button>
          </div>

          <aside>
            <div className="card sticky top-24 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Subtotal</span>
                <span className="font-semibold">{formatPrice(subtotalCents)}</span>
              </div>
              <p className="text-xs text-muted">
                Taxes calculated by Stripe when applicable. Digital delivery — see Delivery policy.
              </p>
              <CheckoutButton />
              <AbandonedCartCapture />
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
