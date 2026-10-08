export type Region = "cuyo" | "norte" | "patagonia";
export type WineType = "tinto" | "blanco" | "rosado";

export interface Product {
  id: string;
  sku: string;
  name: string;
  bodega: string;
  region: Region;
  type: WineType;
  price_retail: number;
  aiem_rate: number;
  igic_rate: number;
  box_size: number;
  notes_es: string | null;
  notes_en: string | null;
  stock: number;
  image_url: string | null;
  created_at: string;
  is_available: boolean;
  is_featured: boolean;
  sort_order: number | null;
}

// Shape kept identical to the original catalogData / cart item built by index.html
export interface CatalogWine {
  id: string;
  type: WineType;
  region: Region;
  provincia: string;
  box: number;
  price: number; // net price (price_retail / 1.07)
  bodega: string;
  name: string;
  notes_es: string | null;
  notes_en: string | null;
  image_url: string | null;
  is_available: boolean;
  is_featured: boolean;
  sort_order: number | null;
  /** Bottles in stock. JIT business: 0/negative means "pending restock", not a cap. */
  stock?: number | null;
}

/** A wine line: qty = boxes of `box` bottles; `price` is net per bottle. */
export interface WineLine extends CatalogWine {
  qty: number;
  kind?: "product";
}

export interface PackImage {
  src: string;
  alt: string;
}

/** A pack line: qty = packs; `price_retail` is the gross (IGIC incl.) price of ONE whole pack. */
export interface PackLine {
  kind: "pack";
  id: string;
  name: string;
  qty: number;
  bottles: number;
  price_retail: number;
  images: PackImage[];
}

/** Sent to the server as `type` ('product' | 'pack'); packs reuse { id, qty }. */
export type CartItem = WineLine | PackLine;

/** Keyed by lineKey(kind, id) so a pack and a wine with the same id never collide. */
export type Cart = Record<string, CartItem>;

export interface PackProduct {
  id: string;
  name: string;
  type: WineType;
  image_url: string | null;
  price_retail: number;
}

export interface PackItem {
  bottles: number;
  product: PackProduct;
}

export interface Pack {
  id: string;
  slug: string;
  name: string;
  collection: string | null;
  description_es: string | null;
  description_en: string | null;
  price_retail: number;
  is_featured: boolean;
  sort_order: number | null;
  items: PackItem[];
}
