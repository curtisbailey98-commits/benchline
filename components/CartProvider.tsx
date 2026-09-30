"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { calculateCartTotals, type CartLine } from "@/lib/pricing";

const STORAGE_KEY = "benchline_cart_v1";

type CartContextValue = {
  lines: CartLine[];
  addItem: (productId: string, quantity?: number) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  itemCount: number;
  subtotalCents: number;
};

/** One line per product, quantity 1 (older carts could hold quantities > 1). */
function normalizeCart(parsed: CartLine[]): CartLine[] {
  const seen = new Set<string>();
  const out: CartLine[] = [];
  for (const l of parsed) {
    if (!l || typeof l.productId !== "string" || seen.has(l.productId)) continue;
    seen.add(l.productId);
    out.push({ productId: l.productId, quantity: 1 });
  }
  return out;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartLine[];
        // Hydrating from localStorage must happen after mount (not available during SSR).
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (Array.isArray(parsed)) setLines(parsed);
      }
    } catch {
      // ignore corrupt storage
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  // Every product is a single-business license or one membership, so quantity is always 1.
  const addItem = useCallback((productId: string, _quantity = 1) => {
    void _quantity;
    setLines((prev) =>
      prev.some((l) => l.productId === productId) ? prev : [...prev, { productId, quantity: 1 }]
    );
  }, []);

  const removeItem = useCallback((productId: string) => {
    setLines((prev) => prev.filter((l) => l.productId !== productId));
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity < 1) {
      setLines((prev) => prev.filter((l) => l.productId !== productId));
      return;
    }
    setLines((prev) => prev.map((l) => (l.productId === productId ? { ...l, quantity: 1 } : l)));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const normalized = useMemo(() => normalizeCart(lines), [lines]);
  const totals = useMemo(() => calculateCartTotals(normalized), [normalized]);

  const value = useMemo(
    () => ({
      lines: normalized,
      addItem,
      removeItem,
      setQuantity,
      clear,
      itemCount: totals.itemCount,
      subtotalCents: totals.subtotalCents,
    }),
    [normalized, addItem, removeItem, setQuantity, clear, totals]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
