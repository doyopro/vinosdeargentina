// Server-side catalog data (anon key, explicit columns only: cost/pricing-internal
// columns are not readable by anon and must never be selected here).
import { supabase } from "./supabase";
import { byCatalogPriority, toCatalogWine } from "./catalog-map";
import { Bodega, CatalogWine, Product } from "./types";

export const PRODUCT_COLUMNS =
  "id, sku, name, price_retail, created_at, bodega, bodega_slug, region, type, box_size, aiem_rate, igic_rate, notes_es, notes_en, stock, image_url, is_available, is_featured, sort_order, grape, subregion, altitude_label, aging_es, aging_en, profile_es, profile_en, pairing_es, pairing_en, serve_temp, why_es, why_en";

const BODEGA_COLUMNS = "slug, name, location_es, location_en, description_es, description_en, sort_order";

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase.from("products").select(PRODUCT_COLUMNS);
  if (error) {
    console.error("Error getProducts:", error);
    return [];
  }
  return (data ?? []) as unknown as Product[];
}

export async function getCatalogWines(): Promise<CatalogWine[]> {
  return (await getProducts()).map(toCatalogWine).sort(byCatalogPriority);
}

export async function getProduct(sku: string): Promise<Product | null> {
  const { data, error } = await supabase.from("products").select(PRODUCT_COLUMNS).eq("sku", sku).maybeSingle();
  if (error) console.error("Error getProduct:", error);
  return (data as unknown as Product | null) ?? null;
}

export async function getBodegas(): Promise<Bodega[]> {
  const { data, error } = await supabase.from("bodegas").select(BODEGA_COLUMNS).order("sort_order", { ascending: true });
  if (error) {
    console.error("Error getBodegas:", error);
    return [];
  }
  return (data ?? []) as Bodega[];
}

export async function getBodega(slug: string): Promise<Bodega | null> {
  const { data, error } = await supabase.from("bodegas").select(BODEGA_COLUMNS).eq("slug", slug).maybeSingle();
  if (error) console.error("Error getBodega:", error);
  return (data as Bodega | null) ?? null;
}

export async function getWinesByBodega(slug: string): Promise<CatalogWine[]> {
  const { data, error } = await supabase.from("products").select(PRODUCT_COLUMNS).eq("bodega_slug", slug);
  if (error) {
    console.error("Error getWinesByBodega:", error);
    return [];
  }
  return ((data ?? []) as unknown as Product[]).map(toCatalogWine).sort(byCatalogPriority);
}
