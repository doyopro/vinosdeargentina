"use client";

import { useTranslations } from "next-intl";
import { useLocaleSwitch } from "@/lib/i18n";
import { CatalogWine } from "@/lib/types";

interface Props {
  wine: CatalogWine;
  qty: number;
  onChangeQty: (id: string, change: number) => void;
}

export function WineCard({ wine, qty, onChangeQty }: Props) {
  const t = useTranslations();
  const { locale } = useLocaleSwitch();

  const unitGross = (wine.price * 1.07).toFixed(2).replace(".", ",");
  const totalGross = (wine.price * 1.07 * wine.box).toFixed(2).replace(".", ",");
  const inCartCls = qty > 0 ? "ring-2 ring-gold-500" : "";
  const outOfStock = !wine.is_available;

  const rawNotes = (locale === "en" ? wine.notes_en : wine.notes_es) || "";
  const notes = rawNotes.split(". ").join(".\n");

  return (
    <article
      className={`flex flex-col bg-white rounded-xl shadow-sm hover:shadow-lg transition-all border border-stone-100 overflow-hidden h-full ${inCartCls} ${outOfStock ? "opacity-75" : ""}`}
    >
      <div className="h-72 bg-stone-50 relative flex items-center justify-center p-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={wine.image_url || "https://images.unsplash.com/photo-1510850402719-e4c670846019"}
          alt={wine.name}
          className="w-full h-full object-contain drop-shadow-xl"
        />
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <span className="bg-wine-900/90 text-white text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
            Caja de {wine.box}
          </span>
          {outOfStock && (
            <span className="bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
              SIN STOCK
            </span>
          )}
        </div>
      </div>
      <div className="p-5 flex flex-col flex-grow">
        <div className="mb-2">
          <span className="text-[10px] font-bold uppercase text-stone-400">{wine.bodega}</span>
          <span className="block text-[9px] text-stone-500 font-medium">{wine.provincia}, Argentina</span>
        </div>
        <h4 className="text-xl font-serif font-bold text-wine-900 mb-2">{wine.name}</h4>
        <p className="text-sm text-stone-600 mb-4 leading-relaxed whitespace-pre-line">{notes}</p>
        <div className="mt-auto border-t border-stone-100 pt-5">
          <div className="flex justify-between items-end mb-4">
            <div className="flex flex-col">
              <span className="text-[10px] text-stone-400 uppercase font-bold mb-0.5">{t("unitPrice")}</span>
              <div className="text-2xl font-serif font-bold text-wine-900">
                {unitGross} € <span className="text-[10px] font-sans text-stone-400 font-normal">{t("incTax")}</span>
              </div>
            </div>
            <div className="text-right flex flex-col items-end">
              <span className="text-[10px] text-stone-400 uppercase font-bold mb-0.5">
                {t("boxOf", { n: wine.box })}
              </span>
              <div className="text-[15px] font-bold text-wine-800">{totalGross} €</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-stone-100 rounded-lg h-11">
              <button
                onClick={() => onChangeQty(wine.id, -1)}
                disabled={outOfStock}
                className="w-10 font-bold disabled:opacity-40 disabled:cursor-not-allowed"
              >
                -
              </button>
              <span className="w-8 text-center text-sm font-bold">{qty}</span>
              <button
                onClick={() => onChangeQty(wine.id, 1)}
                disabled={outOfStock}
                className="w-10 font-bold disabled:opacity-40 disabled:cursor-not-allowed"
              >
                +
              </button>
            </div>
            <button
              onClick={() => onChangeQty(wine.id, 1)}
              disabled={outOfStock}
              className={`flex-grow text-white font-bold h-11 rounded-lg text-[10px] uppercase tracking-widest ${
                outOfStock ? "bg-stone-300 cursor-not-allowed" : "bg-wine-900 hover:bg-wine-800"
              }`}
            >
              {outOfStock ? t("notAvailable") : t("addToCart")}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
