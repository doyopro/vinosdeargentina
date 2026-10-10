"use client";

import { useTranslations } from "next-intl";
import { useLocaleSwitch } from "@/lib/i18n";
import { AUTO_TIERS } from "@/lib/promos";

export function PromoTiers() {
  const t = useTranslations("packsPage");
  const { locale } = useLocaleSwitch();
  const nf = (n: number) => n.toLocaleString(locale === "en" ? "en-GB" : "es-ES");
  return (
    <div>
      <ul className="grid gap-4 sm:grid-cols-3">
        {AUTO_TIERS.map((tier) => (
          <li key={tier.from} className="rounded-2xl border border-sun-500/40 bg-white p-6 text-center shadow-sm">
            <div className="text-4xl font-serif font-bold text-brand-900">{t("tierPct", { pct: nf(tier.pct) })}</div>
            <div className="mt-2 text-sm text-stone-600">{t("tierFrom", { amount: nf(tier.from) })}</div>
          </li>
        ))}
      </ul>
      <p className="mt-5 text-sm text-stone-600 leading-relaxed">{t("offersNote")}</p>
    </div>
  );
}
