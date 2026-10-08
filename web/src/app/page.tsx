import { HomeClient } from "@/components/HomeClient";
import { getCatalogWines } from "@/lib/catalog";
import { fetchPacks } from "@/lib/packs";

// Catalog and packs are fetched on the server so the initial HTML already
// contains the wines (SEO); filters then run on the client.
export const revalidate = 300;

export default async function Home() {
  const [wines, packs] = await Promise.all([getCatalogWines(), fetchPacks()]);
  return <HomeClient wines={wines} packs={packs} />;
}
