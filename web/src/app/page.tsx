import { HomeClient } from "@/components/HomeClient";
import { getCatalogWines } from "@/lib/catalog";
import { fetchPacks } from "@/lib/packs";
import { SITE_URL } from "@/lib/site";

// Catalog and packs are fetched on the server so the initial HTML already
// contains the wines (SEO); filters then run on the client.
export const revalidate = 300;

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "VinoArgentino.es",
    url: SITE_URL,
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "VinoArgentino.es",
    url: SITE_URL,
  },
];

export default async function Home() {
  const [wines, packs] = await Promise.all([getCatalogWines(), fetchPacks()]);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <HomeClient wines={wines} packs={packs} />
    </>
  );
}
