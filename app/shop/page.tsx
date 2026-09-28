import type { Metadata } from "next";
import { ProductCard } from "@/components/ProductCard";
import { PRODUCTS } from "@/lib/products";

export const metadata: Metadata = {
  title: "Shop",
  description: "Benchline Core Kit, Updates membership, and Core + 3 Months bundle.",
};

export default function ShopPage() {
  return (
    <div className="container-page py-14">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Shop</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Digital products for solo trades. Prices shown in USD. Delivery is instant after payment for downloadable kits.
      </p>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {PRODUCTS.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
