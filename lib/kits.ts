/**
 * Downloadable kit registry.
 *
 * Each kit's source files live in content/products/<key>/ (never in public/).
 * `npm run pack:kits` zips every kit into private/downloads/<zipName>, which is
 * only served by the auth + entitlement gated route /api/downloads/[key].
 *
 * The `files` list powers the "What's inside" section on product pages, and a
 * test asserts it matches the real files on disk exactly.
 */

export type KitFile = { file: string; summary: string; system?: string };

export type Kit = {
  key: string;
  name: string;
  zipName: string;
  files: KitFile[];
};

const tradeCommon = (trade: string, prefix: string): KitFile[] => [
  { file: "00-START-HERE.md", summary: "Afternoon setup plan: what to customize first and in what order" },
  { file: `01-${prefix}-pricing-guide.md`, summary: `How to price ${trade} work: methods, time benchmarks, minimums, and when to raise prices` },
  { file: `02-${prefix}-pricing-calculator.xlsx`, summary: "Spreadsheet with live formulas: your hourly target, quote builder, and trade-specific sheets" },
  { file: `03-${prefix}-rate-card.csv`, summary: "Starting rate card (low / target) with trade-specific line items — edit to your market" },
  { file: `04-${prefix}-estimate-template.md`, summary: "Customer-facing estimate with trade-specific scope, exclusions, and add-on lines" },
  { file: `05-${prefix}-service-agreement.md`, summary: "Service agreement / terms template (not legal advice — review with a local attorney)" },
  { file: `06-${prefix}-job-checklists.md`, summary: "Loadout, arrival, on-job, and closeout checklists for this trade" },
  { file: `07-${prefix}-client-intake.md`, summary: "Intake questions that surface the details that change the price" },
  { file: `08-${prefix}-text-scripts.md`, summary: "Follow-up, rebooking, and review-request text scripts written for this trade" },
  { file: `09-${prefix}-seasonal-calendar.md`, summary: "Month-by-month upsell and marketing calendar" },
];

