"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

const AGE_KEY = "deAlturaAge18";
const BOT_UA = /bot|crawl|spider|slurp|googlebot|bingpreview|facebookexternalhit|lighthouse/i;

// Full-screen 18+ check. Rendered only on the client after mount, so the
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
      className="fixed inset-0 z-[300] bg-wine-900 flex flex-col items-center justify-center px-6 text-center"
    >
      <div className="canary-stripe h-2 w-full absolute top-0 left-0" />
      <p className="font-serif text-2xl text-white tracking-wide mb-10">
        De Altura <span className="text-gold-500">Wines</span>
      </p>
      <h2 id="age-gate-title" className="font-serif text-3xl md:text-4xl text-white mb-10">
        {t("title")}
      </h2>
      <div className="flex gap-4">
        <button
          autoFocus
          onClick={accept}
          className="min-w-32 bg-gold-500 hover:bg-gold-600 text-wine-900 font-bold px-8 py-4 rounded-sm uppercase tracking-widest text-xs transition-colors"
        >
          {t("yes")}
        </button>
        <button
          onClick={() => undefined}
          className="min-w-32 border border-white/30 text-white/80 hover:bg-white/10 font-bold px-8 py-4 rounded-sm uppercase tracking-widest text-xs transition-colors"
        >
          {t("no")}
        </button>
      </div>
    </div>
  );
}
