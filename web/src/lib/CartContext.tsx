"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { Cart, CartItem, CatalogWine } from "./types";
import { loadCart, saveCart } from "./cart";

// Max boxes for a line: only capped when there is real positive stock (in
// bottles). The business is JIT (stock 0/negative = pending restock), so a
// non-positive or missing stock means no cap.
export function maxQtyFor(item: Pick<CartItem, "stock" | "box">): number {
  const stock = item.stock;
  if (typeof stock !== "number" || stock <= 0) return Infinity;
  return Math.max(1, Math.floor(stock / (item.box || 1)));
}

interface CartContextValue {
  cart: Cart;
  items: CartItem[];
  /** Total boxes in the cart. */
  count: number;
  /** False until the persisted cart has been read from localStorage. */
  hydrated: boolean;
  /** Catalog +/- semantics: adds a line if missing, deletes the line when it hits 0. */
  add: (wine: CatalogWine, change: number) => void;
  /** Drawer/checkout semantics: sets boxes clamped to [1, max]. */
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read persisted cart once after mount (localStorage is client-only)
    setCart(loadCart());
    setHydrated(true);
  }, []);

  const commit = useCallback((updater: (prev: Cart) => Cart) => {
    setCart((prev) => {
      const next = updater(prev);
      if (next !== prev) saveCart(next);
      return next;
    });
  }, []);

  const add = useCallback(
    (wine: CatalogWine, change: number) =>
      commit((prev) => {
        if (change > 0 && !wine.is_available) return prev;
        const current = prev[wine.id];
        const qty = (current ? current.qty : 0) + change;
        const next = { ...prev };
        if (qty <= 0) {
          delete next[wine.id];
        } else {
          const base = current ?? { ...wine, qty: 0, kind: "product" as const };
          next[wine.id] = { ...base, qty: Math.min(qty, maxQtyFor(base)) };
        }
        return next;
      }),
    [commit]
  );

  const setQty = useCallback(
    (id: string, qty: number) =>
      commit((prev) => {
        const current = prev[id];
        if (!current) return prev;
        const clamped = Math.min(Math.max(1, qty), maxQtyFor(current));
        return clamped === current.qty ? prev : { ...prev, [id]: { ...current, qty: clamped } };
      }),
    [commit]
  );

  const remove = useCallback(
    (id: string) =>
      commit((prev) => {
        if (!prev[id]) return prev;
        const next = { ...prev };
        delete next[id];
        return next;
      }),
    [commit]
  );

  const clear = useCallback(() => commit(() => ({})), [commit]);

  const value = useMemo<CartContextValue>(() => {
    const items = Object.values(cart);
    return {
      cart,
      items,
      count: items.reduce((sum, i) => sum + i.qty, 0),
      hydrated,
      add,
      setQty,
      remove,
      clear,
    };
  }, [cart, hydrated, add, setQty, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
