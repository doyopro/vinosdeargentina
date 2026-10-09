"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useCart } from "@/lib/CartContext";
import { useLocaleSwitch } from "@/lib/i18n";
import { lineKey } from "@/lib/cart";
import { toPackLine } from "@/lib/packs";
import { Pack } from "@/lib/types";
import { PackCard } from "@/components/PackCard";

export function SpecialSelection({ packs }: { packs: Pack[] }) {
  const t = useTranslations();
  const { locale } = useLocaleSwitch();
  const { cart, addPack } = useCart();
  const trackRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const updateEdges = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    updateEdges();
    window.addEventListener("resize", updateEdges);
    return () => window.removeEventListener("resize", updateEdges);
  }, [updateEdges, packs.length]);

  const scrollByCard = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    const step = card ? card.getBoundingClientRect().width + 20 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  if (packs.length === 0) return null;

  const arrowCls =
    "hidden md:flex h-11 w-11 items-center justify-center rounded-full border border-brand-900/20 bg-white text-brand-900 shadow-sm transition-colors hover:bg-brand-900 hover:text-white disabled:opacity-30 disabled:pointer-events-none";

  return (
    <section
      aria-labelledby="special-title"
      className="rounded-2xl border border-sky-500/30 bg-gradient-to-b from-brand-900/[0.06] to-transparent p-5 md:p-8"
    >
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-sun-500" aria-hidden />
            <h3 id="special-title" className="text-3xl font-serif text-brand-900">
              {t("specialTitle")}
            </h3>
          </div>
          <p className="mt-2 text-stone-500 font-medium">{t("specialSubtitle")}</p>
        </div>
        {packs.length > 1 && (
          <div className="flex gap-2">
            <button type="button" onClick={() => scrollByCard(-1)} disabled={edges.start} aria-label={t("carouselPrev")} className={arrowCls}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button type="button" onClick={() => scrollByCard(1)} disabled={edges.end} aria-label={t("carouselNext")} className={arrowCls}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      <div
        ref={trackRef}
        onScroll={updateEdges}
        className="flex gap-5 overflow-x-auto snap-x snap-mandatory -mx-5 px-5 pb-4 md:mx-0 md:px-0 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {packs.map((pack) => (
          <div key={pack.id} className="snap-start shrink-0 w-[84%] sm:w-[60%] md:w-[calc((100%-2.5rem)/2)] lg:w-[calc((100%-2.5rem)/3)]">
            <PackCard
              pack={pack}
              qty={cart[lineKey("pack", pack.id)]?.qty ?? 0}
              onChangeQty={(p, change) => addPack(toPackLine(p, locale), change)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
