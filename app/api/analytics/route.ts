import { NextResponse } from "next/server";
import { sanitizeAnalyticsEvent } from "@/lib/analytics";
import { recordAnalyticsEvent } from "@/lib/analytics-server";

/**
 * First-party analytics sink. Accepts only page_view / pricing_viewed /
 * checkout_click from the browser; checkout_started and purchase are recorded
 * server-side. Stores no PII (see lib/analytics.ts).
 */
export async function POST(request: Request) {
  // Only accept same-site beacons.
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) return new NextResponse(null, { status: 403 });
    } catch {
      return new NextResponse(null, { status: 403 });
    }
  }

  let body: unknown;
  try {
    body = JSON.parse(await request.text());
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const row = sanitizeAnalyticsEvent(body);
  if (!row) return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  await recordAnalyticsEvent(row);
  return new NextResponse(null, { status: 204 });
}