export const KITS: Record<string, Kit> = {
  "core-kit": {
    key: "core-kit",
    name: "Benchline Core Kit",
    zipName: "benchline-core-kit.zip",
    files: [
      { file: "00-START-HERE.md", summary: "Welcome guide: the 7 systems, which file does what, and a day-by-day first week" },
      { file: "01-intake-script.md", summary: "Phone intake script, qualifying questions, and a copy-paste booking form", system: "Customer Intake System" },
      { file: "02-estimate-template.md", summary: "Written estimate template with scope, exclusions, and margin guardrails", system: "Fast Estimate System" },
      { file: "03-job-checklist.md", summary: "Arrival → closeout job checklist for the truck", system: "Job Execution Checklists" },
      { file: "04-follow-up-sms.md", summary: "Day-of, 24-hour, and 7-day after-job follow-up texts", system: "Lead-to-Customer Follow-Up System" },
      { file: "05-google-review-ask.md", summary: "Google review request flow: timing, scripts, and replies", system: "5-Star Review Engine" },
      { file: "06-weekly-money-review.md", summary: "30-minute weekly money check-in routine", system: "Weekly Money Dashboard" },
      { file: "07-job-pricing-guide.md", summary: "Step-by-step method to set your target rate, minimum job price, and rate card", system: "Job Pricing System" },
      { file: "08-job-pricing-calculator.xlsx", summary: "Pricing spreadsheet: your target hourly rate, price-a-job check, and rate card", system: "Job Pricing System" },
      { file: "09-lead-follow-up-system.md", summary: "Text + email sequence for people who asked for a price but haven't booked", system: "Lead-to-Customer Follow-Up System" },
      { file: "10-weekly-money-dashboard.xlsx", summary: "Money-in, expenses, job profitability, and what you actually kept each week", system: "Weekly Money Dashboard" },
      { file: "pricing-sheets.csv", summary: "Starting rates across five trades (edit to your market)", system: "Job Pricing System" },
    ],
  },
  "cleaning-kit": {
    key: "cleaning-kit",
    name: "Cleaning Trade Kit",
    zipName: "benchline-cleaning-kit.zip",
    files: [
      ...tradeCommon("house cleaning", "cleaning"),
      { file: "10-room-by-room-checklist.md", summary: "Room-by-room checklist for standard vs. deep cleans" },
      { file: "11-move-out-cleaning-pricing.md", summary: "Move-out / move-in pricing method, condition tiers, and landlord-ready scope" },
    ],
  },
  "handyman-kit": {
    key: "handyman-kit",
    name: "Handyman Trade Kit",
    zipName: "benchline-handyman-kit.zip",
    files: [
      ...tradeCommon("handyman", "handyman"),
      { file: "10-job-pricing-by-task.md", summary: "Task-by-task pricing guide with time ranges and gotchas" },
      { file: "11-change-order-form.md", summary: "Change-order form and the script for introducing it mid-job" },
    ],
  },
  "lawn-care-kit": {
    key: "lawn-care-kit",
    name: "Lawn Care Trade Kit",
    zipName: "benchline-lawn-care-kit.zip",
    files: [
      ...tradeCommon("lawn care", "lawn-care"),
      { file: "10-seasonal-maintenance-contract.md", summary: "Seasonal maintenance contract with monthly billing option" },
      { file: "11-route-planning-guide.md", summary: "Route density planning: zones, service days, and drive-time rules" },
    ],
  },
  "pressure-washing-kit": {
    key: "pressure-washing-kit",
    name: "Pressure Washing Trade Kit",
    zipName: "benchline-pressure-washing-kit.zip",
    files: [
      ...tradeCommon("pressure washing", "pressure-washing"),
      { file: "10-surface-pricing-matrix.md", summary: "Surface-by-surface pricing matrix with condition multipliers" },
      { file: "11-pre-job-damage-waiver.md", summary: "Pre-job condition acknowledgment + damage waiver (review with a local attorney)" },
    ],
  },
  "detailing-kit": {
    key: "detailing-kit",
    name: "Mobile Detailing Trade Kit",
    zipName: "benchline-detailing-kit.zip",
    files: [
      ...tradeCommon("mobile detailing", "detailing"),
      { file: "10-detail-package-menu.md", summary: "Package menu (good / better / best) with vehicle-size pricing and add-ons" },
      { file: "11-vehicle-condition-inspection.md", summary: "Vehicle condition inspection form for walk-around before you start" },
    ],
  },
  "pricing-calculator-pack": {
    key: "pricing-calculator-pack",
    name: "Pricing Calculator Pack",
    zipName: "benchline-pricing-calculator-pack.zip",
    files: [
      { file: "00-START-HERE.md", summary: "Which calculator to use when" },
      { file: "01-benchline-pricing-calculators.xlsx", summary: "Five calculators with formulas: hourly target, job profit check, drive-time cost, break-even, price increase planner" },
      { file: "02-how-to-use-the-calculators.md", summary: "Walkthrough of every input with a worked example" },
      { file: "03-pricing-conversations.md", summary: "How to present a price, handle 'that's too much', and stop discounting" },
      { file: "04-price-increase-notices.md", summary: "Price increase notice templates (text, email, and in-person)" },
    ],
  },
  "contracts-waivers-pack": {
    key: "contracts-waivers-pack",
    name: "Contracts & Waivers Pack",
    zipName: "benchline-contracts-waivers-pack.zip",
    files: [
      { file: "00-START-HERE.md", summary: "How to adapt these templates — and why a local attorney review matters" },
      { file: "01-one-time-service-agreement.md", summary: "One-time job service agreement" },
      { file: "02-recurring-service-agreement.md", summary: "Recurring service agreement (weekly / biweekly / monthly)" },
      { file: "03-deposit-and-cancellation-policy.md", summary: "Deposit, rescheduling, and cancellation policy" },
      { file: "04-property-condition-waiver.md", summary: "Pre-existing condition acknowledgment and limited release" },
      { file: "05-photo-media-release.md", summary: "Before/after photo and media release" },
      { file: "06-change-order-form.md", summary: "Generic change-order form" },
      { file: "07-payment-terms-and-late-fees.md", summary: "Payment terms, late fees, and a polite collections sequence" },
      { file: "08-satisfaction-and-redo-policy.md", summary: "Satisfaction / re-do policy that protects you from endless callbacks" },
    ],
  },
  "client-retention-pack": {
    key: "client-retention-pack",
    name: "Client Retention Text Pack",
    zipName: "benchline-client-retention-pack.zip",
    files: [
      { file: "00-START-HERE.md", summary: "How to load the scripts into your phone and when to send each" },
      { file: "01-lead-response-scripts.md", summary: "First-response texts for new leads (web, call, referral, missed call)" },
      { file: "02-quote-follow-up-sequence.md", summary: "Quote follow-up sequence: day 1, 3, 7, and close-out" },
      { file: "03-booking-and-reminder-scripts.md", summary: "Confirmations, reminders, on-my-way, running late, weather delays" },
      { file: "04-review-and-referral-scripts.md", summary: "Review requests and referral asks after a good job" },
      { file: "05-win-back-scripts.md", summary: "Reactivation texts for clients who went quiet (30 / 60 / 90+ days)" },
      { file: "06-tough-conversations.md", summary: "Complaints, late payments, price increases, and ending a client relationship" },
      { file: "07-client-tracker.csv", summary: "Simple client tracker for last service, next touch, and review status" },
    ],
  },
  "first-helper-pack": {
    key: "first-helper-pack",
    name: "Hiring Your First Helper Pack",
    zipName: "benchline-first-helper-pack.zip",
    files: [
      { file: "00-START-HERE.md", summary: "The order to work through this pack (not legal or tax advice)" },
      { file: "01-are-you-ready-to-hire.md", summary: "Readiness checklist and the math that says yes or not yet" },
      { file: "02-employee-vs-contractor-overview.md", summary: "Plain-language overview of W-2 vs 1099 and questions for your accountant" },
      { file: "03-job-post-templates.md", summary: "Job post templates for part-time helpers" },
      { file: "04-interview-and-trial-day.md", summary: "Interview questions, reference check script, and a paid trial-day plan" },
      { file: "05-onboarding-checklist.md", summary: "First-week onboarding checklist" },
      { file: "06-training-sop-template.md", summary: "Template for turning how you do a job into a written SOP" },
      { file: "07-quality-check-form.md", summary: "Job quality check form for reviewing a helper's work" },
      { file: "08-helper-cost-calculator.xlsx", summary: "Calculator with formulas: loaded hourly cost and whether a helper pays for themselves" },
    ],
  },
  "pro-library": {
    key: "pro-library",
    name: "Benchline Pro Library",
    zipName: "benchline-pro-library.zip",
    files: [
      { file: "00-START-HERE.md", summary: "How Pro works, what's in the library, and how new tools are added" },
      { file: "01-seasonal-pricing-planner.xlsx", summary: "Month-by-month demand, seasonal price changes, projected revenue, and a slow-month savings target" },
      { file: "02-seasonal-pricing-playbook.md", summary: "Using the planner, raising prices by season without losing regulars, slow-month plays" },
      { file: "03-upsell-and-add-on-scripts.md", summary: "Add-on, upgrade, and recurring-plan scripts for five trades" },
      { file: "CHANGELOG.md", summary: "What was added or updated, and when" },
    ],
  },
};

export function getKit(key: string): Kit | undefined {
  return Object.prototype.hasOwnProperty.call(KITS, key) ? KITS[key] : undefined;
}
