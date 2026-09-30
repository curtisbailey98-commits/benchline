export type TradeId = "cleaning" | "handyman" | "lawn-care" | "pressure-washing" | "detailing";

export type Trade = {
  id: TradeId;
  /** URL segment for the landing page: /for/[landingSlug] */
  landingSlug: string;
  name: string;
  /** Plural noun for the operator, e.g. "house cleaners" */
  operators: string;
  shortLabel: string;
  kitProductId: string;
  bundleProductId: string;
  /** Add-ons that pair especially well with this trade (product ids) */
  recommendedAddOns: string[];
};

export const TRADES: Trade[] = [
  {
    id: "cleaning",
    landingSlug: "cleaners",
    name: "House Cleaning",
    operators: "house cleaners",
    shortLabel: "Cleaning",
    kitProductId: "cleaning-kit",
    bundleProductId: "core-plus-cleaning",
    recommendedAddOns: ["client-retention-pack", "first-helper-pack"],
  },
  {
    id: "handyman",
    landingSlug: "handymen",
    name: "Handyman",
    operators: "handymen",
    shortLabel: "Handyman",
    kitProductId: "handyman-kit",
    bundleProductId: "core-plus-handyman",
    recommendedAddOns: ["contracts-waivers-pack", "pricing-calculator-pack"],
  },
  {
    id: "lawn-care",
    landingSlug: "lawn-care",
    name: "Lawn Care",
    operators: "lawn care operators",
    shortLabel: "Lawn Care",
    kitProductId: "lawn-care-kit",
    bundleProductId: "core-plus-lawn-care",
    recommendedAddOns: ["client-retention-pack", "first-helper-pack"],
  },
  {
    id: "pressure-washing",
    landingSlug: "pressure-washing",
    name: "Pressure Washing",
    operators: "pressure washers",
    shortLabel: "Pressure Washing",
    kitProductId: "pressure-washing-kit",
    bundleProductId: "core-plus-pressure-washing",
    recommendedAddOns: ["contracts-waivers-pack", "pricing-calculator-pack"],
  },
  {
    id: "detailing",
    landingSlug: "detailing",
    name: "Mobile Auto Detailing",
    operators: "mobile detailers",
    shortLabel: "Detailing",
    kitProductId: "detailing-kit",
    bundleProductId: "core-plus-detailing",
    recommendedAddOns: ["client-retention-pack", "pricing-calculator-pack"],
  },
];

export function getTradeById(id: string): Trade | undefined {
  return TRADES.find((t) => t.id === id);
}

export function getTradeByLandingSlug(slug: string): Trade | undefined {
  return TRADES.find((t) => t.landingSlug === slug);
}
