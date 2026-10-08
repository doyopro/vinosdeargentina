"use client";

import { useTranslations } from "next-intl";
import { useCart } from "@/lib/CartContext";
import { lineKey } from "@/lib/cart";
import { toPackLine } from "@/lib/packs";
import { Pack } from "@/lib/types";
import { PackCard } from "@/components/PackCard";

export function SpecialSelection({ packs }: { packs: Pack[] }) {
  const t = useTranslations();
  const { cart, addPack } = useCart();

  if (packs.length === 0) return null;

  return (
    <section
      aria-labelledby="special-title"
      className="rounded-2xl border border-gold-500/30 bg-gradient-to-b from-wine-900/[0.06] to-transparent p-5 md:p-8"
    >
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <span className="h-px w-8 bg-gold-500" aria-hidden />
          <h3 id="special-title" className="text-3xl font-serif text-wine-900">
            {t("specialTitle")}
          </h3>
        </div>
        <p className="mt-2 text-stone-500 font-medium">{t("specialSubtitle")}</p>
      </div>

      <div className="flex gap-5 overflow-x-auto snap-x snap-mandatory -mx-5 px-5 pb-4 md:mx-0 md:px-0 md:pb-0 md:grid md:grid-cols-3 md:gap-8 md:overflow-visible">
        {packs.map((pack) => (
          <div key={pack.id} className="snap-center shrink-0 w-[84%] sm:w-[60%] md:w-auto">
            <PackCard
              pack={pack}
              qty={cart[lineKey("pack", pack.id)]?.qty ?? 0}
              onChangeQty={(p, change) => addPack(toPackLine(p), change)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
