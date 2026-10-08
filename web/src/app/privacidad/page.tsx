import type { Metadata } from "next";
import { SiteShell } from "@/components/SiteShell";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Política de privacidad | VinoArgentino.es",
  description: "Política de privacidad de VinoArgentino.es (borrador pendiente de revisión).",
  alternates: { canonical: "/privacidad" },
};

export default function Page() {
  return (
    <SiteShell>
      <LegalPage doc="privacidad" />
    </SiteShell>
  );
}
