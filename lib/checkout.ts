import { z } from "zod";
import { getProductById, type Product } from "./products";

export const checkoutBodySchema = z.object({
  lines: z
    .array(
      z.object({
        productId: z.string().min(1).max(64),
        quantity: z.number().int().min(1).max(20),
      })
    )
    .min(1)
    .max(30),
  customerEmail: z.string().email().optional(),
});

export type ValidatedCheckout =
  | {
      ok: true;
      lines: Array<{ product: Product; quantity: number }>;
      customerEmail?: string;
    }
  | { ok: false; status: 400; error: string };

/**
 * Validates a cart payload before any Stripe call. Unknown product ids are
 * rejected (not silently dropped) so a stale cart can't check out partially.
 * Duplicate lines are merged and quantity is capped at 1: every product is a
 * single-business digital license or one membership seat.
 */
export function validateCheckoutPayload(json: unknown): ValidatedCheckout {
  const parsed = checkoutBodySchema.safeParse(json);
  if (!parsed.success) {
    return { ok: false, status: 400, error: "Invalid cart payload" };
  }

  const unknown = parsed.data.lines
    .map((l) => l.productId)
    .filter((id) => !getProductById(id));
  if (unknown.length > 0) {
    return { ok: false, status: 400, error: `Unknown product(s): ${[...new Set(unknown)].join(", ")}` };
  }

  const merged = new Map<string, number>();
  for (const line of parsed.data.lines) {
    merged.set(line.productId, (merged.get(line.productId) ?? 0) + line.quantity);
  }

  // Every product is a single-license digital item or a single membership seat.
  const lines = [...merged.keys()].map((id) => ({ product: getProductById(id)!, quantity: 1 }));

  return { ok: true, lines, customerEmail: parsed.data.customerEmail };
}

/** Encodes cart lines for Stripe session metadata (500-char limit per value). */
export function encodeLinesMetadata(lines: Array<{ product: Pick<Product, "id">; quantity: number }>): string {
  return lines.map((l) => `${l.product.id}:${l.quantity}`).join(",").slice(0, 500);
}

export function decodeLinesMetadata(
  metadata: Record<string, string> | null | undefined
): Array<{ productId: string; quantity: number }> {
  const raw = metadata?.lines;
  if (raw) {
    return raw
      .split(",")
      .map((pair) => {
        const [productId, qty] = pair.split(":");
        const quantity = Math.max(1, Math.floor(Number(qty) || 1));
        return { productId: productId?.trim() ?? "", quantity };
      })
      .filter((l) => l.productId);
  }
  // Legacy sessions only carried product_ids.
  return (metadata?.product_ids || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((productId) => ({ productId, quantity: 1 }));
}

/**
 * Text shown above Stripe Checkout's pay button so renewal terms are visible at
 * the moment of purchase. Returns null when nothing needs disclosing.
 */
export function checkoutDisclosure(lines: Array<{ product: Pick<Product, "billing" | "proMonths" | "priceCents"> }>): string | null {
  const parts: string[] = [];
  const recurring = lines.find((l) => l.product.billing === "recurring");
  if (recurring) {
    parts.push(
      `Benchline Pro renews automatically at $${(recurring.product.priceCents / 100).toFixed(0)}/month until you cancel. Cancel anytime from your Benchline account.`
    );
  }
  const prepaid = lines.find((l) => (l.product.proMonths ?? 0) > 0);
  if (prepaid) {
    parts.push(`Includes ${prepaid.product.proMonths} prepaid months of Benchline Pro. They do not auto-renew.`);
  }
  if (parts.length === 0) return null;
  parts.push("Digital products sold by Kaivaryn LLC. See the Benchline Terms and Refund Policy.");
  return parts.join(" ");
}

/** Benchline shares a Stripe account; only sessions created by our checkout route carry this marker. */
export function isBenchlineSession(session: { metadata?: Record<string, string> | null }): boolean {
  return session.metadata?.source === "benchline";
}
