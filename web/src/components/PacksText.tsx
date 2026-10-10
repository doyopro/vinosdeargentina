"use client";

import { useTranslations } from "next-intl";

export function PacksHero() {
  const t = useTranslations("packsPage");
  return (
    <header className="bg-brand-900 px-5 py-12 md:py-16 text-center">
      <div className="max-w-3xl mx-auto">
        <div className="text-[11px] font-bold uppercase tracking-widest text-sky-500">{t("eyebrow")}</div>
        <h1 className="mt-3 text-4xl md:text-6xl font-serif font-bold text-white leading-tight">{t("title")}</h1>
        <p className="mt-4 text-stone-300 leading-relaxed text-balance">{t("subtitle")}</p>
        <div className="mx-auto mt-6 h-px w-24 bg-sun-500/60" aria-hidden />
      </div>
    </header>
  );
}

export function PacksHeading({ id, k, sub }: { id: string; k: string; sub: string }) {
  const t = useTranslations("packsPage");
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3">
        <span className="h-px w-8 bg-sun-500" aria-hidden />
        <h2 id={id} className="text-3xl font-serif text-brand-900">
          {t(k)}
        </h2>
      </div>
      <p className="mt-2 text-stone-500 font-medium">{t(sub)}</p>
    </div>
  );
}

export function PacksCatalogCta() {
  const t = useTranslations("packsPage");
  return <>{t("catalogCta")}</>;
}
