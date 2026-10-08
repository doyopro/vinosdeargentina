"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

const AGE_KEY = "deAlturaAge18";
const BOT_UA = /bot|crawl|spider|slurp|googlebot|bingpreview|facebookexternalhit|lighthouse/i;

// 18+ check (blurred overlay + centered card). Rendered only on the client after mount, so the
// server HTML (and therefore crawlers) always gets the full page content.
export function AgeGate() {
  const t = useTranslations("ageGate");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (BOT_UA.test(navigator.userAgent)) return;
    let confirmed = false;
    try {
      confirmed = window.localStorage.getItem(AGE_KEY) === "yes";
    } catch {
      // storage unavailable: ask every time
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only gate decided after mount
    if (!confirmed) setVisible(true);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [visible]);

  if (!visible) return null;

  const accept = () => {
    try {
      window.localStorage.setItem(AGE_KEY, "yes");
    } catch {
      // ignore: the gate just closes for this visit
    }
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-title"
      className="fixed inset-0 z-[300] flex items-center justify-center px-5 bg-black/45 backdrop-blur-[6px]"
    >
      <div className="w-full max-w-[420px] rounded-3xl bg-stone-50 border border-gold-500/30 shadow-2xl p-8 md:p-10 text-center">
        <div className="canary-stripe h-1 w-16 rounded-full mx-auto mb-6" aria-hidden />
        <p id="age-gate-title" className="font-serif text-3xl text-wine-900 tracking-wide">
          {t("title")}
        </p>
        <p className="mt-6 text-xl font-semibold text-wine-900">{t("question")}</p>
        <p className="mt-2 text-xs text-stone-500">{t("hint")}</p>
        <div className="mt-8 flex flex-col gap-3">
          <button
            autoFocus
            onClick={accept}
            className="w-full bg-wine-900 hover:bg-wine-800 text-white font-bold py-4 rounded-xl uppercase tracking-widest text-xs shadow-md transition-colors"
          >
            {t("yes")}
          </button>
          <button
            onClick={() => undefined}
            className="w-full border border-stone-300 text-stone-600 hover:bg-stone-100 font-bold py-3.5 rounded-xl uppercase tracking-widest text-xs transition-colors"
          >
            {t("no")}
          </button>
        </div>
      </div>
    </div>
  );
}
