import { createHmac, timingSafeEqual } from "crypto";
import { KITS } from "./kits";

const DEFAULT_TTL_SECONDS = 60 * 60 * 24; // 24h

function getSecret(): string {
  const secret = process.env.DOWNLOAD_SIGNING_SECRET;
  if (!secret) throw new Error("DOWNLOAD_SIGNING_SECRET is not set");
  return secret;
}

export function signDownloadToken(
  orderId: string,
  productKey: string,
  userId: string,
  ttlSeconds = DEFAULT_TTL_SECONDS
): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `${orderId}:${productKey}:${userId}:${exp}`;
  const sig = createHmac("sha256", getSecret()).update(payload).digest("hex");
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

export function verifyDownloadToken(
  token: string
): { orderId: string; productKey: string; userId: string } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const parts = decoded.split(":");
    if (parts.length !== 5) return null;
    const [orderId, productKey, userId, expStr, sig] = parts;
    const exp = Number(expStr);
    if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return null;

    const payload = `${orderId}:${productKey}:${userId}:${exp}`;
    const expected = createHmac("sha256", getSecret()).update(payload).digest("hex");
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

    return { orderId, productKey, userId };
  } catch {
    return null;
  }
}

/** Download key → source dir + gated ZIP name (ZIPs live in private/downloads/, never public/). */
export const DOWNLOADABLE_PRODUCTS: Record<string, { dir: string; zipName: string; name: string }> =
  Object.fromEntries(
    Object.values(KITS).map((kit) => [
      kit.key,
      { dir: `content/products/${kit.key}`, zipName: kit.zipName, name: kit.name },
    ])
  );
