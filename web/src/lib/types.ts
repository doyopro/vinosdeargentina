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
}

export interface CartItem extends CatalogWine {
  qty: number;
}

export type Cart = Record<string, CartItem>;
