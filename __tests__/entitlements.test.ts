import { describe, expect, it } from "vitest";
import { getCartCrossSells, getCartSuggestions } from "@/lib/cart-suggestions";
import { buildOrderItems, bundleProAccessUntil, orderGrantsDownload } from "@/lib/entitlements";
import { addMonths, computeProAccess } from "@/lib/pro-access";
import { sanitizeAnalyticsEvent, summarizeFunnel } from "@/lib/analytics";

const user = { id: "u1", email: "Pat@Example.com" };

describe("orderGrantsDownload", () => {
  const order = {
    status: "paid",
    user_id: null,
    email: "pat@example.com",
    order_items: [{ download_key: "core-kit", download_keys: ["core-kit", "handyman-kit"] }],
  };
  it("grants every key on a paid order owned by email (case-insensitive)", () => {
    expect(orderGrantsDownload(order, user, "handyman-kit")).toBe(true);
    expect(orderGrantsDownload(order, user, "core-kit")).toBe(true);
    expect(orderGrantsDownload(order, user, "detailing-kit")).toBe(false);
  });
  it("denies refunded/pending orders and other users", () => {
    expect(orderGrantsDownload({ ...order, status: "refunded" }, user, "core-kit")).toBe(false);
    expect(orderGrantsDownload({ ...order, status: "pending" }, user, "core-kit")).toBe(false);
    expect(orderGrantsDownload(order, { id: "u2", email: "x@y.com" }, "core-kit")).toBe(false);
  });
  it("supports legacy rows with only download_key", () => {
    expect(orderGrantsDownload({ status: "fulfilled", user_id: "u1", order_items: [{ download_key: "core-kit" }] }, user, "core-kit")).toBe(true);
  });
});

describe("buildOrderItems", () => {
  it("expands bundles into all download keys and nulls unknown product ids", () => {
    const items = buildOrderItems("o1", [
      { productId: "core-plus-lawn-care", quantity: 1 },
      { productId: "retired-product", quantity: 1 },
    ]);
    expect(items[0]).toMatchObject({ product_id: "core-plus-lawn-care", download_key: "core-kit", download_keys: ["core-kit", "lawn-care-kit"], unit_amount_cents: 27900 });
    expect(items[1]).toMatchObject({ product_id: null, download_keys: [] });
  });
});

describe("Benchline Pro access", () => {
  const now = new Date("2026-10-01T12:00:00Z");
  it("bundle grants Pro for 3 months from purchase", () => {
    const until = bundleProAccessUntil([{ productId: "core-bundle" }], new Date("2026-10-01T12:00:00Z"));
    expect(until?.toISOString()).toBe("2027-01-01T12:00:00.000Z");
    expect(bundleProAccessUntil([{ productId: "core-kit" }], now)).toBeNull();
    expect(addMonths(new Date("2026-11-30T00:00:00Z"), 3).toISOString()).toBe("2027-02-28T00:00:00.000Z");
  });
  it("active/past_due subscriptions grant access; canceled does not", () => {
    const sub = { id: "sub_1", status: "active", current_period_end: "2026-10-31T00:00:00Z", cancel_at_period_end: false };
    expect(computeProAccess([sub], [], now)).toMatchObject({ active: true, source: "subscription", pastDue: false });
    expect(computeProAccess([{ ...sub, status: "past_due" }], [], now)).toMatchObject({ active: true, pastDue: true });
    expect(computeProAccess([{ ...sub, status: "canceled" }], [], now)).toMatchObject({ active: false });
  });
  it("bundle months grant access until they expire, and refunds revoke them", () => {
    const order = { status: "paid", pro_access_until: "2026-12-01T00:00:00Z" };
    expect(computeProAccess([], [order], now)).toMatchObject({ active: true, source: "bundle" });
    expect(computeProAccess([], [order], new Date("2026-12-02T00:00:00Z"))).toMatchObject({ active: false });
    expect(computeProAccess([], [{ ...order, status: "refunded" }], now)).toMatchObject({ active: false });
  });
});

describe("cart suggestions", () => {
  it("suggests the trade bundle when Core + a trade kit are both in the cart", () => {
    const s = getCartSuggestions(["core-kit", "pressure-washing-kit"]);
    expect(s[0]).toMatchObject({ kind: "swap-to-bundle", savingsCents: 4900 });
  });
  it("flags redundant items (kit inside a bundle, Pro alongside bundle Pro months)", () => {
    const s = getCartSuggestions(["core-plus-cleaning", "cleaning-kit", "core-kit"]);
    expect(s.filter((x) => x.kind === "redundant").map((x) => x.kind === "redundant" && x.product.id).sort()).toEqual(["cleaning-kit", "core-kit"]);
    const pro = getCartSuggestions(["core-bundle", "updates"]);
    expect(pro.some((x) => x.kind === "redundant" && x.product.id === "updates")).toBe(true);
  });
  it("cross-sells skip items already covered", () => {
    const ids = getCartCrossSells(["core-plus-handyman"]).map((p) => p.id);
    expect(ids).not.toContain("core-kit");
    expect(ids).not.toContain("handyman-kit");
  });
});

describe("analytics", () => {
  it("accepts only client events and strips PII-prone fields", () => {
    const row = sanitizeAnalyticsEvent({
      event: "checkout_click",
      path: "/shop/core-kit?email=pat@example.com#x",
      productId: "core-kit",
      anonId: "abc123",
      referrer: "https://www.google.com/search?q=benchline",
      email: "pat@example.com",
    });
    expect(row).toEqual({ event: "checkout_click", path: "/shop/core-kit", product_id: "core-kit", anon_id: "abc123", referrer_host: "www.google.com", value_cents: null });
    expect(sanitizeAnalyticsEvent({ event: "purchase" })).toBeNull();
    expect(sanitizeAnalyticsEvent({ event: "page_view", productId: "<script>" })?.product_id).toBeNull();
  });
  it("summarizes the funnel by distinct visitors", () => {
    const f = summarizeFunnel([
      { event: "page_view", anon_id: "a" },
      { event: "page_view", anon_id: "a" },
      { event: "page_view", anon_id: "b" },
      { event: "pricing_viewed", anon_id: "a" },
      { event: "purchase", anon_id: null },
    ]);
    expect(f.page_view).toEqual({ events: 3, visitors: 2 });
    expect(f.pricing_viewed.visitors).toBe(1);
    expect(f.purchase).toEqual({ events: 1, visitors: 1 });
  });
});
