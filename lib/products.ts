import { TRADES, type TradeId } from "./trades";

export type BillingType = "one_time" | "recurring" | "bundle";
export type ProductCategory = "core" | "membership" | "bundle" | "trade-kit" | "add-on";

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
  category: ProductCategory;
  /** Set for trade kits and trade bundles */
  trade?: TradeId;
  /**
   * Stripe Price lookup_key. At checkout the price is resolved with
   * stripe.prices.list({ lookup_keys }) so no per-product env var is needed.
   */
  stripeLookupKey: string;
  /**
   * Optional legacy env override (the original three products). Any product can
   * also be overridden with STRIPE_PRICE_<ID_IN_UPPER_SNAKE>, see lib/stripe-prices.ts.
   */
  stripePriceEnvKey?: "STRIPE_PRICE_CORE" | "STRIPE_PRICE_MEMBERSHIP" | "STRIPE_PRICE_BUNDLE";
  features: string[];
  /** Delivery notes for non-download products (membership) */
  includes: string[];
  badge?: string;
  /** Kit keys (lib/kits.ts) this purchase unlocks for download */
  downloadKeys: string[];
  recommendedUpsells?: string[];
  /** Price if the parts were bought separately (bundles only) */
  compareAtCents?: number;
  /** Months of prepaid Benchline Pro access this one-time purchase grants (no auto-renew) */
  proMonths?: number;
};

const CORE_PRICE = 19900;
const TRADE_KIT_PRICE = 12900;
const TRADE_BUNDLE_PRICE = 27900;

type TradeCopy = {
  tagline: string;
  description: string;
  longDescription: string;
  features: string[];
};

const TRADE_COPY: Record<TradeId, TradeCopy> = {
  cleaning: {
    tagline: "Pricing, checklists, and terms built for residential cleaning.",
    description:
      "Room-based quote builder spreadsheet, move-out pricing, room-by-room checklists, a cleaning service agreement, intake questions, rebooking and review texts, and a 12-month marketing calendar.",
    longDescription: `The Cleaning Trade Kit takes the Benchline system and writes it for residential cleaning specifically: how long rooms actually take, how to price deep cleans and move-outs without guessing, and what to put in writing about pets, clutter, and lockouts.

The pricing calculator is a real spreadsheet with formulas. Enter your income goal and the room count, and it gives you a per-visit price plus recurring weekly, biweekly, and monthly prices.

Everything is Markdown, CSV, or XLSX, so it works in Notion, Google Docs, Sheets, or on paper.`,
    features: [
      "Room-based quote builder + move-out calculator (XLSX with formulas)",
      "Rate card with 20+ cleaning line items and add-ons",
      "Room-by-room checklist: standard vs. deep",
      "Move-out / move-in pricing method with condition tiers",
      "Cleaning service agreement template (attorney-review note)",
      "Intake questions, rebooking and review-request texts",
      "12-month seasonal upsell & marketing calendar",
    ],
  },
  handyman: {
    tagline: "Task pricing, change orders, and scope control for solo handymen.",
    description:
      "Task-by-task pricing guide and calculator, change-order form, handyman service agreement, estimate template with exclusions, job checklists, intake questions, follow-up texts, and a seasonal calendar.",
    longDescription: `The Handyman Trade Kit is built around the two things that decide whether a handyman job is profitable: pricing each task honestly (including the trip to the hardware store) and controlling scope once you're on site.

The calculator has a task library with editable time estimates, so a quote becomes picking tasks and quantities rather than guessing a number in the driveway. The change-order form and script make "while you're here…" a paid add-on instead of a free favor.

Includes reminders to check your state's handyman and contractor license limits — this kit does not replace licensing rules for electrical, plumbing, or structural work.`,
    features: [
      "Task pricing library + quote builder (XLSX with formulas)",
      "Job pricing by task guide: time ranges and gotchas",
      "Change-order form + mid-job script",
      "Handyman service agreement template (attorney-review note)",
      "Estimate template with license-aware exclusions",
      "Intake questions, follow-up and review texts",
      "Seasonal upsell & marketing calendar",
    ],
  },
  "lawn-care": {
    tagline: "Per-visit pricing, seasonal contracts, and tighter routes.",
    description:
      "Lot-size mowing price calculator, seasonal contract calculator, route planner, seasonal maintenance contract, estimate template, job checklists, intake questions, texts, and a mowing-season marketing calendar.",
    longDescription: `The Lawn Care Trade Kit is built around the economics of a mowing route: price per visit based on turf size and mower speed, sell the season rather than the cut, and keep stops close together so you get paid for mowing, not driving.

The calculator estimates visit time from turf square footage and your mower's production rate, rolls visits into a seasonal contract with an even monthly payment, and has a route planner that shows revenue per hour including drive time.

Includes a seasonal maintenance contract template and a route planning guide.`,
    features: [
      "Mowing price by lot size + seasonal contract calculator (XLSX)",
      "Route planner sheet: revenue per hour including drive time",
      "Seasonal maintenance contract with monthly billing option",
      "Route density planning guide",
      "Lawn service agreement + estimate template",
      "Intake questions, rain-delay, follow-up and review texts",
      "Month-by-month upsell calendar (cleanups, aeration, leaves)",
    ],
  },
  "pressure-washing": {
    tagline: "Surface pricing, pre-job waivers, and upsells for exterior cleaning.",
    description:
      "Surface pricing matrix and quote calculator with condition multipliers, pre-job damage waiver, service agreement, estimate template, job checklists, intake questions, texts, and a seasonal calendar.",
    longDescription: `The Pressure Washing Trade Kit is built for flatwork, house washing, decks, and fences — priced by the square foot or linear foot with condition multipliers, so every quote is consistent.

The pre-job waiver and condition walk-around protect you from the classic disputes: oxidized siding, failing paint, loose mortar, stains that never fully come out, and plants near the wash zone.

The calculator shows your effective hourly rate on every quote, so you can see when a "cheap" driveway is actually a bad job.`,
    features: [
      "Surface pricing matrix + quote builder with condition multipliers (XLSX)",
      "Pre-job damage waiver & condition acknowledgment",
      "Service agreement template (attorney-review note)",
      "Estimate template with stain and oxidation disclaimers",
      "Job checklists incl. plant protection and water source",
      "Intake questions, follow-up and review texts",
      "Seasonal calendar with bundle and annual-plan offers",
    ],
  },
  detailing: {
    tagline: "Package menu, vehicle inspections, and pricing by vehicle size.",
    description:
      "Detail package menu, vehicle condition inspection form, package calculator with size multipliers and surcharges, service agreement, estimate template, checklists, intake questions, texts, and a seasonal calendar.",
    longDescription: `The Mobile Detailing Trade Kit is built around a clear package menu (maintenance, interior, exterior, full), priced by vehicle size, with surcharges for pet hair, sand, and heavy soiling.

The vehicle condition inspection form documents existing scratches, chips, stains, and damage before you touch the car — so nobody blames you for a door ding that was already there.

The calculator turns package + size + add-ons into a price and an estimated time, and flags when your effective hourly rate drops below your target.`,
    features: [
      "Package pricing calculator with size multipliers (XLSX)",
      "Good / better / best package menu with add-ons",
      "Vehicle condition inspection form",
      "Mobile detailing service agreement (attorney-review note)",
      "Estimate template, water/power and site requirements",
      "Intake questions, maintenance-plan and review texts",
      "Seasonal calendar (pollen, road salt, holidays)",
    ],
  },
};

