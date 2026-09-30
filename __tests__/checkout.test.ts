import { describe, expect, it, vi } from "vitest";
import {
  checkoutDisclosure,
  decodeLinesMetadata,
  encodeLinesMetadata,
  isBenchlineSession,
  validateCheckoutPayload,
} from "@/lib/checkout";
import { classifyCheckoutSession, isValidSessionId } from "@/lib/checkout-verify";
import { getProductById, PRODUCTS } from "@/lib/products";
import { MissingStripePriceError, resolveStripePriceIds } from "@/lib/stripe-prices";

describe("validateCheckoutPayload", () => {
  it("accepts every catalog product", () => {
    const res = validateCheckoutPayload({ lines: PRODUCTS.map((p) => ({ productId: p.id, quantity: 1 })) });
    expect(res.ok).toBe(true);
  });

  it("rejects unknown products with 400", () => {
    const res = validateCheckoutPayload({ lines: [{ productId: "all-trades-mega", quantity: 1 }] });
    expect(res).toMatchObject({ ok: false, status: 400 });
  });

  it("merges duplicates and caps quantity at 1", () => {
    const res = validateCheckoutPayload({
      lines: [
        { productId: "cleaning-kit", quantity: 3 },
        { productId: "cleaning-kit", quantity: 1 },
      ],
    });
    expect(res.ok && res.lines).toEqual([{ product: getProductById("cleaning-kit"), quantity: 1 }]);
  });
});

describe("line metadata", () => {
  it("round-trips and falls back to legacy product_ids", () => {
    const encoded = encodeLinesMetadata([{ product: { id: "core-kit" }, quantity: 1 }, { product: { id: "detailing-kit" }, quantity: 1 }]);
    expect(decodeLinesMetadata({ lines: encoded })).toEqual([
      { productId: "core-kit", quantity: 1 },
      { productId: "detailing-kit", quantity: 1 },
    ]);
    expect(decodeLinesMetadata({ product_ids: "core-kit,updates" }).map((l) => l.productId)).toEqual(["core-kit", "updates"]);
  });
});

describe("checkoutDisclosure", () => {
  it("discloses Pro renewal and bundle non-renewal; nothing for plain kits", () => {
    expect(checkoutDisclosure([{ product: getProductById("updates")! }])).toMatch(/renews automatically at \$29\/month until you cancel/);
    expect(checkoutDisclosure([{ product: getProductById("core-bundle")! }])).toMatch(/do not auto-renew/);
    expect(checkoutDisclosure([{ product: getProductById("core-kit")! }])).toBeNull();
  });
});

describe("resolveStripePriceIds", () => {
  it("uses env overrides first, then lookup keys", async () => {
    const list = vi.fn(async ({ lookup_keys }: { lookup_keys: string[] }) => ({
      data: lookup_keys.map((k) => ({ id: `price_${k}`, lookup_key: k })),
    }));
    const products = [getProductById("core-kit")!, getProductById("lawn-care-kit")!];
    const ids = await resolveStripePriceIds(products, { list } as never, { STRIPE_PRICE_CORE: "price_env_core" });
    expect(ids.get("core-kit")).toBe("price_env_core");
    expect(ids.get("lawn-care-kit")).toBe("price_benchline_kit_lawn_care");
    expect(list).toHaveBeenCalledTimes(1);
  });

  it("throws MissingStripePriceError when a lookup key has no price", async () => {
    const list = vi.fn(async () => ({ data: [] }));
    await expect(resolveStripePriceIds([getProductById("first-helper-pack")!], { list } as never, {})).rejects.toBeInstanceOf(
      MissingStripePriceError
    );
  });
});

describe("success page verification", () => {
  it("only confirms completed, paid sessions (or active subscriptions)", () => {
    expect(classifyCheckoutSession({ status: "complete", payment_status: "paid" })).toBe("confirmed");
    expect(classifyCheckoutSession({ status: "complete", payment_status: "unpaid", subscription: { status: "active" } })).toBe("confirmed");
    expect(classifyCheckoutSession({ status: "complete", payment_status: "unpaid" })).toBe("processing");
    expect(classifyCheckoutSession({ status: "open", payment_status: "unpaid" })).toBe("not_confirmed");
    expect(classifyCheckoutSession({ status: "expired", payment_status: "unpaid" })).toBe("not_confirmed");
    expect(classifyCheckoutSession(null)).toBe("not_confirmed");
  });

  it("validates session id shape before calling Stripe", () => {
    expect(isValidSessionId("cs_test_a1B2c3D4e5F6g7")).toBe(true);
    expect(isValidSessionId("{CHECKOUT_SESSION_ID}")).toBe(false);
    expect(isValidSessionId("cs_test_../../x")).toBe(false);
    expect(isValidSessionId(undefined)).toBe(false);
  });
});

describe("isBenchlineSession", () => {
  it("only accepts sessions created by Benchline checkout (shared Stripe account)", () => {
    expect(isBenchlineSession({ metadata: { source: "benchline" } })).toBe(true);
    expect(isBenchlineSession({ metadata: { source: "kaivaryn" } })).toBe(false);
    expect(isBenchlineSession({ metadata: null })).toBe(false);
  });
});
