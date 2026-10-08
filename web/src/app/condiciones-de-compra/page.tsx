import type { Metadata } from "next";
import { SiteShell } from "@/components/SiteShell";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Condiciones de compra | Vinos de Altura",
  description: "Condiciones de compra de De Altura Wines (borrador pendiente de revisión).",
  alternates: { canonical: "/condiciones-de-compra" },
};

export default function Page() {
  return (
    <SiteShell>
      <LegalPage doc="condiciones" />
    </SiteShell>
  );
}
