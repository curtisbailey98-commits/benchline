"use client";

import { useState } from "react";
import { anonId, track } from "@/lib/track-client";
import { useCart } from "./CartProvider";

export function CheckoutButton() {
  const { lines, itemCount } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function checkout() {
    setError(null);
    setLoading(true);
    for (const l of lines) track("checkout_click", { productId: l.productId });
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines, anonId: anonId() }),
      });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(
          res.status === 503
            ? "Checkout isn't open yet. Please check back soon or use the contact form."
            : data.error || "Checkout failed"
        );
      }
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
      setLoading(false);
    }
  }

  if (itemCount === 0) return null;

  return (
    <div className="space-y-3">
      <button
        type="button"
        className="btn btn-primary w-full"
        disabled={loading}
        onClick={checkout}
      >
        {loading ? "Redirecting to Stripe…" : "Checkout securely"}
      </button>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
