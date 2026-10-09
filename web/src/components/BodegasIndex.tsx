"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useLocaleSwitch } from "@/lib/i18n";
import { Bodega } from "@/lib/types";

export function BodegasIndex({ bodegas }: { bodegas: Bodega[] }) {
  const t = useTranslations("bodegasPage");
  const { locale } = useLocaleSwitch();
  return (
    <div className="bg-stone-50">
      <div className="max-w-6xl mx-auto px-5 py-10 md:py-16">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-brand-900">{t("title")}</h1>
        <p className="mt-3 text-stone-500 max-w-2xl">{t("subtitle")}</p>
        <ul className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bodegas.map((b) => {
            const location = locale === "en" ? b.location_en || b.location_es : b.location_es || b.location_en;
            return (
              <li key={b.slug}>
                <Link
                  href={`/bodegas/${b.slug}`}
                  className="block h-full bg-white rounded-xl border border-stone-100 shadow-sm hover:shadow-lg transition-all p-6"
                >
                  <h2 className="text-xl font-serif font-bold text-brand-900">{b.name}</h2>
                  {location && <p className="mt-1 text-sm text-stone-500">{location}</p>}
                  <span className="mt-4 inline-block text-[11px] font-bold uppercase tracking-widest text-sky-700">{t("viewWines")} →</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
