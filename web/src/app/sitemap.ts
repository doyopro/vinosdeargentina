import type { MetadataRoute } from "next";
import { getBodegas, getProducts } from "@/lib/catalog";
import { fetchPacks } from "@/lib/packs";
import { SITE_URL } from "@/lib/site";

export const revalidate = 300;

const LEGAL = ["aviso-legal", "privacidad", "cookies", "condiciones-de-compra", "envios-y-devoluciones"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, bodegas, packs] = await Promise.all([getProducts(), getBodegas(), fetchPacks()]);
  const now = new Date();
  return [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    ...products.map((p) => ({ url: `${SITE_URL}/vino/${p.sku}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...packs.map((p) => ({ url: `${SITE_URL}/pack/${p.slug}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.7 })),
    { url: `${SITE_URL}/bodegas`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    ...bodegas.map((b) => ({ url: `${SITE_URL}/bodegas/${b.slug}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.6 })),
    ...LEGAL.map((slug) => ({ url: `${SITE_URL}/${slug}`, lastModified: now, changeFrequency: "yearly" as const, priority: 0.2 })),
  ];
}
