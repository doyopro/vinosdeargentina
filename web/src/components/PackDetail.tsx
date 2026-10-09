"use client";

import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useLocaleSwitch } from "@/lib/i18n";
import { useCart } from "@/lib/CartContext";
import { lineKey } from "@/lib/cart";
import { packBottleCount, packImages, packLoosePrice, packName, toPackLine } from "@/lib/packs";
import { PackCollage } from "@/components/PackCollage";
import { Pack } from "@/lib/types";

const eur = (n: number) => n.toFixed(2).replace(".", ",");
const filled = (v: string | null | undefined): v is string => typeof v === "string" && v.trim() !== "";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 md:p-8">
      <h2 className="text-2xl font-serif font-bold text-brand-900 mb-4">{title}</h2>
      {children}
    </section>
  );
}

export function PackDetail({ pack, others }: { pack: Pack; others: Pack[] }) {
  const t = useTranslations("packSheet");
  const tc = useTranslations();
  const { locale } = useLocaleSwitch();
  const { cart, addPack } = useCart();

  const pick = (es: string | null | undefined, en: string | null | undefined) =>
    locale === "en" ? (filled(en) ? en : es) : filled(es) ? es : en;

  const qty = cart[lineKey("pack", pack.id)]?.qty ?? 0;
  const bottles = packBottleCount(pack);
  const loose = packLoosePrice(pack);
  const saving = Math.round(loose - pack.price_retail);
  const soldOut = pack.items.some((i) => i.product.is_available === false);

  const description = pick(pack.description_es, pack.description_en);
  const proposal = pick(pack.proposal_es, pack.proposal_en);
  const proposalParagraphs = filled(proposal) ? proposal.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean) : [];
  const tip = pick(pack.tasting_tip_es, pack.tasting_tip_en);
  const occasion = pick(pack.occasion_es, pack.occasion_en);

  return (
    <article className="bg-stone-50">
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
            <div className="mt-5 text-[11px] font-bold uppercase tracking-widest text-sky-500">{pack.collection || t("label")}</div>
            <h1 className="mt-2 text-4xl md:text-6xl font-serif font-bold text-white leading-tight">{packName(pack, locale)}</h1>
            {filled(description) && <p className="mt-3 text-stone-300 leading-relaxed max-w-xl">{description}</p>}
            <ul className="mt-5 flex flex-wrap gap-2">
              <li className="px-3.5 py-1 rounded-full border border-sky-500/50 text-sky-500 text-xs font-medium">
                {t("bottlesLine", { n: bottles })}
              </li>
              {saving > 0 && (
                <li className="px-3.5 py-1 rounded-full bg-green-100 text-green-800 text-xs font-bold">{tc("packSave", { n: saving })}</li>
              )}
            </ul>

            <div className="mt-7">
              <div className="text-3xl font-serif font-bold text-white">
                {t("perPack", { price: eur(pack.price_retail) })}{" "}
                <span className="text-[11px] font-sans font-normal text-stone-400">{tc("incTax")}</span>
              </div>
              {saving > 0 && (
                <div className="mt-1 text-sm text-stone-400">
                  {t("looseValue")}: <s>{eur(loose)} €</s>
                </div>
              )}
              <div className="mt-5 max-w-md">
                {soldOut ? (
                  <div className="h-12 flex items-center justify-center rounded-lg bg-white/10 text-stone-300 text-xs font-bold uppercase tracking-widest">
                    {t("soldOut")}
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-white/10 text-white rounded-lg h-12">
                      <button onClick={() => addPack(toPackLine(pack, locale), -1)} aria-label={tc("cartDecrease")} className="w-11 font-bold text-lg">
                        −
                      </button>
                      <span className="w-9 text-center text-sm font-bold" aria-live="polite">
                        {qty}
                      </span>
                      <button onClick={() => addPack(toPackLine(pack, locale), 1)} aria-label={tc("cartIncrease")} className="w-11 font-bold text-lg">
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => addPack(toPackLine(pack, locale), 1)}
                      className="flex-grow h-12 bg-sun-500 hover:bg-sun-600 text-brand-900 font-bold rounded-lg text-xs uppercase tracking-widest transition-colors"
                    >
                      {t("addPack")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="relative h-72 md:h-[26rem] order-first md:order-none flex items-end justify-center">
            <PackCollage images={packImages(pack)} />
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-5 py-10 md:py-14 space-y-6">
        {proposalParagraphs.length > 0 && (
          <Section title={t("proposal")}>
            <div className="space-y-3 text-sm text-stone-700 leading-relaxed">
              {proposalParagraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </Section>
        )}

        <Section title={t("wines")}>
          <ul className="space-y-4">
            {pack.items.map(({ bottles: n, product: w }) => {
              const profile = (pick(w.profile_es, w.profile_en) || "")
                .split("·")
                .map((c) => c.trim())
                .filter(Boolean);
              const pairing = pick(w.pairing_es, w.pairing_en);
              const place = [w.grape, w.subregion, w.altitude_label].filter(filled).join(" · ");
              return (
                <li key={w.id} className="flex gap-4 rounded-xl border border-stone-100 bg-stone-50 p-4">
                  <div className="relative w-16 h-28 flex-shrink-0">
                    {w.image_url && (
                      <Image src={w.image_url} alt={w.name} fill sizes="64px" className="object-contain drop-shadow-[0_6px_8px_rgba(15,42,68,0.25)]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-grow">
                    <h3 className="font-serif font-bold text-brand-900 text-lg leading-snug">
                      {n > 1 ? `${n} × ` : ""}
                      {w.name}
                    </h3>
                    {place && <p className="text-xs text-stone-500 mt-0.5">{place}</p>}
                    {profile.length > 0 && (
                      <ul className="mt-2 flex flex-wrap gap-1.5">
                        {profile.map((chip) => (
                          <li key={chip} className="px-2.5 py-0.5 rounded-full border border-sky-500/50 text-sky-700 text-[11px] font-medium">
                            {chip}
                          </li>
                        ))}
                      </ul>
                    )}
                    {(filled(w.serve_temp) || filled(pairing)) && (
                      <dl className="mt-3 space-y-1 text-[13px] text-stone-600">
                        {filled(w.serve_temp) && (
                          <div>
                            <dt className="inline font-bold text-stone-400 uppercase tracking-widest text-[10px]">{t("serve")} </dt>
                            <dd className="inline">{w.serve_temp}</dd>
                          </div>
                        )}
                        {filled(pairing) && (
                          <div>
                            <dt className="inline font-bold text-stone-400 uppercase tracking-widest text-[10px]">{t("pairing")} </dt>
                            <dd className="inline">{pairing}</dd>
                          </div>
                        )}
                      </dl>
                    )}
                    {w.sku && (
                      <Link
                        href={`/vino/${w.sku}`}
                        className="mt-3 inline-block text-[10px] font-bold uppercase tracking-widest text-brand-800 underline underline-offset-2"
                      >
                        {t("viewWine")}
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </Section>

        {(filled(tip) || filled(occasion)) && (
          <Section title={t("enjoy")}>
            <div className="space-y-4 text-sm text-stone-700 leading-relaxed">
              {filled(tip) && <p>{tip}</p>}
              {filled(occasion) && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400">{t("idealFor")}</div>
                  <p>{occasion}</p>
                </div>
              )}
            </div>
          </Section>
        )}

        {others.length > 0 && (
          <Section title={t("others")}>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {others.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/pack/${o.slug}`}
                    className="block rounded-xl border border-stone-100 bg-stone-50 hover:border-sky-500/60 p-4 transition-colors"
                  >
                    <div className="font-serif font-bold text-brand-900">{packName(o, locale)}</div>
                    <div className="text-xs text-stone-500 mt-0.5">
                      {t("bottlesLine", { n: packBottleCount(o) })} · {eur(o.price_retail)} €
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </Section>
        )}
      </div>
    </article>
  );
}
