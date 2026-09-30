import { getProductById, PRODUCTS, type Product } from "./products";
import { TRADES } from "./trades";

export type CartSuggestion =
  | { kind: "swap-to-bundle"; bundle: Product; replaces: Product[]; savingsCents: number }
  | { kind: "redundant"; product: Product; coveredBy: Product };

/**
 * Suggestions shown in the cart:
 *  - Core Kit + a Trade Kit in the cart → suggest the matching bundle (cheaper).
 *  - An item whose downloads are fully covered by another item → flag as redundant.
 */
export function getCartSuggestions(productIds: string[]): CartSuggestion[] {
  const inCart = productIds.map((id) => getProductById(id)).filter((p): p is Product => Boolean(p));
  const ids = new Set(inCart.map((p) => p.id));
  const suggestions: CartSuggestion[] = [];

  for (const trade of TRADES) {
    if (ids.has("core-kit") && ids.has(trade.kitProductId) && !ids.has(trade.bundleProductId)) {
      const bundle = getProductById(trade.bundleProductId)!;
      const replaces = [getProductById("core-kit")!, getProductById(trade.kitProductId)!];
      const separate = replaces.reduce((s, p) => s + p.priceCents, 0);
      suggestions.push({ kind: "swap-to-bundle", bundle, replaces, savingsCents: separate - bundle.priceCents });
    }
  }

  for (const product of inCart) {
    if (product.downloadKeys.length === 0) continue;
    const coveredBy = inCart.find(
      (other) =>
        other.id !== product.id &&
        (other.downloadKeys.length > product.downloadKeys.length ||
          (other.category === "bundle" && product.category !== "bundle")) &&
        product.downloadKeys.every((k) => other.downloadKeys.includes(k))
    );
    if (coveredBy) suggestions.push({ kind: "redundant", product, coveredBy });
  }

  // Pro subscription alongside a bundle that already includes prepaid Pro months.
  const prepaid = inCart.find((p) => (p.proMonths ?? 0) > 0);
  const subscription = inCart.find((p) => p.billing === "recurring");
  if (prepaid && subscription) {
    suggestions.push({ kind: "redundant", product: subscription, coveredBy: prepaid });
  }

  return suggestions;
}

/** Cross-sells for the cart: recommended upsells of cart items that aren't already covered. */
export function getCartCrossSells(productIds: string[], limit = 3): Product[] {
  const inCart = productIds.map((id) => getProductById(id)).filter((p): p is Product => Boolean(p));
  const ownedKeys = new Set(inCart.flatMap((p) => p.downloadKeys));
  const ids = new Set(inCart.map((p) => p.id));
  const out: Product[] = [];
  for (const product of inCart) {
    for (const id of product.recommendedUpsells ?? []) {
      const candidate = PRODUCTS.find((p) => p.id === id);
      if (!candidate || ids.has(candidate.id) || out.includes(candidate)) continue;
      // Skip if everything it unlocks is already in the cart, or it's a bundle overlapping the cart.
      if (candidate.downloadKeys.length > 0 && candidate.downloadKeys.some((k) => ownedKeys.has(k))) continue;
      out.push(candidate);
      if (out.length >= limit) return out;
    }
  }
  return out;
}
