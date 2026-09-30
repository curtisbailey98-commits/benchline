import type Stripe from "stripe";
import type { Product } from "./products";

/**
 * Stripe price resolution.
 *
 * Order of precedence for each product:
 *   1. Legacy env var (STRIPE_PRICE_CORE / _MEMBERSHIP / _BUNDLE) if the product has one
 *   2. Generic env override STRIPE_PRICE_<PRODUCT_ID_UPPER_SNAKE>, e.g. STRIPE_PRICE_CLEANING_KIT
 *   3. Stripe Price lookup_key (product.stripeLookupKey), resolved with one
 *      stripe.prices.list({ lookup_keys }) call per 10 keys.
 *
 * (3) means new products need no env vars at all — create the price in Stripe with
 * the matching lookup_key and it is picked up at checkout.
 */

export function genericPriceEnvKey(product: Pick<Product, "id">): string {
  return `STRIPE_PRICE_${product.id.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}`;
}

export function getEnvPriceOverride(
  product: Pick<Product, "id" | "stripePriceEnvKey">,
  env: Record<string, string | undefined> = process.env
): string | undefined {
  if (product.stripePriceEnvKey && env[product.stripePriceEnvKey]) {
    return env[product.stripePriceEnvKey];
  }
  return env[genericPriceEnvKey(product)] || undefined;
}

export class MissingStripePriceError extends Error {
  constructor(public readonly missing: Array<{ productId: string; lookupKey: string }>) {
    super(
      `Stripe price not configured for: ${missing
        .map((m) => `${m.productId} (lookup_key ${m.lookupKey})`)
        .join(", ")}`
    );
    this.name = "MissingStripePriceError";
  }
}

type PriceLister = Pick<Stripe["prices"], "list">;

export async function resolveStripePriceIds(
  products: Array<Pick<Product, "id" | "stripeLookupKey" | "stripePriceEnvKey">>,
  prices: PriceLister,
  env: Record<string, string | undefined> = process.env
): Promise<Map<string, string>> {
  const resolved = new Map<string, string>();
  const needLookup: typeof products = [];

  for (const product of products) {
    const override = getEnvPriceOverride(product, env);
    if (override) resolved.set(product.id, override);
    else needLookup.push(product);
  }

  const lookupKeys = [...new Set(needLookup.map((p) => p.stripeLookupKey))];
  const byLookupKey = new Map<string, string>();
  for (let i = 0; i < lookupKeys.length; i += 10) {
    const chunk = lookupKeys.slice(i, i + 10);
    const page = await prices.list({ lookup_keys: chunk, active: true, limit: 10 });
    for (const price of page.data) {
      if (price.lookup_key) byLookupKey.set(price.lookup_key, price.id);
    }
  }

  const missing: Array<{ productId: string; lookupKey: string }> = [];
  for (const product of needLookup) {
    const id = byLookupKey.get(product.stripeLookupKey);
    if (id) resolved.set(product.id, id);
    else missing.push({ productId: product.id, lookupKey: product.stripeLookupKey });
  }

  if (missing.length > 0) throw new MissingStripePriceError(missing);
  return resolved;
}
