import { describe, expect, it } from "vitest";
import { calculateCartTotals, bundleSavingsCents } from "@/lib/pricing";

describe("calculateCartTotals", () => {
  it("sums known products", () => {
    const totals = calculateCartTotals([
      { productId: "core-kit", quantity: 1 },
      { productId: "updates", quantity: 2 },
    ]);
    expect(totals.itemCount).toBe(3);
    expect(totals.subtotalCents).toBe(19900 + 2900 * 2);
    expect(totals.lines).toHaveLength(2);
  });

  it("ignores unknown products and non-positive qty", () => {
    const totals = calculateCartTotals([
      { productId: "nope", quantity: 1 },
      { productId: "core-kit", quantity: 0 },
      { productId: "core-bundle", quantity: 1 },
    ]);
    expect(totals.itemCount).toBe(1);
    expect(totals.subtotalCents).toBe(24900);
  });

  it("floors fractional quantities", () => {
    const totals = calculateCartTotals([{ productId: "updates", quantity: 2.9 }]);
    expect(totals.itemCount).toBe(2);
    expect(totals.subtotalCents).toBe(5800);
  });
});

describe("bundleSavingsCents", () => {
  it("is $37 vs core + 3 months updates", () => {
    expect(bundleSavingsCents()).toBe(3700);
  });
});
