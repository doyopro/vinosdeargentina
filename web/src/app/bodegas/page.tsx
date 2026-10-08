import type { Metadata } from "next";
import { SiteShell } from "@/components/SiteShell";
import { BodegasIndex } from "@/components/BodegasIndex";
import { getBodegas } from "@/lib/catalog";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Bodegas | VinoArgentino.es",
  description: "Las bodegas argentinas de altura detrás de nuestra selección de vinos.",
  alternates: { canonical: "/bodegas" },
};

export default async function BodegasPage() {
  const bodegas = await getBodegas();
  return (
    <SiteShell>
      <BodegasIndex bodegas={bodegas} />
    </SiteShell>
  );
}
