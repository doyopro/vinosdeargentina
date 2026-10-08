import { supabase } from "./supabase";
import { Pack, PackImage, PackLine } from "./types";

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
  pack_items: {
    bottles: number;
    products: { id: string; name: string; type: "tinto" | "blanco" | "rosado"; image_url: string | null; price_retail: number } | null;
  }[];
}

export async function fetchPacks(): Promise<Pack[]> {
  const { data, error } = await supabase
    .from("packs")
    .select(
      "id, slug, name, collection, description_es, description_en, price_retail, is_featured, sort_order, pack_items(bottles, products(id, name, type, image_url, price_retail))"
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error getPacks:", error);
    return [];
  }

  return ((data ?? []) as unknown as PackRow[])
    .map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      collection: row.collection,
      description_es: row.description_es,
      description_en: row.description_en,
      price_retail: row.price_retail,
      is_featured: row.is_featured,
      sort_order: row.sort_order,
      items: row.pack_items
        .filter((pi) => pi.products)
        .map((pi) => ({ bottles: pi.bottles, product: pi.products! })),
    }))
    .filter((p) => p.items.length > 0);
}

export const packBottleCount = (pack: Pack) => pack.items.reduce((sum, i) => sum + i.bottles, 0);

/** One image per bottle (a product repeated `bottles` times shows up that many times). */
export function packImages(pack: Pack): PackImage[] {
  return pack.items.flatMap((i) =>
    i.product.image_url ? Array.from({ length: i.bottles }, () => ({ src: i.product.image_url!, alt: i.product.name })) : []
  );
}

/** Price of the same bottles bought one by one (gross, IGIC included). */
export const packLoosePrice = (pack: Pack) => pack.items.reduce((sum, i) => sum + i.product.price_retail * i.bottles, 0);

export const toPackLine = (pack: Pack): Omit<PackLine, "qty" | "kind"> => ({
  id: pack.id,
  name: pack.name,
  bottles: packBottleCount(pack),
  price_retail: pack.price_retail,
  images: packImages(pack),
});
