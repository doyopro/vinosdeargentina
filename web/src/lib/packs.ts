import { supabase } from "./supabase";
import { Pack, PackImage, PackLine, PackProduct } from "./types";

interface PackRow {
  id: string;
  slug: string;
  name: string;
  collection: string | null;
  description_es: string | null;
  description_en: string | null;
  price_retail: number;
  is_featured: boolean;
  sort_order: number | null;
  proposal_es: string | null;
  proposal_en: string | null;
  occasion_es: string | null;
  occasion_en: string | null;
  tasting_tip_es: string | null;
  tasting_tip_en: string | null;
  pack_items: {
    bottles: number;
    products: PackProduct | null;
  }[];
}

// Explicit columns only (anon key). spec_review and cost columns are never selected.
const PACK_SELECT =
  "id, slug, name, collection, description_es, description_en, price_retail, is_featured, sort_order, proposal_es, proposal_en, occasion_es, occasion_en, tasting_tip_es, tasting_tip_en, pack_items(bottles, products(id, sku, name, type, image_url, price_retail, grape, subregion, altitude_label, profile_es, profile_en, pairing_es, pairing_en, serve_temp, is_available))";

const mapPack = (row: PackRow): Pack => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  collection: row.collection,
  description_es: row.description_es,
  description_en: row.description_en,
  price_retail: row.price_retail,
  is_featured: row.is_featured,
  sort_order: row.sort_order,
  proposal_es: row.proposal_es,
  proposal_en: row.proposal_en,
  occasion_es: row.occasion_es,
  occasion_en: row.occasion_en,
  tasting_tip_es: row.tasting_tip_es,
  tasting_tip_en: row.tasting_tip_en,
  items: row.pack_items.filter((pi) => pi.products).map((pi) => ({ bottles: pi.bottles, product: pi.products! })),
});

export async function fetchPacks(): Promise<Pack[]> {
  const { data, error } = await supabase
    .from("packs")
    .select(PACK_SELECT)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error getPacks:", error);
    return [];
  }

  return ((data ?? []) as unknown as PackRow[]).map(mapPack).filter((p) => p.items.length > 0);
}

export async function fetchPack(slug: string): Promise<Pack | null> {
  const { data, error } = await supabase.from("packs").select(PACK_SELECT).eq("slug", slug).eq("is_active", true).maybeSingle();
  if (error) console.error("Error getPack:", error);
  if (!data) return null;
  const pack = mapPack(data as unknown as PackRow);
  return pack.items.length > 0 ? pack : null;
}

// English names by slug (no accents on trio/duo). Unlisted packs fall back to `name`.
const PACK_NAME_EN: Record<string, string> = {
  "cata-argentina-completa": "Complete Argentina Tasting Set",
  "trio-premium": "Premium Trio",
  "trio-llama": "Llama Trio",
  "duo-llama": "Llama Duo",
  "trio-buenos-aires": "Buenos Aires Trio",
  "trio-malbec": "Malbec Trio",
  "12-apostoles": "The 12 Apostles",
  "duo-sombrero": "Sombrero Duo",
  "duo-ilogico": "Ilógico Duo",
  "duo-desierto": "Desert Duo",
};

export const packName = (pack: Pick<Pack, "slug" | "name">, locale: string) =>
  locale === "en" ? PACK_NAME_EN[pack.slug] ?? pack.name : pack.name;

export const packBottleCount = (pack: Pack) => pack.items.reduce((sum, i) => sum + i.bottles, 0);

/** One image per bottle (a product repeated `bottles` times shows up that many times). */
export function packImages(pack: Pack): PackImage[] {
  return pack.items.flatMap((i) =>
    i.product.image_url ? Array.from({ length: i.bottles }, () => ({ src: i.product.image_url!, alt: i.product.name })) : []
  );
}

/** Price of the same bottles bought one by one (gross, IGIC included). */
export const packLoosePrice = (pack: Pack) => pack.items.reduce((sum, i) => sum + i.product.price_retail * i.bottles, 0);

export const toPackLine = (pack: Pack, locale = "es"): Omit<PackLine, "qty" | "kind"> => ({
  id: pack.id,
  name: packName(pack, locale),
  bottles: packBottleCount(pack),
  price_retail: pack.price_retail,
  images: packImages(pack),
});
