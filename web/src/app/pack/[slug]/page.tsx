import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/SiteShell";
import { PackDetail } from "@/components/PackDetail";
import { fetchPack, fetchPacks, packBottleCount } from "@/lib/packs";
import { SITE_URL } from "@/lib/site";

export const revalidate = 300;

export async function generateStaticParams() {
  return (await fetchPacks()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const pack = await fetchPack(slug);
  if (!pack) return { title: "Pack no encontrado" };
  const title = `${pack.name} | VinoArgentino.es`;
  const description = pack.description_es || `${pack.name}: selección de ${packBottleCount(pack)} vinos argentinos.`;
  const image = pack.items.find((i) => i.product.image_url)?.product.image_url ?? undefined;
  return {
    title,
    description,
    alternates: { canonical: `/pack/${pack.slug}` },
    openGraph: { type: "website", title, description, url: `${SITE_URL}/pack/${pack.slug}`, images: image ? [{ url: image, alt: pack.name }] : undefined },
  };
}

export default async function PackPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [pack, all] = await Promise.all([fetchPack(slug), fetchPacks()]);
  if (!pack) notFound();

  const inStock = pack.items.every((i) => i.product.is_available !== false);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: pack.name,
    description: pack.proposal_es || pack.description_es || undefined,
    image: pack.items.map((i) => i.product.image_url).filter(Boolean),
    sku: pack.slug,
    brand: { "@type": "Brand", name: "VinoArgentino.es" },
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/pack/${pack.slug}`,
      seller: { "@type": "Organization", name: "VinoArgentino.es", url: SITE_URL },
      priceCurrency: "EUR",
      price: pack.price_retail,
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <SiteShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <PackDetail pack={pack} others={all.filter((p) => p.id !== pack.id)} />
    </SiteShell>
  );
}
