"use client";

import React, { useState } from "react";
import { useCart } from "@/context/CartContext";

interface ProductDetailAddToCartProps {
  product: {
    id: number;
    name: string;
    slug: string;
    price: number;
    image?: string;
    stock: number;
  };
}

export default function ProductDetailAddToCart({ product }: ProductDetailAddToCartProps) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const inStock = product.stock > 0;

  const decrement = () => setQuantity((q) => Math.max(1, q - 1));
  const increment = () => setQuantity((q) => Math.min(product.stock, q + 1));

  const handleAddToCart = () => {
    if (!inStock) return;
    const success = addToCart(product, quantity);
    if (success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    }
  };

  return (
    <div className="mt-auto space-y-4">
      {/* Quantity Selector */}
      {inStock && (
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Qty
          </span>
          <div className="inline-flex items-center border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
            <button
              onClick={decrement}
              disabled={quantity <= 1}
              className="px-3 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              −
            </button>
            <span className="px-4 py-2 text-sm font-semibold text-zinc-900 dark:text-white min-w-[48px] text-center border-x border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
              {quantity}
            </span>
            <button
              onClick={increment}
              disabled={quantity >= product.stock}
              className="px-3 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              +
            </button>
          </div>
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            / {product.stock} available
          </span>
        </div>
      )}

      {/* Add to Cart Button */}
      <button
        onClick={handleAddToCart}
        disabled={!inStock}
        className={`w-full px-6 py-4 rounded-2xl text-sm font-bold transform transition-all cursor-pointer flex items-center justify-center shadow-md hover:shadow-lg ${added
          ? "bg-emerald-600 text-white scale-[0.98]"
          : inStock
            ? "bg-gradient-to-r from-zinc-900 to-zinc-800 dark:from-white dark:to-zinc-100 text-white dark:text-zinc-950 hover:opacity-95 active:scale-[0.98]"
            : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed"
          }`}
      >
        {added ? (
          <span className="flex items-center justify-center gap-2 w-full text-white">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 animate-bounce">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            Added to Cart!
          </span>
        ) : inStock ? (
          <span className="flex items-center justify-center gap-2 w-full">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
            </svg>
            Add to Cart
          </span>
        ) : (
          <span className="w-full text-center">Out of Stock</span>
        )}
      </button>
    </div>
  );
}
