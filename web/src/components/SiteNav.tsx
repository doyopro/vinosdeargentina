"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export function SiteNav() {
  const t = useTranslations("footerNav");
  return (
    <nav className="hidden sm:flex gap-6">
      <Link href="/" className="text-[11px] font-bold uppercase tracking-widest text-stone-300 hover:text-gold-500 transition-colors">
        {t("shop")}
      </Link>
      <Link href="/bodegas" className="text-[11px] font-bold uppercase tracking-widest text-stone-300 hover:text-gold-500 transition-colors">
        {t("bodegas")}
      </Link>
    </nav>
  );
}
