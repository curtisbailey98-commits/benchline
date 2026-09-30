"use client";

import Link from "next/link";
import { useState } from "react";
import { anonId, track } from "@/lib/track-client";

/**
 * Sends a single product straight to Stripe Checkout (no cart step).
 * If Stripe isn't configured the API returns 503 and we show a plain message.
 */
export function BuyNowButton({
  productId,
  label,
  className = "btn btn-primary w-full",
  valueCents,
}: {
  productId: string;
  label: string;
  className?: string;
  valueCents?: number;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setError(null);
    setLoading(true);
    track("checkout_click", { productId, valueCents });
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines: [{ productId, quantity: 1 }], anonId: anonId() }),
      });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(
          res.status === 503
            ? "Checkout isn't open yet. Please check back soon or contact us."
            : data.error || "Checkout failed. Please try again."
        );
      }
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <button type="button" className={className} disabled={loading} onClick={go}>
        {loading ? "Opening secure checkout…" : label}
      </button>
      {error ? (
        <p className="mt-2 text-sm text-danger" role="alert">
          {error}{" "}
          <Link href="/contact" className="underline">
            Contact
          </Link>
        </p>
      ) : null}
    </div>
  );
}
