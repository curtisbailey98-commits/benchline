import { getProductById, type Product } from "./products";

export type CartLine = {
  productId: string;
  quantity: number;
};

export type CartTotals = {
  subtotalCents: number;
  itemCount: number;
  lines: Array<{
    product: Product;
    quantity: number;
    lineTotalCents: number;
  }>;
};

export function calculateCartTotals(lines: CartLine[]): CartTotals {
  const resolved = lines
    .map((line) => {
      const product = getProductById(line.productId);
      if (!product || line.quantity < 1) return null;
      const quantity = Math.floor(line.quantity);
      return {
        product,
        quantity,
        lineTotalCents: product.priceCents * quantity,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const subtotalCents = resolved.reduce((sum, l) => sum + l.lineTotalCents, 0);
  const itemCount = resolved.reduce((sum, l) => sum + l.quantity, 0);

  return { subtotalCents, itemCount, lines: resolved };
}

/** Bundle saves $37 vs Core ($199) + 3× Updates ($87) = $286 */
export function bundleSavingsCents(): number {
  const core = getProductById("core-kit")!.priceCents;
  const updates = getProductById("updates")!.priceCents;
  const bundle = getProductById("core-bundle")!.priceCents;
  return core + updates * 3 - bundle;
}
