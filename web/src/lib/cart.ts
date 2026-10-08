import { Cart, CartItem } from "./types";

export const CART_STORAGE_KEY = "deAlturaCart";
export const IGIC = 1.07;

export const lineKey = (kind: "product" | "pack", id: string) => `${kind}:${id}`;
export const keyOf = (item: CartItem) => lineKey(item.kind ?? "product", item.id);

/** Net amount of a line. Wines: net bottle price x boxes x bottles per box. Packs: gross pack price / 1.07 x packs. */
export function lineNet(item: CartItem): number {
  if (item.kind === "pack") return (item.price_retail / IGIC) * item.qty;
  return (item.price || 0) * (item.qty || 1) * (item.box || 1);
}

/** Gross (IGIC included) amount of a line. A pack's price is per pack: never multiplied by box size. */
export function lineGross(item: CartItem): number {
  if (item.kind === "pack") return item.price_retail * item.qty;
  return lineNet(item) * IGIC;
}

// Carts saved before packs existed were keyed by bare product id: re-key them.
function normalize(raw: Record<string, CartItem>): Cart {
  const next: Cart = {};
  for (const [k, v] of Object.entries(raw)) {
    const kind = v.kind === "pack" ? "pack" : "product";
    const item = { ...v, kind } as CartItem;
    next[lineKey(kind, v.id ?? k)] = item;
  }
  return next;
}

export function loadCart(): Cart {
  if (typeof window === "undefined") return {};
  try {
    const saved = window.localStorage.getItem(CART_STORAGE_KEY);
    return saved ? normalize(JSON.parse(saved)) : {};
  } catch {
    return {};
  }
}

export function saveCart(cart: Cart): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}
