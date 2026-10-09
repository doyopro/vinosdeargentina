"use client";

import { useLocaleSwitch } from "@/lib/i18n";

export function LanguageToggle({ variant = "light" }: { variant?: "light" | "dark" }) {
  const { locale, setLocale } = useLocaleSwitch();

  const wrapperCls =
    variant === "dark"
      ? "fixed top-6 right-6 z-[104] flex bg-white/10 backdrop-blur-md p-1 rounded-full border border-white/10"
      : "fixed top-6 right-6 z-[104] flex bg-white/90 backdrop-blur-md p-1 rounded-full shadow-lg border border-stone-200";

  const btnCls = (active: boolean) => {
    if (variant === "dark") {
      return active
        ? "px-3 py-1 text-[10px] font-bold rounded-full bg-white/20 text-white transition-all"
        : "px-3 py-1 text-[10px] font-bold rounded-full text-white hover:bg-white/20 transition-all";
    }
    return active
      ? "px-4 py-1.5 text-xs font-bold rounded-full bg-brand-900 text-white transition-all shadow-sm"
      : "px-4 py-1.5 text-xs font-bold rounded-full text-stone-500 hover:text-brand-900 transition-all";
  };

  return (
    <div className={wrapperCls}>
      <button onClick={() => setLocale("es")} className={btnCls(locale === "es")}>
        ES
      </button>
      <button onClick={() => setLocale("en")} className={btnCls(locale === "en")}>
        EN
      </button>
    </div>
  );
}
