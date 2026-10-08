"use client";

import { useTranslations } from "next-intl";
import { PartnerLogo } from "@/components/PartnerLogo";

// "Selection in collaboration with" line for footers (dark background).
export function PartnerCredit({ className = "" }: { className?: string }) {
  const t = useTranslations("partner");
  return (
    <p className={`flex flex-wrap items-center justify-center gap-x-2 text-[11px] text-stone-400 ${className}`}>
      <span>{t("collab")}</span>
      <PartnerLogo className="text-sm text-stone-200" />
    </p>
  );
}
