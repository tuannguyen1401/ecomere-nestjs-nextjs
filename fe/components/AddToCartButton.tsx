"use client";

import React, { useState } from "react";
import { useCart } from "@/context/CartContext";

interface AddToCartButtonProps {
  product: {
    id: number;
    name: string;
    slug: string;
    price: number;
    image?: string;
    stock: number;
  };
}

export default function AddToCartButton({ product }: AddToCartButtonProps) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent Link navigation when clicking button
    e.stopPropagation();
    if (product.stock <= 0) return;

    const success = addToCart(product, 1);
    if (success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 4000); // Maintain click state and glow for 4 seconds
    }
  };

  if (product.stock <= 0) return null;

  return (
    <button
      onClick={handleClick}
      className={`p-2 rounded-xl transition-all duration-300 cursor-pointer border ${added
        ? "bg-emerald-500 border-emerald-400 text-white scale-110 shadow-[0_0_15px_rgba(16,185,129,0.6)] ring-2 ring-emerald-400/50"
        : "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-400 hover:border-violet-500/55 dark:hover:border-violet-500/55 hover:bg-violet-50 dark:hover:bg-violet-950/20 hover:text-violet-600 dark:hover:text-violet-400 hover:shadow-[0_0_10px_rgba(124,58,237,0.15)]"
        }`}
      title={added ? "Added!" : "Add to Cart"}
    >
      {added ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          className="w-4 h-4 animate-bounce"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-4 h-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
          />
        </svg>
      )}
    </button>
  );
}
