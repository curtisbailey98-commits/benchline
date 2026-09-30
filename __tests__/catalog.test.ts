import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { KITS } from "@/lib/kits";
import {
  CORE_SYSTEMS,
  PRODUCTS,
  getProductById,
  getProductBySlug,
  getProductsForTrade,
} from "@/lib/products";
import { TRADES, getTradeByLandingSlug } from "@/lib/trades";
import previews from "@/content/previews.json";

const root = path.resolve(__dirname, "..");

describe("catalog", () => {
  it("has unique ids, slugs, and Stripe lookup keys", () => {
    const ids = PRODUCTS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(PRODUCTS.map((p) => p.slug)).size).toBe(PRODUCTS.length);
    expect(new Set(PRODUCTS.map((p) => p.stripeLookupKey)).size).toBe(PRODUCTS.length);
  });

  it("keeps the original product ids/slugs backwards-compatible", () => {
    expect(getProductBySlug("updates")?.name).toBe("Benchline Pro");
    expect(getProductById("updates")?.priceCents).toBe(2900);
    expect(getProductById("updates")?.stripeLookupKey).toBe("benchline_updates_monthly");
    expect(getProductById("core-kit")?.priceCents).toBe(19900);
    expect(getProductById("core-bundle")?.priceCents).toBe(24900);
  });

  it("bundle value math is $199 + $87 = $286, save $37, with 3 Pro months", () => {
    const bundle = getProductById("core-bundle")!;
    expect(bundle.compareAtCents).toBe(28600);
    expect(bundle.compareAtCents! - bundle.priceCents).toBe(3700);
    expect(bundle.proMonths).toBe(3);
    expect(bundle.badge).toBe("Best value");
  });

  it("has a $129 kit and a $279 Core+Kit bundle (save $49) for every trade", () => {
    for (const t of TRADES) {
      const kit = getProductById(t.kitProductId)!;
      const bundle = getProductById(t.bundleProductId)!;
      expect(kit.priceCents).toBe(12900);
      expect(kit.downloadKeys).toEqual([t.kitProductId]);
      expect(bundle.priceCents).toBe(27900);
      expect(bundle.compareAtCents! - bundle.priceCents).toBe(4900);
      expect(bundle.downloadKeys).toEqual(["core-kit", t.kitProductId]);
      expect(getProductsForTrade(t.id).map((p) => p.id).sort()).toEqual([t.bundleProductId, t.kitProductId].sort());
      expect(getTradeByLandingSlug(t.landingSlug)?.id).toBe(t.id);
    }
  });

  it("prices add-ons between $19 and $49", () => {
    const addOns = PRODUCTS.filter((p) => p.category === "add-on");
    expect(addOns.length).toBeGreaterThanOrEqual(4);
    for (const a of addOns) {
      expect(a.priceCents).toBeGreaterThanOrEqual(1900);
      expect(a.priceCents).toBeLessThanOrEqual(4900);
    }
  });

  it("every recommended upsell and trade add-on exists", () => {
    for (const p of PRODUCTS) for (const id of p.recommendedUpsells ?? []) expect(getProductById(id), `${p.id} → ${id}`).toBeDefined();
    for (const t of TRADES) for (const id of t.recommendedAddOns) expect(getProductById(id)).toBeDefined();
  });

  it("only the Pro membership is recurring", () => {
    expect(PRODUCTS.filter((p) => p.billing === "recurring").map((p) => p.id)).toEqual(["updates"]);
  });
});

describe("kit files", () => {
  it("KITS file lists exactly match the files on disk", () => {
    for (const kit of Object.values(KITS)) {
      const dir = path.join(root, "content/products", kit.key);
      const onDisk = fs.readdirSync(dir).filter((f) => !f.startsWith(".")).sort();
      expect(kit.files.map((f) => f.file).sort(), kit.key).toEqual(onDisk);
    }
  });

  it("every product download key has a kit and a packed ZIP", () => {
    const keys = new Set(PRODUCTS.flatMap((p) => p.downloadKeys).concat(["pro-library"]));
    for (const key of keys) {
      const kit = KITS[key];
      expect(kit, key).toBeDefined();
      expect(fs.existsSync(path.join(root, "private/downloads", kit.zipName)), kit.zipName).toBe(true);
    }
  });

  it("maps every Core Kit system to at least one real file", () => {
    for (const s of CORE_SYSTEMS) {
      expect(KITS["core-kit"].files.some((f) => f.system === s.name), s.name).toBe(true);
    }
    expect(CORE_SYSTEMS).toHaveLength(7);
  });

  it("paid files are never under public/", () => {
    const pub = path.join(root, "public");
    const all = fs.existsSync(pub) ? fs.readdirSync(pub, { recursive: true }).map(String) : [];
    expect(all.filter((f) => /\.(zip|xlsx|md|csv)$/.test(f))).toEqual([]);
  });

  it("previews are excerpts of real Core Kit files", () => {
    const core = KITS["core-kit"].files.map((f) => f.file);
    for (const p of [previews.pricingCalculator, previews.moneyDashboard, previews.followUp, previews.checklist]) {
      expect(core).toContain(p.file);
    }
    const checklist = fs.readFileSync(path.join(root, "content/products/core-kit/03-job-checklist.md"), "utf8");
    for (const line of previews.checklist.lines.filter(Boolean)) expect(checklist).toContain(line);
    const followUp = fs.readFileSync(path.join(root, "content/products/core-kit/09-lead-follow-up-system.md"), "utf8");
    for (const line of previews.followUp.lines.filter(Boolean)) expect(followUp).toContain(line);
  });

  it("contains no placeholder filler text", () => {
    const walk = (d: string): string[] =>
      fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]
      );
    const files = [...walk(path.join(root, "content")), ...walk(path.join(root, "app")), ...walk(path.join(root, "components"))]
      .filter((f) => /\.(md|tsx?|csv|json)$/.test(f));
    for (const f of files) expect(fs.readFileSync(f, "utf8"), f).not.toMatch(/lorem ipsum|TODO:|FIXME/i);
  });
});
