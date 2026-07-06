"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface CartItem {
  id: number;
  name: string;
  slug: string;
  price: number;
  image?: string;
  quantity: number;
  stock: number;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: "success" | "error" | "warning";
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Omit<CartItem, "quantity">, quantity?: number) => boolean;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => boolean;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  toasts: ToastMessage[];
  addToast: (message: string, type?: ToastMessage["type"]) => void;
  removeToast: (id: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "ag-store-cart";

function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Helper to add toast
  const addToast = useCallback((message: string, type: ToastMessage["type"] = "warning") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // Helper to remove toast
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Load cart from localStorage on mount
  useEffect(() => {
    setItems(loadCart());
    setHydrated(true);
  }, []);

  // Persist to localStorage whenever items change (after hydration)
  useEffect(() => {
    if (hydrated) {
      saveCart(items);
    }
  }, [items, hydrated]);

  const addToCart = useCallback((product: Omit<CartItem, "quantity">, quantity: number = 1) => {
    const existing = items.find((item) => item.id === product.id);
    const currentQty = existing ? existing.quantity : 0;
    const requestedQty = currentQty + quantity;

    if (requestedQty > product.stock) {
      const remaining = product.stock - currentQty;
      if (remaining <= 0) {
        addToast(
          `Cannot add more! You already have the maximum available stock (${product.stock} items) of "${product.name}" in your cart.`,
          "warning"
        );
      } else {
        addToast(
          `Only ${product.stock} items available in stock. You already have ${currentQty} in your cart, so you can only add up to ${remaining} more.`,
          "warning"
        );
      }
      return false;
    }

    setItems((prev) => {
      const exist = prev.find((item) => item.id === product.id);
      if (exist) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: requestedQty } : item
        );
      }
      return [...prev, { ...product, quantity }];
    });
    addToast(`Successfully added "${product.name}" to cart!`, "success");
    return true;
  }, [items, addToast]);

  const removeFromCart = useCallback((productId: number) => {
    const item = items.find((i) => i.id === productId);
    setItems((prev) => prev.filter((item) => item.id !== productId));
    if (item) {
      addToast(`Removed "${item.name}" from cart.`, "success");
    }
  }, [items, addToast]);

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    const item = items.find((i) => i.id === productId);
    if (!item) return false;

    if (quantity > item.stock) {
      addToast(
        `Cannot set quantity to ${quantity}. Only ${item.stock} items are available in stock for "${item.name}".`,
        "warning"
      );
      return false;
    }

    if (quantity <= 0) {
      setItems((prev) => prev.filter((item) => item.id !== productId));
      addToast(`Removed "${item.name}" from cart.`, "success");
      return true;
    }

    setItems((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
    return true;
  }, [items, addToast]);

  const clearCart = useCallback(() => {
    setItems([]);
    addToast("Cart cleared.", "success");
  }, [addToast]);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        toasts,
        addToast,
        removeToast,
      }}
    >
      {children}

      {/* Global Toast Container */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes toast-slide-in {
            from {
              transform: translateY(1.5rem);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
          .animate-toast-slide-in {
            animation: toast-slide-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        `}} />
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-lg border backdrop-blur-md transition-all duration-300 transform translate-y-0 animate-toast-slide-in ${
              toast.type === "success"
                ? "bg-emerald-500/10 dark:bg-emerald-950/20 border-emerald-500/20 dark:border-emerald-800/30 text-emerald-800 dark:text-emerald-300"
                : toast.type === "error"
                ? "bg-rose-500/10 dark:bg-rose-950/20 border-rose-500/20 dark:border-rose-800/30 text-rose-800 dark:text-rose-300"
                : "bg-amber-500/10 dark:bg-amber-950/20 border-amber-500/20 dark:border-amber-800/30 text-amber-800 dark:text-amber-300"
            }`}
          >
            {/* Icon */}
            <span className="flex-shrink-0 mt-0.5">
              {toast.type === "success" && (
                <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {toast.type === "error" && (
                <svg className="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {toast.type === "warning" && (
                <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
            </span>

            {/* Message */}
            <div className="flex-1 text-xs font-semibold leading-relaxed">
              {toast.message}
            </div>

            {/* Close Button */}
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
