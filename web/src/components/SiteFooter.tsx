"use client";

import { useTranslations } from "next-intl";
import { DeliveryNote } from "@/components/DeliveryNote";
import { FooterLinks } from "@/components/FooterLinks";

export function SiteFooter() {
  const t = useTranslations();
  return (
    <footer className="bg-wine-900 pt-12 pb-10 px-6 border-t border-wine-800 relative z-10">
      <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
        <DeliveryNote variant="dark" className="max-w-xl text-left mb-6" />
        <FooterLinks className="mb-6" />
        <p className="text-stone-400 text-xs font-light">{t("footerCopyright")}</p>
      </div>
    </footer>
  );
}
