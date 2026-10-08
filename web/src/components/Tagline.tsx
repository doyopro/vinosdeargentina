"use client";

import { useTranslations } from "next-intl";

export function Tagline({ className = "" }: { className?: string }) {
  const t = useTranslations();
  return <span className={`text-[10px] md:text-[11px] font-sans tracking-wide text-stone-400 ${className}`}>{t("tagline")}</span>;
}
