"use client";

import { useState } from "react";
import { useCart } from "./CartProvider";

export function AddToCartButton({
  productId,
  label = "Add to cart",
  className = "btn btn-primary w-full",
}: {
  productId: string;
  label?: string;
  className?: string;
}) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        addItem(productId, 1);
        setAdded(true);
        setTimeout(() => setAdded(false), 1600);
      }}
    >
      {added ? "Added ✓" : label}
    </button>
  );
}
