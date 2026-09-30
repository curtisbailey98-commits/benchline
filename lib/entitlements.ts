import { getProductById } from "./products";
import { addMonths } from "./pro-access";

export type OrderItemEntitlement = {
  download_key: string | null;
  download_keys?: string[] | null;
};

export type EntitlementOrder = {
  status: string;
  user_id?: string | null;
  email?: string | null;
  order_items?: OrderItemEntitlement[] | null;
};

export const PAID_STATUSES = new Set(["paid", "fulfilled"]);

/** All kit keys an order item unlocks (supports legacy single download_key rows). */
export function itemDownloadKeys(item: OrderItemEntitlement): string[] {
  const keys = new Set<string>();
  if (item.download_key) keys.add(item.download_key);
  for (const k of item.download_keys ?? []) if (k) keys.add(k);
  return [...keys];
}

/**
 * True when the order is paid, belongs to the user (by id or email), and one of its
 * items unlocks `downloadKey`.
 */
export function orderGrantsDownload(
  order: EntitlementOrder | null | undefined,
  user: { id: string; email?: string | null },
  downloadKey: string
): boolean {
  if (!order || !PAID_STATUSES.has(order.status)) return false;
  const owns =
    (order.user_id && order.user_id === user.id) ||
    (Boolean(order.email) && Boolean(user.email) && order.email!.toLowerCase() === user.email!.toLowerCase());
  if (!owns) return false;
  return (order.order_items ?? []).some((item) => itemDownloadKeys(item).includes(downloadKey));
}

export type OrderItemInsert = {
  order_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_amount_cents: number;
  download_key: string | null;
  download_keys: string[];
  stripe_price_id: string | null;
};

/**
 * Builds order_items rows for a paid checkout session. Unknown product ids are kept
 * for the record (product_id null so the FK can't fail) but grant no downloads.
 */
export function buildOrderItems(
  orderId: string,
  lines: Array<{ productId: string; quantity: number }>,
  priceIds: Map<string, string> = new Map()
): OrderItemInsert[] {
  return lines.map(({ productId, quantity }) => {
    const product = getProductById(productId);
    return {
      order_id: orderId,
      product_id: product?.id ?? null,
      product_name: product?.name ?? productId,
      quantity,
      unit_amount_cents: product?.priceCents ?? 0,
      download_key: product?.downloadKeys[0] ?? null,
      download_keys: product?.downloadKeys ?? [],
      stripe_price_id: priceIds.get(productId) ?? null,
    };
  });
}

/**
 * For one-time purchases that include prepaid Pro months (Core + 3 Months Pro),
 * returns when that Pro access ends: purchase time + N months. Null otherwise.
 */
export function bundleProAccessUntil(
  lines: Array<{ productId: string }>,
  paidAt: Date
): Date | null {
  const months = lines.reduce((max, l) => Math.max(max, getProductById(l.productId)?.proMonths ?? 0), 0);
  return months > 0 ? addMonths(paidAt, months) : null;
}
