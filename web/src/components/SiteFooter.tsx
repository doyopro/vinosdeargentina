"use client";

import { useTranslations } from "next-intl";
import { DeliveryNote } from "@/components/DeliveryNote";
import { FooterLinks } from "@/components/FooterLinks";
import { PartnerCredit } from "@/components/PartnerCredit";
import { Wordmark } from "@/components/Wordmark";
import { Tagline } from "@/components/Tagline";

export function SiteFooter() {
  const t = useTranslations();
  return (
    <footer className="bg-brand-900 pt-12 pb-10 px-6 border-t border-brand-800 relative z-10">
      <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
        <Wordmark className="font-serif text-2xl tracking-wide" />
        <Tagline className="mt-1 mb-6" />
        <DeliveryNote variant="dark" className="max-w-xl text-left mb-6" />
        <FooterLinks className="mb-5" />
        <PartnerCredit className="mb-4" />
        <p className="text-stone-400 text-xs font-light">{t("footerCopyright")}</p>
      </div>
    </footer>
  );
}
