import type { MetadataRoute } from "next";
import { PRODUCTS } from "@/lib/products";
import { TRADES } from "@/lib/trades";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  const paths = [
    "/",
    "/shop",
    ...TRADES.map((t) => `/for/${t.landingSlug}`),
    ...PRODUCTS.map((p) => `/shop/${p.slug}`),
    "/contact",
    "/terms",
    "/privacy",
    "/refunds",
    "/shipping",
  ];
  return paths.map((p) => ({ url: `${base}${p}` }));
}
