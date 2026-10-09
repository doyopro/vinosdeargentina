"use client";

import { useTranslations } from "next-intl";
import { useLocaleSwitch } from "@/lib/i18n";
import { Bodega } from "@/lib/types";

export function BodegaHeader({ bodega, count }: { bodega: Bodega; count: number }) {
  const t = useTranslations("bodegasPage");
  const { locale } = useLocaleSwitch();
  const location = locale === "en" ? bodega.location_en || bodega.location_es : bodega.location_es || bodega.location_en;
  const description = locale === "en" ? bodega.description_en || bodega.description_es : bodega.description_es || bodega.description_en;
  return (
    <header className="mb-10 max-w-3xl">
      <span className="text-[11px] font-bold uppercase tracking-widest text-sky-700">{t("winery")}</span>
      <h1 className="mt-2 text-4xl md:text-5xl font-serif font-bold text-brand-900">{bodega.name}</h1>
      {location && <p className="mt-2 text-sm text-stone-500">{location}</p>}
      {description && <p className="mt-5 text-stone-600 leading-relaxed">{description}</p>}
      <p className="mt-5 text-[11px] font-bold uppercase tracking-widest text-stone-400">{t("wines", { n: count })}</p>
    </header>
  );
}
