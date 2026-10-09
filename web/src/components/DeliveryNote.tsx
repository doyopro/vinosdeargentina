"use client";

import { useTranslations } from "next-intl";

// Small, discreet delivery policy note. No shipping cost is ever added to totals.
export function DeliveryNote({ variant = "light", className = "" }: { variant?: "light" | "dark"; className?: string }) {
  const t = useTranslations();
  const tone = variant === "dark" ? "text-stone-200" : "text-stone-500";
  return (
    <p className={`flex items-start gap-2 text-[11px] leading-relaxed ${tone} ${className}`}>
      <svg
        className="w-4 h-4 mt-px flex-shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        viewBox="0 0 24 24"
        aria-hidden
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h11v9H3zM14 10h4l3 3v3h-7zM7 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm10 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
      </svg>
      <span>{t("deliveryNote")}</span>
    </p>
  );
}
