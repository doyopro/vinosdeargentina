"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useLocaleSwitch } from "@/lib/i18n";
import { useCart } from "@/lib/CartContext";
import { lineKey } from "@/lib/cart";
import { toCatalogWine } from "@/lib/catalog-map";
import { Product } from "@/lib/types";

const euros = (n: number) => n.toFixed(2).replace(".", ",");

export function WineDetail({ product }: { product: Product }) {
  const t = useTranslations("wineDetail");
  const tc = useTranslations();
  const { locale } = useLocaleSwitch();
  const { cart, add } = useCart();

  const wine = toCatalogWine(product);
  const qty = cart[lineKey("product", wine.id)]?.qty ?? 0;
  const soldOut = !product.is_available;

  const pick = (es: string | null, en: string | null) => (locale === "en" ? en || es : es || en);
  const profile = (pick(product.profile_es, product.profile_en) || "")
    .split("·")
    .map((c) => c.trim())
    .filter(Boolean);
  const notes = pick(product.notes_es, product.notes_en);
  const pairing = pick(product.pairing_es, product.pairing_en);
  const why = pick(product.why_es, product.why_en);

  const facts: [string, string | null][] = [
    [t("grape"), product.grape],
    [t("region"), product.subregion],
    [t("altitude"), product.altitude_label],
    [t("aging"), pick(product.aging_es, product.aging_en)],
    [t("serveTemp"), product.serve_temp],
  ];
  const shownFacts = facts.filter(([, v]) => v);

  return (
    <article className="bg-stone-50">
      <div className="max-w-6xl mx-auto px-5 py-10 md:py-16">
        <nav className="text-xs text-stone-500 mb-6" aria-label="breadcrumb">
          <Link href="/" className="hover:text-wine-800">
            {t("backToShop")}
          </Link>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-14 items-start">
          <div className="relative rounded-3xl overflow-hidden bg-white border border-stone-100 shadow-sm h-[26rem] md:h-[36rem]">
            <div
              aria-hidden
              className="absolute inset-0 bg-[radial-gradient(ellipse_65%_55%_at_50%_55%,rgba(200,159,93,0.32),rgba(200,159,93,0.08)_55%,transparent_75%)]"
            />
            <div aria-hidden className="absolute bottom-6 left-1/2 -translate-x-1/2 h-5 w-56 rounded-[50%] bg-wine-900/15 blur-lg" />
            {product.image_url && (
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                priority
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-contain p-8 md:p-12 drop-shadow-[0_18px_22px_rgba(43,7,16,0.30)]"
              />
            )}
            {soldOut && (
              <span className="absolute top-4 right-4 bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                {tc("outOfStock")}
              </span>
            )}
          </div>

          <div>
            {product.bodega_slug ? (
              <Link
                href={`/bodegas/${product.bodega_slug}`}
                className="text-[11px] font-bold uppercase tracking-widest text-gold-600 hover:text-wine-800 transition-colors"
              >
                {product.bodega}
              </Link>
            ) : (
              <span className="text-[11px] font-bold uppercase tracking-widest text-gold-600">{product.bodega}</span>
            )}
            <h1 className="mt-2 text-4xl md:text-5xl font-serif font-bold text-wine-900 leading-tight">{product.name}</h1>
            {product.subregion && <p className="mt-2 text-sm text-stone-500">{product.subregion}, Argentina</p>}

            <div className="mt-6 flex items-end gap-6">
              <div>
                <div className="text-4xl font-serif font-bold text-wine-900">
                  {euros(product.price_retail)} €
                  <span className="ml-2 text-[11px] font-sans font-normal text-stone-400">{tc("incTax")}</span>
                </div>
                <div className="text-xs text-stone-500 mt-1">
                  {t("perBottle")} · {tc("boxOf", { n: product.box_size })}: {euros(product.price_retail * product.box_size)} €
                </div>
              </div>
            </div>

            <div className="mt-6">
              {soldOut ? (
                <div className="h-12 flex items-center justify-center rounded-lg bg-stone-200 text-stone-500 text-xs font-bold uppercase tracking-widest">
                  {tc("outOfStock")}
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-white border border-stone-200 rounded-lg h-12">
                    <button onClick={() => add(wine, -1)} aria-label={tc("cartDecrease")} className="w-11 font-bold text-lg">
                      −
                    </button>
                    <span className="w-10 text-center text-sm font-bold" aria-live="polite">
                      {qty}
                    </span>
                    <button onClick={() => add(wine, 1)} aria-label={tc("cartIncrease")} className="w-11 font-bold text-lg">
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => add(wine, 1)}
                    className="flex-grow h-12 bg-wine-900 hover:bg-wine-800 text-white font-bold rounded-lg text-xs uppercase tracking-widest transition-colors"
                  >
                    {tc("addToCart")}
                  </button>
                </div>
              )}
              <p className="mt-2 text-[11px] text-stone-400">{t("boxesNote", { n: product.box_size })}</p>
            </div>

            {profile.length > 0 && (
              <section className="mt-10" aria-labelledby="wine-profile">
                <h2 id="wine-profile" className="text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-3">
                  {t("profile")}
                </h2>
                <ul className="flex flex-wrap gap-2">
                  {profile.map((chip) => (
                    <li
                      key={chip}
                      className="px-4 py-1.5 rounded-full border border-gold-500/40 bg-gold-500/10 text-wine-900 text-sm font-medium"
                    >
                      {chip}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {shownFacts.length > 0 && (
              <dl className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 border-t border-stone-200 pt-6">
                {shownFacts.map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-[10px] font-bold uppercase tracking-widest text-stone-400">{label}</dt>
                    <dd className="text-sm text-wine-900 mt-0.5">{value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>

        <div className="mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          {notes && (
            <section className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
              <h2 className="text-xl font-serif font-bold text-wine-900 mb-3">{t("taste")}</h2>
              <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-line">{notes.split(". ").join(".\n")}</p>
            </section>
          )}
          {pairing && (
            <section className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
              <h2 className="text-xl font-serif font-bold text-wine-900 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-gold-500" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 3v8a2 2 0 002 2v8M5 3v5M9 3v5M17 3c-1.7 1.2-3 3.6-3 6 0 1.7 1 3 3 3v9" />
                </svg>
                {t("pairing")}
              </h2>
              <p className="text-sm text-stone-600 leading-relaxed">{pairing}</p>
            </section>
          )}
          {why && (
            <section className="rounded-2xl border border-gold-500/30 bg-gradient-to-b from-gold-500/10 to-white shadow-sm p-6">
              <h2 className="text-xl font-serif font-bold text-wine-900 mb-3">{t("why")}</h2>
              <p className="text-sm text-stone-700 leading-relaxed">{why}</p>
            </section>
          )}
        </div>
      </div>
    </article>
  );
}
