"use client";

import Link from "next/link";
import { useState } from "react";
import { LogoMark } from "./Logo";
import { useCart } from "./CartProvider";

const NAV = [
  { href: "/shop", label: "Shop" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#faq", label: "FAQ" },
  { href: "/account", label: "Account" },
];

export function Header() {
  const { itemCount } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-bg/90 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="shrink-0" onClick={() => setOpen(false)}>
          <LogoMark />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-muted transition hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
          <Link href="/cart" className="btn btn-primary !py-2 !px-4 text-sm">
            Cart{itemCount > 0 ? ` (${itemCount})` : ""}
          </Link>
        </nav>

        <button
          type="button"
          className="btn btn-secondary !px-3 !py-2 md:hidden"
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {open ? (
        <div className="border-t border-border bg-bg-elevated md:hidden">
          <div className="container-page flex flex-col gap-1 py-3">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2.5 text-sm text-muted hover:bg-bg-card hover:text-foreground"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/cart"
              className="btn btn-primary mt-2"
              onClick={() => setOpen(false)}
            >
              Cart{itemCount > 0 ? ` (${itemCount})` : ""}
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
