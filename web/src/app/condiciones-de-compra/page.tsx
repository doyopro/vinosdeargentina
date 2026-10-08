import type { Metadata } from "next";
import { SiteShell } from "@/components/SiteShell";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Condiciones de compra | VinoArgentino.es",
  description: "Condiciones de compra de VinoArgentino.es (borrador pendiente de revisión).",
  alternates: { canonical: "/condiciones-de-compra" },
};

export default function Page() {
  return (
    <SiteShell>
      <LegalPage doc="condiciones" />
    </SiteShell>
  );
}
