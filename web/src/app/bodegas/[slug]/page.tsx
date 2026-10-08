import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/SiteShell";
import { BodegaHeader } from "@/components/BodegaHeader";
import { BodegaWines } from "@/components/BodegaWines";
import { getBodega, getBodegas, getWinesByBodega } from "@/lib/catalog";
import { SITE_URL } from "@/lib/site";

export const revalidate = 300;

export async function generateStaticParams() {
  return (await getBodegas()).map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const b = await getBodega(slug);
  if (!b) return { title: "Bodega no encontrada" };
  const title = `${b.name} | Bodegas · Vinos de Altura`;
  const description = (b.description_es || `Vinos de ${b.name}${b.location_es ? `, ${b.location_es}` : ""}.`).slice(0, 158);
  return {
    title,
    description,
    alternates: { canonical: `/bodegas/${b.slug}` },
    openGraph: { type: "website", title, description, url: `${SITE_URL}/bodegas/${b.slug}` },
  };
}

export default async function BodegaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [bodega, wines] = await Promise.all([getBodega(slug), getWinesByBodega(slug)]);
  if (!bodega) notFound();

  return (
    <SiteShell>
      <div className="bg-stone-50">
        <div className="max-w-6xl mx-auto px-5 py-10 md:py-16">
          <BodegaHeader bodega={bodega} count={wines.length} />
          <BodegaWines wines={wines} />
        </div>
      </div>
    </SiteShell>
  );
}
