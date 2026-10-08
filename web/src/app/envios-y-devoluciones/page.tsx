import type { Metadata } from "next";
import { SiteShell } from "@/components/SiteShell";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Envíos y devoluciones | VinoArgentino.es",
  description: "Envíos y devoluciones de VinoArgentino.es (borrador pendiente de revisión).",
  alternates: { canonical: "/envios-y-devoluciones" },
};

export default function Page() {
  return (
    <SiteShell>
      <LegalPage doc="envios" />
    </SiteShell>
  );
}
