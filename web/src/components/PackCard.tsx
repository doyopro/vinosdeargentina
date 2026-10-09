"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useLocaleSwitch } from "@/lib/i18n";
import { Pack } from "@/lib/types";
import { packBottleCount, packImages, packLoosePrice, packName } from "@/lib/packs";
import { PackCollage } from "@/components/PackCollage";

interface Props {
  pack: Pack;
  qty: number;
  onChangeQty: (pack: Pack, change: number) => void;
}

const euros = (n: number) => n.toFixed(2).replace(".", ",");

export function PackCard({ pack, qty, onChangeQty }: Props) {
  const t = useTranslations();
  const { locale } = useLocaleSwitch();
  const [open, setOpen] = useState(false);

  const bottles = packBottleCount(pack);
  const loose = packLoosePrice(pack);
  const saving = Math.round(loose - pack.price_retail);
  const description = (locale === "en" ? pack.description_en : pack.description_es) || "";
  const listId = `pack-wines-${pack.id}`;

  return (
    <article
      className={`flex flex-col bg-white rounded-xl shadow-sm hover:shadow-lg transition-all border border-stone-100 overflow-hidden h-full ${
        qty > 0 ? "ring-2 ring-sun-500" : ""
      }`}
    >
      <div className="relative h-72 bg-stone-50 flex items-end justify-center pb-5 overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_58%,rgba(116,172,223,0.30),rgba(116,172,223,0.08)_55%,transparent_75%)]"
        />
        <div aria-hidden className="absolute bottom-3 left-1/2 -translate-x-1/2 h-4 w-52 rounded-[50%] bg-brand-900/15 blur-md" />
        <Link href={`/pack/${pack.slug}`} aria-label={packName(pack, locale)} className="relative">
          <PackCollage images={packImages(pack)} />
        </Link>
        <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
          <span className="bg-brand-900/90 text-white text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
            {t("packBottles", { n: bottles })}
          </span>
          {pack.is_featured && (
            <span className="bg-sun-500 text-brand-900 text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-md">
              {t("packFeatured")}
            </span>
          )}
        </div>
      </div>

      <div className="p-5 flex flex-col flex-grow">
        {pack.collection && <span className="text-[10px] font-bold uppercase text-stone-400 mb-1">{pack.collection}</span>}
        <h4 className="text-xl font-serif font-bold text-brand-900 mb-2">
          <Link href={`/pack/${pack.slug}`} className="hover:text-brand-700 transition-colors">
            {packName(pack, locale)}
          </Link>
        </h4>
        <p className="text-sm text-stone-600 mb-3 leading-relaxed">{description}</p>
        <Link
          href={`/pack/${pack.slug}`}
          className="self-start text-[10px] font-bold uppercase tracking-widest text-brand-800 underline underline-offset-2 mb-4"
        >
          {t("packSeeDetail")}
        </Link>

        <div className="mb-5">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls={listId}
            className="md:hidden text-[10px] font-bold uppercase tracking-widest text-brand-800 underline underline-offset-2 mb-2"
          >
            {open ? t("packHideWines") : t("packShowWines")}
          </button>
          <div id={listId} className={`${open ? "block" : "hidden"} md:block`}>
            <div className="hidden md:block text-[10px] font-bold uppercase text-stone-400 mb-1.5">{t("packIncludes")}</div>
            <ul className="space-y-1">
              {pack.items.map((it) => (
                <li key={it.product.id} className="text-[13px] text-stone-600 flex justify-between gap-3">
                  <span className="truncate">
                    {it.bottles > 1 ? `${it.bottles} × ` : ""}
                    {it.product.name}
                  </span>
                  <span className="text-stone-400 whitespace-nowrap">{t(`wineType.${it.product.type}`)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-auto border-t border-stone-100 pt-5">
          <div className="flex justify-between items-end mb-4">
            <div className="flex flex-col">
              {saving > 0 && <s className="text-xs text-stone-400">{euros(loose)} €</s>}
              <div className="text-2xl font-serif font-bold text-brand-900">
                {euros(pack.price_retail)} € <span className="text-[10px] font-sans text-stone-400 font-normal">{t("incTax")}</span>
              </div>
            </div>
            {saving > 0 && (
              <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                {t("packSave", { n: saving })}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-stone-100 rounded-lg h-11">
              <button onClick={() => onChangeQty(pack, -1)} aria-label={t("cartDecrease")} className="w-10 font-bold">
                -
              </button>
              <span className="w-8 text-center text-sm font-bold">{qty}</span>
              <button onClick={() => onChangeQty(pack, 1)} aria-label={t("cartIncrease")} className="w-10 font-bold">
                +
              </button>
            </div>
            <button
              onClick={() => onChangeQty(pack, 1)}
              aria-label={t("packAddAria", { name: packName(pack, locale) })}
              className="flex-grow text-white font-bold h-11 rounded-lg text-[10px] uppercase tracking-widest bg-brand-900 hover:bg-brand-800"
            >
              {t("addToCart")}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
