"use client";

import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useLocaleSwitch } from "@/lib/i18n";
import { useCart } from "@/lib/CartContext";
import { lineKey } from "@/lib/cart";
import { toCatalogWine } from "@/lib/catalog-map";
import { Bodega, Product } from "@/lib/types";

const eur = (n: number) => n.toFixed(2).replace(".", ",");
const filled = (v: string | null | undefined): v is string => typeof v === "string" && v.trim() !== "";

// Simple stroke icons for the key-facts strip.
const ICONS = {
  altitude: "M3 19l6-10 4 6 2-3 6 7H3z",
  zone: "M12 21s7-6.2 7-11.5A7 7 0 005 9.5C5 14.8 12 21 12 21zM12 12a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
  grape: "M12 3c0 2-1 3-3 3M8 9a2 2 0 104 0 2 2 0 00-4 0zM12 9a2 2 0 104 0 2 2 0 00-4 0zM6 13a2 2 0 104 0 2 2 0 00-4 0zM10 13a2 2 0 104 0 2 2 0 00-4 0zM14 13a2 2 0 104 0 2 2 0 00-4 0zM8 17a2 2 0 104 0 2 2 0 00-4 0zM12 17a2 2 0 104 0 2 2 0 00-4 0zM10 21a2 2 0 104 0",
  alcohol: "M12 3s6 6.5 6 11a6 6 0 11-12 0c0-4.5 6-11 6-11z",
  temp: "M10 14V5a2 2 0 114 0v9a4 4 0 11-4 0z",
  pairing: "M7 3v8a2 2 0 002 2v8M5 3v5M9 3v5M17 3c-1.7 1.2-3 3.6-3 6 0 1.7 1 3 3 3v9",
} as const;

