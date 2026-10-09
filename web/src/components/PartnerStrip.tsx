"use client";

import { useTranslations } from "next-intl";
import { PartnerLogo } from "@/components/PartnerLogo";

// Discreet partner band under the catalog.
export function PartnerStrip() {
  const t = useTranslations("partner");
  return (
    <section aria-label={t("title")} className="mt-12 border-t border-stone-200 pt-8 text-center">
      <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">{t("title")}</p>
      <PartnerLogo className="mt-2 inline-block text-xl text-brand-800" />
      <p className="mt-2 text-xs text-stone-500 max-w-md mx-auto">{t("blurb")}</p>
    </section>
  );
}
