"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { track } from "@/lib/track-client";

/** Records a first-party page_view on every route change. */
export function PageViewTracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname) track("page_view");
  }, [pathname]);
  return null;
}

/** Records pricing_viewed once, when the wrapped section scrolls into view. */
export function PricingViewTracker({ children, id }: { children: ReactNode; id?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    let sent = false;
    const io = new IntersectionObserver(
      (entries) => {
        if (!sent && entries.some((e) => e.isIntersecting)) {
          sent = true;
          track("pricing_viewed");
          io.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} id={id} className="scroll-mt-20">
      {children}
    </div>
  );
}
