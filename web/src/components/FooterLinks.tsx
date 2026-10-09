"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export const LEGAL_LINKS = [
  { href: "/aviso-legal", key: "aviso" },
  { href: "/privacidad", key: "privacidad" },
  { href: "/cookies", key: "cookies" },
  { href: "/condiciones-de-compra", key: "condiciones" },
  { href: "/envios-y-devoluciones", key: "envios" },
] as const;

export function FooterLinks({ className = "" }: { className?: string }) {
  const t = useTranslations("footerNav");
  return (
    <nav aria-label={t("label")} className={`flex flex-wrap justify-center gap-x-5 gap-y-2 ${className}`}>
      <Link href="/bodegas" className="text-[11px] font-bold uppercase tracking-widest text-sky-500 hover:text-white transition-colors">
        {t("bodegas")}
      </Link>
      {LEGAL_LINKS.map((l) => (
        <Link key={l.href} href={l.href} className="text-[11px] text-stone-400 hover:text-sky-500 transition-colors">
          {t(l.key)}
        </Link>
      ))}
    </nav>
  );
}
