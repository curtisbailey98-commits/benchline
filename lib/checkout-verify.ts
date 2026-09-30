/**
 * Classifies a retrieved Stripe Checkout Session for the success page.
 * Pure (unit tested). The success page only shows "Your back office is ready."
 * for "confirmed" — fulfillment itself is still done by the webhook.
 */
export type SessionLike = {
  status?: string | null; // "open" | "complete" | "expired"
  payment_status?: string | null; // "paid" | "unpaid" | "no_payment_required"
  mode?: string | null;
  subscription?: string | { status?: string | null } | null;
};

export type CheckoutVerification = "confirmed" | "processing" | "not_confirmed";

export const SESSION_ID_PATTERN = /^cs_(test|live)_[A-Za-z0-9]{10,200}$/;

export function isValidSessionId(id: unknown): id is string {
  return typeof id === "string" && SESSION_ID_PATTERN.test(id);
}

export function classifyCheckoutSession(session: SessionLike | null | undefined): CheckoutVerification {
  if (!session || session.status !== "complete") return "not_confirmed";
  if (session.payment_status === "paid" || session.payment_status === "no_payment_required") {
    return "confirmed";
  }
  const sub = session.subscription;
  if (sub && typeof sub === "object" && (sub.status === "active" || sub.status === "trialing")) {
    return "confirmed";
  }
  if (session.payment_status === "unpaid") return "processing";
  return "not_confirmed";
}
