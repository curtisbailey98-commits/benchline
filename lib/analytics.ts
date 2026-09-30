/**
 * First-party funnel analytics. No third-party trackers, no cookies, no PII:
 * we store the event name, path, optional product id, an anonymous per-tab id
 * (random, sessionStorage), the referrer's host name, and an optional amount.
 */

export const ANALYTICS_EVENTS = [
  "page_view",
  "pricing_viewed",
  "checkout_click",
  "checkout_started",
  "purchase",
] as const;
export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];

/** Events the browser may send. checkout_started / purchase are server-only. */
export const CLIENT_EVENTS: readonly AnalyticsEventName[] = ["page_view", "pricing_viewed", "checkout_click"];

export type AnalyticsRow = {
  event: AnalyticsEventName;
  path: string | null;
  product_id: string | null;
  anon_id: string | null;
  referrer_host: string | null;
  value_cents: number | null;
};

function clip(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t.slice(0, max) : null;
}

/** Strips query strings/fragments (they can carry emails or tokens) and caps length. */
export function cleanPath(v: unknown): string | null {
  const p = clip(v, 400);
  if (!p || !p.startsWith("/")) return null;
  return p.split(/[?#]/)[0].slice(0, 200);
}

export function referrerHost(v: unknown): string | null {
  const r = clip(v, 500);
  if (!r) return null;
  try {
    return new URL(r).hostname.slice(0, 120) || null;
  } catch {
    return null;
  }
}

/** Validates an event payload. `allowed` restricts which event names are accepted. */
export function sanitizeAnalyticsEvent(
  input: unknown,
  allowed: readonly AnalyticsEventName[] = CLIENT_EVENTS
): AnalyticsRow | null {
  if (!input || typeof input !== "object") return null;
  const o = input as Record<string, unknown>;
  if (typeof o.event !== "string" || !(allowed as readonly string[]).includes(o.event)) return null;
  const product = clip(o.productId, 64);
  const anon = clip(o.anonId, 64);
  const value = typeof o.valueCents === "number" && Number.isFinite(o.valueCents) ? Math.round(o.valueCents) : null;
  return {
    event: o.event as AnalyticsEventName,
    path: cleanPath(o.path),
    product_id: product && /^[a-z0-9-]+$/.test(product) ? product : null,
    anon_id: anon && /^[A-Za-z0-9_-]+$/.test(anon) ? anon : null,
    referrer_host: referrerHost(o.referrer),
    value_cents: value,
  };
}

export type FunnelCounts = Record<AnalyticsEventName, { events: number; visitors: number }>;

/** Aggregates raw rows into per-step counts (events and distinct anonymous visitors). */
export function summarizeFunnel(rows: Array<{ event: string; anon_id: string | null }>): FunnelCounts {
  const out = Object.fromEntries(
    ANALYTICS_EVENTS.map((e) => [e, { events: 0, visitors: 0 }])
  ) as FunnelCounts;
  const seen = new Map<string, Set<string>>();
  for (const r of rows) {
    if (!(ANALYTICS_EVENTS as readonly string[]).includes(r.event)) continue;
    const e = r.event as AnalyticsEventName;
    out[e].events += 1;
    if (r.anon_id) {
      const s = seen.get(e) ?? new Set<string>();
      s.add(r.anon_id);
      seen.set(e, s);
    }
  }
  for (const e of ANALYTICS_EVENTS) {
    // Server-side events (purchase) have no anon id; count events as visitors there.
    out[e].visitors = seen.get(e)?.size ?? out[e].events;
  }
  return out;
}
