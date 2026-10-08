import type { Metadata } from "next";
import { SiteShell } from "@/components/SiteShell";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Política de cookies | Vinos de Altura",
  description: "Política de cookies de De Altura Wines (borrador pendiente de revisión).",
  alternates: { canonical: "/cookies" },
};

export default function Page() {
  return (
    <SiteShell>
      <LegalPage doc="cookies" />
    </SiteShell>
  );
}
