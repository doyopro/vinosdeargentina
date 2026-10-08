import { getProvinciaBodega } from "./bodegaProvincia";
import { CatalogWine, Product } from "./types";

export const toCatalogWine = (p: Product): CatalogWine => ({
  id: p.id,
  sku: p.sku,
  bodega_slug: p.bodega_slug,
  type: p.type,
  region: p.region,
  provincia: getProvinciaBodega(p.bodega),
  box: p.box_size,
  price: (p.price_retail || 0) / 1.07,
  bodega: p.bodega,
  name: p.name,
  notes_es: p.notes_es,
  notes_en: p.notes_en,
  image_url: p.image_url,
  is_available: p.is_available,
  is_featured: p.is_featured,
  sort_order: p.sort_order,
  stock: p.stock,
});

// Available wines first; within each group featured on top, then sort_order
// (nulls last), then name. Unavailable wines always sink to the end.
export const byCatalogPriority = (a: CatalogWine, b: CatalogWine) =>
  Number(b.is_available) - Number(a.is_available) ||
  Number(b.is_featured) - Number(a.is_featured) ||
  (a.sort_order ?? Infinity) - (b.sort_order ?? Infinity) ||
  a.name.localeCompare(b.name);
