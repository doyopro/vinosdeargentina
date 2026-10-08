import type { Metadata } from "next";
import { SiteShell } from "@/components/SiteShell";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Aviso legal | VinoArgentino.es",
  description: "Aviso legal de la tienda online VinoArgentino.es (borrador pendiente de revisión).",
  alternates: { canonical: "/aviso-legal" },
};

export default function Page() {
  return (
    <SiteShell>
      <LegalPage doc="aviso" />
    </SiteShell>
  );
}
