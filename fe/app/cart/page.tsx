"use client";

import React from "react";
import Link from "next/link";
import LazyImage from "@/components/LazyImage";
import { useCart } from "@/context/CartContext";

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice } = useCart();

  if (items.length === 0) {
    return (
      <div className="flex-1 bg-zinc-50 dark:bg-zinc-950 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex p-4 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-500 mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Your cart is empty</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">
            Looks like you haven&apos;t added any items to your cart yet.
          </p>
          <Link
            href="/product"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all"
          >
            Browse Products
            <span>→</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-zinc-50 dark:bg-zinc-950 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              href="/product"
              className="inline-flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors mb-2 group"
            >
              <span className="transform group-hover:-translate-x-0.5 transition-transform">←</span>
              Continue Shopping
            </Link>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
              Shopping Cart
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              {totalItems} {totalItems === 1 ? "item" : "items"} in your cart
            </p>
          </div>
          <button
            onClick={clearCart}
            className="text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-red-500 transition-colors cursor-pointer"
          >
            Clear All
          </button>
        </div>

        {/* Cart Items */}
        <div className="space-y-4 mb-8">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 sm:gap-6 bg-white dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/60 rounded-2xl p-4 sm:p-5 shadow-sm transition-colors"
            >
              {/* Product Image */}
              <Link href={`/product/${item.slug}`} className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-900">
                {item.image ? (
                  <LazyImage
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-400 text-xs">No Image</div>
                )}
              </Link>

              {/* Product Info */}
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <Link href={`/product/${item.slug}`} className="font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 hover:text-violet-600 dark:hover:text-violet-400 transition-colors line-clamp-2 mb-1 leading-snug">
                    {item.name}
                  </Link>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    Unit price: ${item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-3 mt-3">
                  <div className="inline-flex items-center border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="px-2.5 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    >
                      −
                    </button>
                    <span className="px-3 py-1 text-xs font-semibold text-zinc-900 dark:text-white min-w-[36px] text-center border-x border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                      className="px-2.5 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-500">
                    / {item.stock} available
                  </span>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-1.5 sm:p-2 rounded-xl text-rose-500 dark:text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer"
                    title="Remove item"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4 sm:w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Line Total */}
              <div className="flex-shrink-0 flex items-center pl-2">
                <span className="text-base sm:text-lg font-bold text-amber-500 dark:text-amber-400 drop-shadow-sm">
                  ${(item.price * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/60 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Order Summary</h2>
          <div className="space-y-3 border-b border-zinc-100 dark:border-zinc-800 pb-4 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500 dark:text-zinc-400">Subtotal ({totalItems} items)</span>
              <span className="font-semibold text-zinc-900 dark:text-white">
                ${totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500 dark:text-zinc-400">Shipping</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">Free</span>
            </div>
          </div>
          <div className="flex justify-between items-center mb-6">
            <span className="text-base font-bold text-zinc-900 dark:text-white">Total</span>
            <span className="text-xl font-extrabold text-transparent bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text">
              ${totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <button className="w-full px-8 py-3.5 rounded-xl text-sm font-semibold bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 active:scale-[0.98] transform transition-all cursor-pointer">
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
}
