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
        style={{ bottom: "max(1.5rem, calc(env(safe-area-inset-bottom) + 1rem))" }}
        className="fixed right-4 sm:right-6 z-50 bg-brand-900 hover:bg-brand-800 text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 border border-brand-700 group"
      >
        <svg className="w-6 h-6 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        {count > 0 && (
          <span className="absolute -top-1 -right-1 bg-sun-500 text-brand-900 text-[10px] font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-brand-900">
            {count}
          </span>
        )}
      </button>
      <CartDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}