function tradeKit(tradeId: TradeId): Product {
  const trade = TRADES.find((t) => t.id === tradeId)!;
  const copy = TRADE_COPY[tradeId];
  return {
    id: trade.kitProductId,
    slug: trade.kitProductId,
    name: `${trade.name} Trade Kit`,
    tagline: copy.tagline,
    description: copy.description,
    longDescription: copy.longDescription,
    priceCents: TRADE_KIT_PRICE,
    billing: "one_time",
    category: "trade-kit",
    trade: tradeId,
    stripeLookupKey: `benchline_kit_${tradeId.replace(/-/g, "_")}`,
    features: [...copy.features, "Instant ZIP download after purchase"],
    includes: [],
    downloadKeys: [trade.kitProductId],
    recommendedUpsells: [trade.bundleProductId, "core-kit", ...trade.recommendedAddOns],
  };
}

function tradeBundle(tradeId: TradeId): Product {
  const trade = TRADES.find((t) => t.id === tradeId)!;
  const compareAt = CORE_PRICE + TRADE_KIT_PRICE;
  const save = (compareAt - TRADE_BUNDLE_PRICE) / 100;
  return {
    id: trade.bundleProductId,
    slug: trade.bundleProductId,
    name: `Core Kit + ${trade.name} Kit`,
    tagline: `The full Benchline system plus the ${trade.shortLabel.toLowerCase()} kit. Save $${save}.`,
    description: `Benchline Core Kit ($199) and the ${trade.name} Trade Kit ($129) together for $${TRADE_BUNDLE_PRICE / 100} — both ZIP downloads unlock right after purchase.`,
    longDescription: `The Core Kit gives you the seven business systems every solo operator needs: job pricing, estimates, lead follow-up, intake, job checklists, review requests, and a weekly money dashboard.

The ${trade.name} Trade Kit applies that system to ${trade.operators}: trade-specific pricing calculator, service agreement, checklists, scripts, and a seasonal calendar.

Buying both together saves $${save} versus buying them separately.`,
    priceCents: TRADE_BUNDLE_PRICE,
    compareAtCents: compareAt,
    billing: "bundle",
    category: "bundle",
    trade: tradeId,
    stripeLookupKey: `benchline_bundle_core_${tradeId.replace(/-/g, "_")}`,
    badge: `Save $${save}`,
    features: [
      "Everything in Benchline Core Kit",
      `Everything in the ${trade.name} Trade Kit`,
      `Save $${save} vs buying separately`,
      "Two instant ZIP downloads after purchase",
    ],
    includes: [],
    downloadKeys: ["core-kit", trade.kitProductId],
    recommendedUpsells: [...trade.recommendedAddOns],
  };
}

