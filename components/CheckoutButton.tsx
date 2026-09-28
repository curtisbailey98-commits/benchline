"use client";

import { useState } from "react";
import { useCart } from "./CartProvider";

export function CheckoutButton() {
  const { lines, itemCount } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function checkout() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Checkout failed");
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
