"use client";

import Link from "next/link";
import { useState } from "react";

/** Opens the Stripe Customer Portal (update card / cancel Pro). */
export function ManageBillingButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function open() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing-portal", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error || "Couldn't open billing management.");
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't open billing management.");
      setLoading(false);
    }
  }

  return (
    <div>
      <button type="button" className="btn btn-secondary !py-2 text-sm" onClick={open} disabled={loading}>
        {loading ? "Opening…" : "Manage billing / cancel"}
      </button>
      {error ? (
        <p className="mt-2 text-sm text-danger">
          {error} <Link href="/contact" className="underline">Contact support</Link>
        </p>
      ) : null}
    </div>
  );
}