export const PRO_MONTHLY_CENTS = 2900;
export const CORE_BUNDLE_PRICE = 24900;
export const PRO_BUNDLE_MONTHS = 3;

/** The 7 business systems in the Core Kit. Files are listed in lib/kits.ts. */
export const CORE_SYSTEMS: Array<{ name: string; outcome: string }> = [
  { name: "Job Pricing System", outcome: "Know what to charge before you accept a job." },
  { name: "Fast Estimate System", outcome: "Send a professional written quote in minutes." },
  { name: "Lead-to-Customer Follow-Up System", outcome: "Follow up with people who asked but haven't booked." },
  { name: "Customer Intake System", outcome: "Ask the right questions before you quote or show up." },
  { name: "Job Execution Checklists", outcome: "Fewer forgotten steps, callbacks, and mistakes." },
  { name: "5-Star Review Engine", outcome: "Ask for Google reviews at the right moment." },
  { name: "Weekly Money Dashboard", outcome: "See money in, expenses, job profit, and what you actually kept." },
];

export const PRO_RENEWAL_DISCLOSURE =
  "Benchline Pro is $29/month and renews automatically each month until you cancel. Cancel anytime from your account (Manage billing) or by contacting support; you keep access until the end of the period you paid for.";

export const BUNDLE_PRO_DISCLOSURE =
  "The 3 months of Pro in the bundle are prepaid and do not auto-renew. No card is charged when they end; you can choose to start a Pro subscription then.";

