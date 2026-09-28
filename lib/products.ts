export type BillingType = "one_time" | "recurring" | "bundle";

export type Product = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  longDescription: string;
  priceCents: number;
  billing: BillingType;
  interval?: "month";
  stripePriceEnvKey: "STRIPE_PRICE_CORE" | "STRIPE_PRICE_MEMBERSHIP" | "STRIPE_PRICE_BUNDLE";
  features: string[];
  includes: string[];
  badge?: string;
  downloadKey?: string;
  recommendedUpsells?: string[];
};

export const PRODUCTS: Product[] = [
  {
    id: "core-kit",
    slug: "core-kit",
    name: "Benchline Core Kit",
    tagline: "The paperwork OS for solo trades — ready the day you buy.",
    description:
      "Notion-compatible markdown packs, printable PDFs, and CSV pricing sheets covering intake, estimates, job checklists, follow-up SMS, Google review asks, and a weekly money review SOP.",
    longDescription: `Benchline Core Kit is the operating system for solo home-service operators who are excellent at the trade and tired of improvising the business side.

You get battle-tested scripts and templates you can paste into Notion, print for the truck, or load into a spreadsheet — no fluff, no filler courses.

Built for cleaners, handymen, lawn care, pressure washing, HVAC helpers, detailers, and anyone running jobs alone.`,
    priceCents: 19900,
    billing: "one_time",
    stripePriceEnvKey: "STRIPE_PRICE_CORE",
    badge: "Best starter",
    downloadKey: "core-kit",
    recommendedUpsells: ["updates", "core-bundle"],
    features: [
      "Customer intake script (phone + in-person)",
      "Estimate & quote template with margin guardrails",
      "On-job checklist (arrival → closeout)",
      "Follow-up SMS scripts (day-of, 24h, 7-day)",
      "Google review ask flow that doesn't feel pushy",
      "Weekly money review SOP (cash in / cash out)",
      "CSV pricing sheets you can customize by trade",
      "Instant ZIP download after purchase",
    ],
    includes: [
      "01-intake-script.md",
      "02-estimate-template.md",
      "03-job-checklist.md",
      "04-follow-up-sms.md",
      "05-google-review-ask.md",
      "06-weekly-money-review.md",
      "pricing-sheets.csv",
      "PRINTABLE-README.md",
    ],
  },
  {
    id: "updates",
    slug: "updates",
    name: "Benchline Updates",
    tagline: "Monthly playbook drops so your systems keep compounding.",
    description:
      "A membership for solo operators who want fresh scripts, seasonal pricing plays, and ops tweaks delivered every month — plus a member area for past drops.",
    longDescription: `Benchline Updates is the monthly membership that keeps your Core Kit from going stale.

Each month you get a focused playbook drop: a new script, a pricing adjustment for the season, a review or referral tactic, or an ops SOP you can run the same week.

Fulfillment is email + member area access. Cancel anytime.`,
    priceCents: 2900,
    billing: "recurring",
    interval: "month",
    stripePriceEnvKey: "STRIPE_PRICE_MEMBERSHIP",
    features: [
      "Monthly playbook drop (script, pricing, or ops)",
      "Member area archive of past drops",
      "Seasonal pricing and demand notes",
      "Cancel anytime — no annual lock-in",
    ],
    includes: [
      "Email delivery of each monthly playbook",
      "Access to member archive",
      "Priority support queue for members",
    ],
  },
  {
    id: "core-bundle",
    slug: "core-bundle",
    name: "Core + 3 Months Updates",
    tagline: "Start with the kit. Lock in three months of drops. Save vs buying separate.",
    description:
      "Get the full Core Kit plus three months of Benchline Updates at a bundle price — save versus buying Core ($199) + 3× Updates ($87) separately.",
    longDescription: `The fastest way to install Benchline and keep momentum for your first quarter.

You get instant access to the Core Kit download, plus three months of Updates membership so the systems keep improving while you run jobs.

Save $37 versus buying Core Kit + three months of Updates separately.`,
    priceCents: 24900,
    billing: "bundle",
    stripePriceEnvKey: "STRIPE_PRICE_BUNDLE",
    badge: "Best value",
    downloadKey: "core-kit",
    features: [
      "Everything in Benchline Core Kit",
      "3 months of Benchline Updates included",
      "Save $37 vs buying separately",
      "Instant Core Kit download + membership access",
    ],
    includes: [
      "Full Core Kit ZIP",
      "3 months Updates membership",
      "Member area access during active period",
    ],
  },
];

export function getProductBySlug(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}

export function getProductById(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

export function getStripePriceId(product: Product): string | undefined {
  return process.env[product.stripePriceEnvKey];
}