function Icon({ d, className = "w-5 h-5" }: { d: string; className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

function Section({ title, icon, children }: { title: string; icon?: string; children: ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 md:p-8">
      <h2 className="text-2xl font-serif font-bold text-brand-900 mb-4 flex items-center gap-2">
        {icon && <Icon d={icon} className="w-5 h-5 text-sky-500" />}
        {title}
      </h2>
      {children}
    </section>
  );
}

export function WineDetail({ product, bodega }: { product: Product; bodega: Bodega | null }) {
  const t = useTranslations("wineSheet");
  const tc = useTranslations();
  const { locale } = useLocaleSwitch();
  const { cart, add } = useCart();

  const wine = toCatalogWine(product);
  const qty = cart[lineKey("product", wine.id)]?.qty ?? 0;
  const soldOut = !product.is_available;

  const pick = (es: string | null, en: string | null) => (locale === "en" ? (filled(en) ? en : es) : filled(es) ? es : en);

  const vintage = product.name.match(/\b(19|20)\d{2}\b/)?.[0] ?? null;
  const alcohol = product.alcohol != null && !Number.isNaN(Number(product.alcohol)) ? `${String(Number(product.alcohol)).replace(".", ",")} %` : null;
  const profile = (pick(product.profile_es, product.profile_en) || "")
    .split("·")
    .map((c) => c.trim())
    .filter(Boolean);

  const soil = pick(product.soil_es, product.soil_en);
  const winemaking = pick(product.winemaking_es, product.winemaking_en);
  const winemakingItems = filled(winemaking) && winemaking.includes(" • ") ? winemaking.split(" • ").map((s) => s.replace(/^•\s*/, "").trim()).filter(Boolean) : null;
  const look = pick(product.look_es, product.look_en);
  const nose = pick(product.nose_es, product.nose_en);
  const palate = pick(product.palate_es, product.palate_en);
  const notes = pick(product.notes_es, product.notes_en);
  const learnTitle = pick(product.learn_title_es, product.learn_title_en);
  const learnBody = pick(product.learn_body_es, product.learn_body_en);
  const terroir = bodega ? pick(bodega.terroir_es, bodega.terroir_en) : null;
  const pairing = pick(product.pairing_es, product.pairing_en);
  const why = pick(product.why_es, product.why_en);
  const aging = pick(product.aging_es, product.aging_en);

  const tastes: [string, string | null][] = [
    [t("look"), look],
    [t("nose"), nose],
    [t("palate"), palate],
  ];
  const shownTastes = tastes.filter(([, v]) => filled(v));

  const keyFacts: [string, string, string | null][] = [
    [t("altitude"), ICONS.altitude, product.altitude_label],
    [t("zone"), ICONS.zone, product.subregion],
    [t("grape"), ICONS.grape, product.grape],
    [t("alcohol"), ICONS.alcohol, alcohol],
    [t("serveTemp"), ICONS.temp, product.serve_temp],
  ];
  const shownFacts = keyFacts.filter(([, , v]) => filled(v));

  const headerMeta = [product.grape, product.subregion, vintage].filter(filled);

  return (
    <article className="bg-stone-50">
      {/* a) Band header */}
      <header className="relative overflow-hidden bg-brand-900">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(ellipse_55%_70%_at_78%_50%,rgba(116,172,223,0.28),transparent_70%)]"
        />
        <div className="relative max-w-6xl mx-auto px-5 py-10 md:py-16 grid grid-cols-1 md:grid-cols-[1.15fr_0.85fr] gap-6 md:gap-10 items-center">
          <div>
            <Link href="/" className="text-xs text-stone-400 hover:text-sky-500 transition-colors">
              {t("backToShop")}
            </Link>
            <div className="mt-5">
              {product.bodega_slug ? (
                <Link
                  href={`/bodegas/${product.bodega_slug}`}
                  className="text-[11px] font-bold uppercase tracking-widest text-sky-500 hover:text-white transition-colors"
                >
                  {product.bodega}
                </Link>
              ) : (
                <span className="text-[11px] font-bold uppercase tracking-widest text-sky-500">{product.bodega}</span>
              )}
            </div>
            <h1 className="mt-2 text-4xl md:text-6xl font-serif font-bold text-white leading-tight">{product.name}</h1>
            {headerMeta.length > 0 && <p className="mt-3 text-stone-300">{headerMeta.join(" · ")}</p>}
            {profile.length > 0 && (
              <ul className="mt-5 flex flex-wrap gap-2">
                {profile.map((chip) => (
                  <li key={chip} className="px-3.5 py-1 rounded-full border border-sky-500/50 text-sky-500 text-xs font-medium">
                    {chip}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-7">
              <div className="text-3xl font-serif font-bold text-white">
                {tc("priceBottle", { price: eur(product.price_retail) })}{" "}
                <span className="text-[11px] font-sans font-normal text-stone-400">{tc("incTax")}</span>
              </div>
              <div className="mt-5 max-w-md">
                {soldOut ? (
                  <div className="h-12 flex items-center justify-center rounded-lg bg-white/10 text-stone-300 text-xs font-bold uppercase tracking-widest">
                    {tc("outOfStock")}
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-white/10 text-white rounded-lg h-12">
                      <button onClick={() => add(wine, -1)} aria-label={tc("cartDecrease")} className="w-11 font-bold text-lg">
                        −
                      </button>
                      <span className="w-9 text-center text-sm font-bold" aria-live="polite">
                        {qty}
                      </span>
                      <button onClick={() => add(wine, 1)} aria-label={tc("cartIncrease")} className="w-11 font-bold text-lg">
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => add(wine, 1)}
                      className="flex-grow h-12 bg-sun-500 hover:bg-sun-600 text-brand-900 font-bold rounded-lg text-xs uppercase tracking-widest transition-colors"
                    >
                      {tc("addToCart")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="relative h-72 md:h-[30rem] order-first md:order-none">
            {product.image_url && (
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                priority
                sizes="(min-width: 768px) 40vw, 100vw"
                className="object-contain drop-shadow-[0_20px_26px_rgba(0,0,0,0.45)]"
              />
            )}
            {soldOut && (
              <span className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                {tc("outOfStock")}
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-5 py-10 md:py-14 space-y-6">
        {/* b) Key facts strip */}
        {shownFacts.length > 0 && (
          <ul className="grid grid-cols-2 md:grid-cols-5 gap-3 -mt-16 md:-mt-20 relative z-10">
            {shownFacts.map(([label, icon, value]) => (
              <li key={label} className="bg-white rounded-xl border border-stone-100 shadow-md p-4 text-center">
                <Icon d={icon} className="w-6 h-6 mx-auto text-sky-500" />
                <div className="mt-2 text-[10px] font-bold uppercase tracking-widest text-stone-400">{label}</div>
                <div className="mt-0.5 text-sm font-semibold text-brand-900 break-words">{value}</div>
              </li>
            ))}
          </ul>
        )}

        {/* c) The vineyard */}
        {(filled(product.subregion) || filled(product.altitude_label) || filled(soil)) && (
          <Section title={t("vineyard")}>
            <dl className="space-y-3 text-sm">
              {filled(product.subregion) && (
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-widest text-stone-400">{t("zone")}</dt>
                  <dd className="text-stone-700">{product.subregion}</dd>
                </div>
              )}
              {filled(product.altitude_label) && (
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-widest text-stone-400">{t("altitude")}</dt>
                  <dd className="text-stone-700">{product.altitude_label}</dd>
                </div>
              )}
              {filled(soil) && (
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-widest text-stone-400">{t("soil")}</dt>
                  <dd className="text-stone-700 leading-relaxed">{soil}</dd>
                </div>
              )}
            </dl>
          </Section>
        )}

        {/* d) Winemaking */}
        {filled(winemaking) && (
          <Section title={t("winemaking")}>
            {winemakingItems ? (
              <ul className="space-y-2 text-sm text-stone-700 leading-relaxed">
                {winemakingItems.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span aria-hidden className="mt-2 h-1.5 w-1.5 rounded-full bg-sun-500 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-stone-700 leading-relaxed">{winemaking}</p>
            )}
          </Section>
        )}

        {/* e) Tasting notes */}
        {(shownTastes.length > 0 || filled(notes)) && (
          <Section title={t("tasting")}>
            {shownTastes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {shownTastes.map(([label, value]) => (
                  <div key={label} className="rounded-xl bg-stone-50 border border-stone-100 p-4">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-sky-700 mb-1.5">{label}</h3>
                    <p className="text-sm text-stone-700 leading-relaxed">{value}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line">{notes!.split(". ").join(".\n")}</p>
            )}
          </Section>
        )}

        {/* f) Did you know */}
        {(filled(learnTitle) || filled(learnBody)) && (
          <aside className="rounded-2xl border border-sky-500/40 bg-gradient-to-b from-sky-500/15 to-sky-500/5 p-6 md:p-8">
            <h2 className="text-2xl font-serif font-bold text-brand-900 mb-2">{filled(learnTitle) ? learnTitle : t("didYouKnow")}</h2>
            {filled(learnBody) && <p className="text-sm text-stone-700 leading-relaxed">{learnBody}</p>}
          </aside>
        )}

        {/* g) The place */}
        {filled(terroir) && (
          <Section title={t("place")}>
            <p className="text-sm text-stone-700 leading-relaxed">{terroir}</p>
          </Section>
        )}

        {/* h) Pairing */}
        {filled(pairing) && (
          <Section title={t("pairing")} icon={ICONS.pairing}>
            <p className="text-sm text-stone-700 leading-relaxed">{pairing}</p>
          </Section>
        )}

        {/* i) Why we chose it */}
        {filled(why) && (
          <Section title={t("why")}>
            <p className="text-sm text-stone-700 leading-relaxed">{why}</p>
          </Section>
        )}

        {/* j) How to serve it */}
        {(filled(product.serve_temp) || filled(aging)) && (
          <Section title={t("howToServe")}>
            <dl className="space-y-3 text-sm">
              {filled(product.serve_temp) && (
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-widest text-stone-400">{t("temperature")}</dt>
                  <dd className="text-stone-700">{product.serve_temp}</dd>
                </div>
              )}
              {filled(aging) && (
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-widest text-stone-400">{t("aging")}</dt>
                  <dd className="text-stone-700 leading-relaxed">{aging}</dd>
                </div>
              )}
            </dl>
          </Section>
        )}
      </div>
    </article>
  );
}
