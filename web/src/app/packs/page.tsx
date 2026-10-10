import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";
import { PacksGrid } from "@/components/PacksGrid";
import { PromoTiers } from "@/components/PromoTiers";
import { PacksCatalogCta, PacksHeading, PacksHero } from "@/components/PacksText";
import { fetchPacks } from "@/lib/packs";
import { SITE_URL } from "@/lib/site";

export const revalidate = 300;

const title = "Packs y ofertas | VinoArgentino.es";
const description = "Packs de selección de vinos argentinos de altura y descuentos por volumen. Retirada gratis en Lanzarote y envío a Canarias.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/packs" },
  openGraph: { type: "website", title, description, url: `${SITE_URL}/packs` },
};

export default async function PacksPage() {
  const packs = await fetchPacks();
  return (
    <SiteShell>
      <div className="bg-stone-50">
        <PacksHero />
        <div className="max-w-6xl mx-auto px-5 py-12 md:py-16 space-y-16">
          <section id="packs" aria-labelledby="packs-title" className="scroll-mt-24">
            <PacksHeading id="packs-title" k="packsTitle" sub="packsSubtitle" />
            <PacksGrid packs={packs} />
          </section>
          <section id="ofertas" aria-labelledby="ofertas-title" className="scroll-mt-24">
            <PacksHeading id="ofertas-title" k="offersTitle" sub="offersSubtitle" />
            <PromoTiers />
          </section>
          <div className="text-center">
            <Link
              href="/#catalog"
              className="inline-block rounded-sm border border-brand-900 px-8 py-4 text-xs font-bold uppercase tracking-widest text-brand-900 hover:bg-brand-900 hover:text-white transition-colors"
            >
              <PacksCatalogCta />
            </Link>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