export const PRODUCTS: Product[] = [
  {
    id: "core-kit",
    slug: "core-kit",
    name: "Benchline Core Kit",
    tagline: "Seven business systems for solo home-service operators — ready the day you buy.",
    description:
      "Seven ready-to-use business systems: job pricing, fast estimates, lead follow-up, customer intake, job checklists, review requests, and a weekly money dashboard. Markdown, CSV, and XLSX spreadsheets with working formulas.",
    longDescription: `Benchline Core Kit is the back office for solo home-service operators who are excellent at the work and tired of improvising the business side.

It's seven systems, each made of files you can use the same day: a pricing calculator that tells you what to charge before you say yes, an estimate template, text and email follow-up sequences, an intake script and booking form, job checklists, a Google review request flow, and a weekly money dashboard that shows what you actually kept.

Everything is a plain file you own — Markdown (works in any editor, imports into Notion or Google Docs), CSV, and XLSX spreadsheets for Excel, Google Sheets, or LibreOffice. Built for cleaners, pressure washers, lawn-care operators, mobile detailers, handymen, and similar businesses. Pair it with a Trade Kit for pricing and paperwork written for your specific trade.`,
    priceCents: CORE_PRICE,
    billing: "one_time",
    category: "core",
    stripeLookupKey: "benchline_core_kit",
    stripePriceEnvKey: "STRIPE_PRICE_CORE",
    badge: "Flagship",
    downloadKeys: ["core-kit"],
    recommendedUpsells: ["core-bundle", "pricing-calculator-pack", "client-retention-pack"],
    features: [
      "Job Pricing System — pricing guide + calculator spreadsheet",
      "Fast Estimate System — written estimate template",
      "Lead-to-Customer Follow-Up System — text + email sequences",
      "Customer Intake System — phone script + booking form",
      "Job Execution Checklists — arrival to closeout",
      "5-Star Review Engine — review request flow",
      "Weekly Money Dashboard — spreadsheet + weekly routine",
      "One-time purchase, instant ZIP download",
    ],
    includes: [],
  },
  {
    id: "updates",
    slug: "updates",
    name: "Benchline Pro",
    tagline: "Benchline keeps getting smarter as your business grows.",
    description:
      "A monthly membership that keeps adding tools to your Benchline toolkit, starting with the Pro Library. $29/month, renews monthly until you cancel.",
    longDescription: `Benchline Pro is for operators who want their back office to keep improving after the Core Kit is set up.

Members get the Pro Library download in their account (it starts with a seasonal pricing planner and an upsell & add-on script library) and every tool we add to it while their membership is active.

Examples of what we plan to add: new pricing calculators, seasonal pricing tools, customer and upsell scripts, quote templates, expense and profit tools, service-specific workflows, customer-acquisition playbooks, and operational checklists — plus updated versions of existing templates. We don't promise a specific file on a specific date; we add what's most useful to solo operators.

$29/month. Renews automatically each month until you cancel. Cancel anytime; you keep access through the end of the month you paid for.`,
    priceCents: PRO_MONTHLY_CENTS,
    billing: "recurring",
    interval: "month",
    category: "membership",
    stripeLookupKey: "benchline_updates_monthly",
    stripePriceEnvKey: "STRIPE_PRICE_MEMBERSHIP",
    downloadKeys: [],
    features: [
      "Pro Library download: seasonal pricing planner + upsell script library",
      "New tools added to the library over time — planned, not on a fixed schedule",
      "Updated versions of Benchline templates",
      "Pro status shown in your account",
      "Renews monthly until canceled — cancel anytime",
    ],
    includes: [
      "Access to the Pro Library download in your account while active",
      "Email when new Pro tools are added",
      "Billed $29 every month until you cancel",
    ],
  },
  {
    id: "core-bundle",
    slug: "core-bundle",
    name: "Benchline Core + 3 Months Pro",
    tagline: "The Core Kit plus three prepaid months of Benchline Pro. Save $37.",
    description:
      "The full Core Kit plus three months of Benchline Pro for one payment of $249 — $199 + $87 = $286 value, you save $37. The 3 Pro months don't auto-renew.",
    longDescription: `The best way to start: install the seven Core systems this week, and get three months of Benchline Pro while you settle in.

You get the Core Kit download immediately, plus Pro Library access for three months from purchase.

Core Kit $199 + 3 months of Pro ($29 × 3 = $87) = $286 value. Bundle price $249 — you save $37. It's a single one-time payment: the three Pro months are prepaid and do not auto-renew, so nothing else is charged when they end.`,
    priceCents: CORE_BUNDLE_PRICE,
    compareAtCents: CORE_PRICE + PRO_MONTHLY_CENTS * PRO_BUNDLE_MONTHS,
    billing: "bundle",
    category: "bundle",
    stripeLookupKey: "benchline_core_bundle",
    stripePriceEnvKey: "STRIPE_PRICE_BUNDLE",
    badge: "Best value",
    downloadKeys: ["core-kit"],
    proMonths: PRO_BUNDLE_MONTHS,
    recommendedUpsells: ["pricing-calculator-pack", "client-retention-pack"],
    features: [
      "Everything in Benchline Core Kit (all 7 systems)",
      "3 months of Benchline Pro included (prepaid, no auto-renew)",
      "$199 + $87 = $286 value — save $37",
      "One-time payment, instant Core Kit download",
    ],
    includes: ["Core Kit ZIP download", "Pro Library access for 3 months from purchase"],
  },
  ...TRADES.map((t) => tradeKit(t.id)),
  ...TRADES.map((t) => tradeBundle(t.id)),
  {
    id: "pricing-calculator-pack",
    slug: "pricing-calculator-pack",
    name: "Pricing Calculator Pack",
    tagline: "Know your real hourly number, and check every job's profit before you quote.",
    description:
      "Five spreadsheet calculators with formulas (hourly target, job profit check, drive-time cost, break-even, price increase planner) plus scripts for presenting prices and raising them.",
    longDescription: `Most solo operators price by copying competitors. This pack starts from your own numbers instead: what you want to take home, what the business costs to run, and how many hours you can actually bill.

The spreadsheet has five calculators with live formulas. The written guides walk through a worked example and give you the words for presenting a price, handling "that's too much," and sending a price increase notice.

Works for any trade.`,
    priceCents: 3900,
    billing: "one_time",
    category: "add-on",
    stripeLookupKey: "benchline_addon_pricing_calculator",
    downloadKeys: ["pricing-calculator-pack"],
    recommendedUpsells: ["client-retention-pack", "core-kit"],
    features: [
      "Hourly target calculator (income goal → minimum rate)",
      "Job profit check with margin warning",
      "Drive-time and mileage cost calculator",
      "Break-even and price increase planner",
      "Pricing conversation scripts + price increase notices",
    ],
    includes: [],
  },
  {
    id: "contracts-waivers-pack",
    slug: "contracts-waivers-pack",
    name: "Contracts & Waivers Pack",
    tagline: "Plain-language agreements, policies, and waivers to adapt with your attorney.",
    description:
      "One-time and recurring service agreements, deposit and cancellation policy, property condition waiver, photo release, change order, payment terms, and a re-do policy. Not legal advice.",
    longDescription: `Most disputes in home services come from things nobody wrote down: what was included, what happens when the client cancels, who pays for pre-existing damage, and how many callbacks are free.

This pack gives you plain-language starting templates for each of those, written for solo operators. They are not legal advice — laws vary by state and city, so have a local attorney review them before you use them. They're a much cheaper starting point for that review than a blank page.

Works for any trade.`,
    priceCents: 4900,
    billing: "one_time",
    category: "add-on",
    stripeLookupKey: "benchline_addon_contracts_waivers",
    downloadKeys: ["contracts-waivers-pack"],
    recommendedUpsells: ["pricing-calculator-pack", "core-kit"],
    features: [
      "One-time + recurring service agreements",
      "Deposit, rescheduling & cancellation policy",
      "Property condition acknowledgment & limited release",
      "Photo / media release",
      "Change-order form, payment terms & late fees",
      "Satisfaction / re-do policy",
    ],
    includes: [],
  },
  {
    id: "client-retention-pack",
    slug: "client-retention-pack",
    name: "Client Retention Text Pack",
    tagline: "The texts that turn one-time jobs into repeat clients and referrals.",
    description:
      "Lead response, quote follow-up, booking and reminder, review and referral, win-back, and tough-conversation text scripts plus a simple client tracker CSV.",
    longDescription: `Repeat clients are the cheapest revenue a solo operator has, and most of it is lost to silence: slow lead replies, quotes that never get a follow-up, and good clients who simply never get asked to rebook.

This pack is a library of short, human text scripts for each stage — from the first reply to a new lead through win-back messages for clients who went quiet — plus a tracker so you know who to text this week.

Works for any trade.`,
    priceCents: 2900,
    billing: "one_time",
    category: "add-on",
    stripeLookupKey: "benchline_addon_client_retention",
    downloadKeys: ["client-retention-pack"],
    recommendedUpsells: ["pricing-calculator-pack", "core-kit"],
    features: [
      "Lead response + missed-call texts",
      "Quote follow-up sequence (day 1 / 3 / 7 / close-out)",
      "Booking, reminder, running-late & weather scripts",
      "Review and referral asks",
      "Win-back texts (30 / 60 / 90+ days)",
      "Tough conversations + client tracker CSV",
    ],
    includes: [],
  },
  {
    id: "first-helper-pack",
    slug: "first-helper-pack",
    name: "Hiring Your First Helper Pack",
    tagline: "Decide if you're ready, hire carefully, and train a helper to your standard.",
    description:
      "Readiness checklist, employee vs contractor overview, job posts, interview and paid trial-day plan, onboarding checklist, SOP template, quality check form, and a helper cost calculator.",
    longDescription: `Your first helper is the biggest step a solo operator takes: it can double your capacity, or it can eat your margin and your weekends.

This pack walks through the decision (the math and the readiness checklist), the hire (job posts, interview questions, a paid trial day), and the first weeks (onboarding, written SOPs, quality checks). The cost calculator shows what a helper really costs per hour once taxes and insurance are included.

Not legal or tax advice — the employee vs contractor overview ends with questions to bring to your accountant.`,
    priceCents: 4900,
    billing: "one_time",
    category: "add-on",
    stripeLookupKey: "benchline_addon_first_helper",
    downloadKeys: ["first-helper-pack"],
    recommendedUpsells: ["contracts-waivers-pack", "pricing-calculator-pack"],
    features: [
      "Hiring readiness checklist + math",
      "W-2 vs 1099 plain-language overview",
      "Job post templates + interview questions",
      "Paid trial-day plan and onboarding checklist",
      "SOP template + quality check form",
      "Helper cost calculator (XLSX with formulas)",
    ],
    includes: [],
  },
];

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  core: "Core Kit",
  membership: "Benchline Pro",
  bundle: "Bundles",
  "trade-kit": "Trade kits",
  "add-on": "Add-ons",
};

export function getProductBySlug(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}

export function getProductById(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

export function getProductsByCategory(category: ProductCategory): Product[] {
  return PRODUCTS.filter((p) => p.category === category);
}

export function getProductsForTrade(trade: TradeId): Product[] {
  return PRODUCTS.filter((p) => p.trade === trade);
}

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}
