/**
 * Benchline Pro access rules (pure — no I/O, unit tested).
 *
 * Pro access comes from either:
 *  1. A Stripe subscription (product "updates" / Benchline Pro, $29/mo) whose
 *     status is active, trialing, or past_due (Stripe is still retrying the
 *     card — we keep access during retries and show a warning), or
 *  2. A paid "Core + 3 Months Pro" bundle order: orders.pro_access_until is set
 *     to purchase time + 3 months by the webhook. It never auto-renews.
 * Refunded / canceled orders never grant access.
 */

export const PRO_SUBSCRIPTION_ACCESS_STATUSES = ["active", "trialing", "past_due"] as const;

export type SubscriptionRow = {
  id: string;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
};

export type ProOrderRow = {
  status: string;
  pro_access_until: string | null;
};

export type ProAccess =
  | { active: false; lapsedSubscription: SubscriptionRow | null }
  | {
      active: true;
      source: "subscription" | "bundle";
      /** ISO timestamp access runs until (period end / bundle end), if known */
      until: string | null;
      subscription: SubscriptionRow | null;
      pastDue: boolean;
      cancelAtPeriodEnd: boolean;
    };

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date.getTime());
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, lastDay));
  return d;
}

export function computeProAccess(
  subscriptions: SubscriptionRow[],
  orders: ProOrderRow[],
  now: Date = new Date()
): ProAccess {
  const live = subscriptions.find((s) =>
    (PRO_SUBSCRIPTION_ACCESS_STATUSES as readonly string[]).includes(s.status)
  );
  if (live) {
    return {
      active: true,
      source: "subscription",
      until: live.current_period_end,
      subscription: live,
      pastDue: live.status === "past_due",
      cancelAtPeriodEnd: Boolean(live.cancel_at_period_end),
    };
  }

  const bundleUntil = orders
    .filter((o) => (o.status === "paid" || o.status === "fulfilled") && o.pro_access_until)
    .map((o) => new Date(o.pro_access_until as string))
    .filter((d) => d.getTime() > now.getTime())
    .sort((a, b) => b.getTime() - a.getTime())[0];

  if (bundleUntil) {
    return {
      active: true,
      source: "bundle",
      until: bundleUntil.toISOString(),
      subscription: null,
      pastDue: false,
      cancelAtPeriodEnd: false,
    };
  }

  return { active: false, lapsedSubscription: subscriptions[0] ?? null };
}
