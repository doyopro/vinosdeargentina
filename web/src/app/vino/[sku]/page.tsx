import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/SiteShell";
import { WineDetail } from "@/components/WineDetail";
import { getBodega, getProduct, getProducts } from "@/lib/catalog";
import { SITE_URL } from "@/lib/site";

export const revalidate = 300;

export async function generateStaticParams() {
  return (await getProducts()).map((p) => ({ sku: p.sku }));
}

const clip = (s: string, n = 158) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

export async function generateMetadata({ params }: { params: Promise<{ sku: string }> }): Promise<Metadata> {
  const { sku } = await params;
  const p = await getProduct(sku);
  if (!p) return { title: "Vino no encontrado" };
  const description = clip(p.why_es || p.notes_es || `${p.name}, vino argentino de ${p.bodega}.`);
  const title = `${p.name} · ${p.bodega} | VinoArgentino.es`;
  return {
    title,
    description,
    alternates: { canonical: `/vino/${p.sku}` },
    openGraph: {
      type: "website",
      title,
      description,
      url: `${SITE_URL}/vino/${p.sku}`,
      images: p.image_url ? [{ url: p.image_url, alt: p.name }] : undefined,
    },
  };
}

export default async function WinePage({ params }: { params: Promise<{ sku: string }> }) {
  const { sku } = await params;
  const product = await getProduct(sku);
  if (!product) notFound();
  const bodega = product.bodega_slug ? await getBodega(product.bodega_slug) : null;

  const extra = [
    product.grape ? { "@type": "PropertyValue", name: "Grape", value: product.grape } : null,
    product.alcohol != null ? { "@type": "PropertyValue", name: "Alcohol by volume", value: `${Number(product.alcohol)} %` } : null,
  ].filter(Boolean);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.image_url ? [product.image_url] : undefined,
    description: product.why_es || product.notes_es || undefined,
    sku: product.sku,
    additionalProperty: extra.length ? extra : undefined,
    brand: { "@type": "Brand", name: product.bodega },
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/vino/${product.sku}`,
      seller: { "@type": "Organization", name: "VinoArgentino.es", url: SITE_URL },
      priceCurrency: "EUR",
      price: product.price_retail,
      availability: product.is_available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <SiteShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <WineDetail product={product} bodega={bodega} />
    </SiteShell>
  );
}
