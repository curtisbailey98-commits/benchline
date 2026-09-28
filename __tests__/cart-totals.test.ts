import { describe, expect, it } from "vitest";
import { calculateCartTotals } from "@/lib/pricing";
import { formatPrice } from "@/lib/products";

describe("cart totals display helpers", () => {
  it("formats whole-dollar prices without cents", () => {
    expect(formatPrice(19900)).toBe("$199");
    expect(formatPrice(2900)).toBe("$29");
  });

  it("computes empty cart as zero", () => {
    const t = calculateCartTotals([]);
    expect(t.subtotalCents).toBe(0);
    expect(t.itemCount).toBe(0);
  });
});
