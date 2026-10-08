"use client";

import { useState } from "react";
import { useCart } from "@/lib/CartContext";
import { CartDrawer } from "@/components/CartDrawer";

// Floating cart button + drawer, shared by every page.
export function CartFab() {
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Cart"
        className="fixed bottom-6 right-6 z-50 bg-wine-900 hover:bg-wine-800 text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 border border-wine-700 group"
      >
        <svg className="w-6 h-6 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        {count > 0 && (
          <span className="absolute -top-1 -right-1 bg-gold-500 text-wine-900 text-[10px] font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-wine-900">
            {count}
          </span>
        )}
      </button>
      <CartDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}
