"use client";

import { useState } from "react";
import { useCart } from "./CartProvider";

export function AbandonedCartCapture() {
  const { lines, itemCount } = useCart();
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  if (itemCount === 0) return null;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!consent || !email) return;
    setStatus("saving");
    try {
      const res = await fetch("/api/cart-abandonment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, consent, cart: lines }),
      });
      if (!res.ok) throw new Error("Failed");
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={save} className="card mt-6 space-y-3 border-amber/20">
      <h3 className="text-sm font-semibold">Save your cart</h3>
      <p className="text-xs text-muted">
        Optional: leave your email and we&apos;ll remind you if you don&apos;t finish checkout.
        We only email with your consent.
      </p>
      <input
        type="email"
        required
        className="input"
        placeholder="you@business.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <label className="flex items-start gap-2 text-xs text-muted">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
        />
        <span>I consent to Benchline emailing me about this cart.</span>
      </label>
      <button
        type="submit"
        className="btn btn-ghost w-full !py-2 text-sm"
        disabled={!consent || status === "saving"}
      >
        {status === "saving" ? "Saving…" : status === "saved" ? "Saved" : "Save cart email"}
      </button>
      {status === "error" ? (
        <p className="text-xs text-danger">Could not save — try again later.</p>
      ) : null}
    </form>
  );
}
