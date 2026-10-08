export type Region = "cuyo" | "norte" | "patagonia";
export type WineType = "tinto" | "blanco" | "rosado";

/** Optional editorial fields; any of them can be null (render nothing for a null row). */
export interface ProductDetail {
  grape: string | null;
  subregion: string | null;
  altitude_label: string | null;
  aging_es: string | null;
  aging_en: string | null;
  profile_es: string | null;
  profile_en: string | null;
  pairing_es: string | null;
  pairing_en: string | null;
  serve_temp: string | null;
  why_es: string | null;
  why_en: string | null;
  alcohol: number | null;
  soil_es: string | null;
  soil_en: string | null;
  winemaking_es: string | null;
  winemaking_en: string | null;
  look_es: string | null;
  look_en: string | null;
  nose_es: string | null;
  nose_en: string | null;
  palate_es: string | null;
  palate_en: string | null;
  learn_title_es: string | null;
  learn_title_en: string | null;
  learn_body_es: string | null;
  learn_body_en: string | null;
}

export interface Bodega {
  slug: string;
  name: string;
  location_es: string | null;
  location_en: string | null;
  description_es: string | null;
  description_en: string | null;
  terroir_es: string | null;
  terroir_en: string | null;
  sort_order: number | null;
}

export interface Product extends ProductDetail {
  bodega_slug: string | null;
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
  sku: string;
  bodega_slug: string | null;
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
  // Extra fields for the pack page (all optional: the home only needs the above).
  sku?: string;
  grape?: string | null;
  subregion?: string | null;
  altitude_label?: string | null;
  profile_es?: string | null;
  profile_en?: string | null;
  pairing_es?: string | null;
  pairing_en?: string | null;
  serve_temp?: string | null;
  is_available?: boolean;
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
  proposal_es?: string | null;
  proposal_en?: string | null;
  occasion_es?: string | null;
  occasion_en?: string | null;
  tasting_tip_es?: string | null;
  tasting_tip_en?: string | null;
  items: PackItem[];
}
