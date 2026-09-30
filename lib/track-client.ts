"use client";

import type { AnalyticsEventName } from "./analytics";

const ANON_KEY = "bl_anon";

/** Random per-tab id (sessionStorage, no cookie). Not linked to any person. */
export function anonId(): string | null {
  try {
    let id = sessionStorage.getItem(ANON_KEY);
    if (!id) {
      id = (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)).replace(/-/g, "").slice(0, 24);
      sessionStorage.setItem(ANON_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

/** Fire-and-forget first-party event. Never throws, never blocks navigation. */
export function track(event: AnalyticsEventName, data: { productId?: string; valueCents?: number } = {}) {
  try {
    const body = JSON.stringify({
      event,
      path: window.location.pathname,
      referrer: document.referrer || null,
      anonId: anonId(),
      ...data,
    });
    const blob = new Blob([body], { type: "application/json" });
    if (!navigator.sendBeacon?.("/api/analytics", blob)) {
      void fetch("/api/analytics", { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } });
    }
  } catch {
    // analytics must never break the page
  }
}
