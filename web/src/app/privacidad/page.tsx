import type { Metadata } from "next";
import { SiteShell } from "@/components/SiteShell";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Política de privacidad | Vinos de Altura",
  description: "Política de privacidad de De Altura Wines (borrador pendiente de revisión).",
  alternates: { canonical: "/privacidad" },
};

export default function Page() {
  return (
    <SiteShell>
      <LegalPage doc="privacidad" />
    </SiteShell>
  );
}
