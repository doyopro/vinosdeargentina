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

export interface CartItem extends CatalogWine {
  qty: number; // boxes
  /** Line kind (sent to the server as `type`); packs will reuse { id, qty }. Defaults to "product". */
  kind?: "product" | "pack";
}

export type Cart = Record<string, CartItem>;
