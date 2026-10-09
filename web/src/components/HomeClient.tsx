"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { LanguageToggle } from "@/components/LanguageToggle";
import { CartFab } from "@/components/CartFab";
import { FooterLinks } from "@/components/FooterLinks";
import { PartnerStrip } from "@/components/PartnerStrip";
import { Wordmark } from "@/components/Wordmark";
import { Tagline } from "@/components/Tagline";
import { WineCard } from "@/components/WineCard";
import { HeroCollage } from "@/components/HeroCollage";
import glowStyles from "@/app/HeroTextGlow.module.css";
import { useCart } from "@/lib/CartContext";
import { SpecialSelection } from "@/components/SpecialSelection";
import { lineKey } from "@/lib/cart";
import { CatalogWine, Pack, Region, WineType } from "@/lib/types";

const REGIONS: Region[] = ["cuyo", "norte", "patagonia"];
const PROVINCIAS = ["Mendoza", "San Juan", "Salta", "Jujuy", "Patagonia"];

export function HomeClient({ wines: catalogData, packs }: { wines: CatalogWine[]; packs: Pack[] }) {
  const t = useTranslations();
  const { cart, add } = useCart();
  const [typeFilter, setTypeFilter] = useState<Set<WineType>>(new Set());
  const [provinciaFilter, setProvinciaFilter] = useState<Set<string>>(new Set());
  const [sortPrice, setSortPrice] = useState<"default" | "asc" | "desc">("default");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const updateQty = (id: string, change: number) => {
    const wine = catalogData.find((w) => w.id === id);
    if (wine) add(wine, change);
  };

  const toggleType = (value: WineType | "all") => {
    setTypeFilter((prev) => {
      if (value === "all") return new Set();
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  const toggleProvincia = (value: string) => {
    setProvinciaFilter((prev) => {
      if (value === "todas_prov") return new Set();
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  const activeFilterCount = typeFilter.size + provinciaFilter.size + (sortPrice !== "default" ? 1 : 0);
  const isFiltering = typeFilter.size > 0 || provinciaFilter.size > 0 || sortPrice !== "default";

  const filtered = useMemo(() => {
    let list = catalogData.filter((w) => {
      if (typeFilter.size > 0 && !typeFilter.has(w.type)) return false;
      if (provinciaFilter.size > 0 && !provinciaFilter.has(w.provincia)) return false;
      return true;
    });
    // Featured wines are shown in "Recomendados" AND stay in their region
    // sections, so each region lists its whole catalog.
    const availFirst = (a: CatalogWine, b: CatalogWine) => Number(b.is_available) - Number(a.is_available);
    if (sortPrice === "asc") list = [...list].sort((a, b) => availFirst(a, b) || a.price - b.price);
    else if (sortPrice === "desc") list = [...list].sort((a, b) => availFirst(a, b) || b.price - a.price);
    return list;
  }, [catalogData, typeFilter, provinciaFilter, sortPrice]);

  const featuredWines = useMemo(
    () => catalogData.filter((w) => w.is_featured && w.is_available),
    [catalogData]
  );

  const filterBtnCls = (active: boolean) =>
    active
      ? "filter-btn bg-brand-900 text-white border-brand-900 border px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-full shadow-sm transition-colors"
      : "filter-btn bg-white text-stone-600 border-stone-200 border px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-full shadow-sm hover:border-brand-700 transition-colors";

  const provinciaBtnCls = (active: boolean) =>
    active
      ? "filter-btn bg-brand-900 text-white border-brand-900 border px-4 py-2 text-[10px] font-bold uppercase rounded-full transition-colors"
      : "filter-btn bg-white text-stone-600 border-stone-200 border px-4 py-2 text-[10px] font-bold uppercase rounded-full hover:border-brand-700";

  return (
    <>
      <div className="canary-stripe h-2.5 w-full fixed top-0 z-[100] shadow-md" />
      <LanguageToggle />

      <header className="relative bg-brand-900 pt-28 pb-20 px-4 sm:pt-32 sm:pb-24 sm:px-6 lg:pt-40 lg:pb-32 overflow-hidden">
        <HeroCollage />

        <div className="max-w-5xl mx-auto relative z-10 text-center flex flex-col items-center mt-6 isolate">
          {/* Radial glow sized to the text block itself (not the whole,
              content-driven header height) so it reliably darkens behind the
              copy at every breakpoint while the collage's edges stay vivid.
              isolate (above) + an explicit negative z-index here pin this
              behind the text regardless of paint-order quirks between dev
              and the production build. */}
          <div aria-hidden className={`${glowStyles.glow} -z-10`} />
          <div className="relative inline-flex items-center justify-center gap-2 sm:gap-3 max-w-full px-4 sm:px-5 py-2 rounded-full bg-brand-900/60 border border-sky-500/40 backdrop-blur-md mb-6 sm:mb-8">
            <svg className="hidden sm:block w-4 h-4 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            <span className="text-[10px] font-semibold text-sky-500 tracking-[0.14em] sm:tracking-[0.24em] uppercase text-center leading-snug">{t("badge")}</span>
          </div>
          <h1
            className="relative text-[clamp(1.9rem,8.6vw,3.75rem)] sm:text-6xl md:text-7xl lg:text-8xl font-serif text-white mb-6 sm:mb-8 tracking-[-0.015em] leading-tight whitespace-nowrap"
            style={{ textShadow: "0 2px 20px rgba(10,28,46,0.6)" }}
          >
            <Wordmark />
          </h1>
          <div className="relative flex flex-col w-28 sm:w-36 md:w-44 h-2 mb-6 sm:mb-8 rounded-sm overflow-hidden">
            <div className="h-1/3 w-full bg-[#74ACDF]" />
            <div className="h-1/3 w-full bg-white" />
            <div className="h-1/3 w-full bg-[#74ACDF]" />
          </div>
          <p
            className="relative text-[clamp(1rem,4.2vw,1.2rem)] sm:text-xl md:text-2xl text-stone-100 font-light text-balance max-w-[30ch] sm:max-w-xl md:max-w-2xl mx-auto leading-relaxed mb-8 sm:mb-10"
            style={{ textShadow: "0 1px 12px rgba(10,28,46,0.6)" }}
          >
            {t("heroSubtitle")}
          </p>
          <a
            href="#catalog"
            className="relative bg-sun-500 hover:bg-sun-600 text-brand-900 font-bold px-8 sm:px-10 py-4 sm:py-5 rounded-sm transition-colors uppercase tracking-widest text-xs shadow-xl"
          >
            {t("exploreCatalog")} <span aria-hidden>→</span>
          </a>
          <p className="relative mt-6 text-[10px] sm:text-[11px] tracking-[0.18em] uppercase text-stone-200/80 text-balance max-w-[34ch] sm:max-w-none">
            {t("heroPerks")}
          </p>
        </div>
      </header>

      <main id="catalog" className="max-w-6xl mx-auto px-4 py-12 md:py-16 space-y-16">
        <section className="mb-8! space-y-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-serif text-brand-900">{t("catalogTitle")}</h2>
            <p className="mt-2 text-xs md:text-sm text-stone-500 leading-relaxed">{t("catalogInfo")}</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setFiltersOpen((o) => !o)}
              aria-expanded={filtersOpen}
              aria-controls="filters-panel"
              className="flex-none inline-flex items-center gap-2 bg-white text-brand-900 border border-stone-200 px-4 h-11 text-[10px] font-bold uppercase tracking-widest rounded-lg shadow-sm hover:border-brand-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M7 12h10M10 18h4" />
              </svg>
              {t("filters.title")}
              {activeFilterCount > 0 && (
                <span className="bg-sun-500 text-brand-900 rounded-full min-w-5 h-5 px-1 flex items-center justify-center text-[10px]">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <select
              value={sortPrice}
              onChange={(e) => setSortPrice(e.target.value as "default" | "asc" | "desc")}
              aria-label={t("sort.default")}
              className="flex-1 sm:flex-none sm:w-60 min-w-0 bg-white text-stone-600 border border-stone-200 px-3 h-11 text-[10px] font-bold uppercase rounded-lg shadow-sm focus:outline-none"
            >
              <option value="default">{t("sort.default")}</option>
              <option value="asc">{t("sort.asc")}</option>
              <option value="desc">{t("sort.desc")}</option>
            </select>
          </div>

          {filtersOpen && (
            <div id="filters-panel" className="rounded-xl border border-stone-200 bg-white p-4 md:p-5 space-y-5 shadow-sm">
              <div>
                <div className="text-[10px] font-bold uppercase text-stone-400 tracking-widest mb-2">{t("filters.type")}</div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => toggleType("all")} className={filterBtnCls(typeFilter.size === 0)}>
                    {t("filters.all")}
                  </button>
                  <button onClick={() => toggleType("tinto")} className={filterBtnCls(typeFilter.has("tinto"))}>
                    {t("filters.tinto")}
                  </button>
                  <button onClick={() => toggleType("blanco")} className={filterBtnCls(typeFilter.has("blanco"))}>
                    {t("filters.blanco")}
                  </button>
                  <button onClick={() => toggleType("rosado")} className={filterBtnCls(typeFilter.has("rosado"))}>
                    {t("filters.rosado")}
                  </button>
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase text-stone-400 tracking-widest mb-2">{t("filters.provincia")}</div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => toggleProvincia("todas_prov")} className={provinciaBtnCls(provinciaFilter.size === 0)}>
                    {t("filters.todas")}
                  </button>
                  {PROVINCIAS.map((p) => (
                    <button key={p} onClick={() => toggleProvincia(p)} className={provinciaBtnCls(provinciaFilter.has(p))}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              {isFiltering && (
                <button
                  type="button"
                  onClick={() => {
                    setTypeFilter(new Set());
                    setProvinciaFilter(new Set());
                    setSortPrice("default");
                  }}
                  className="text-xs font-semibold text-brand-700 underline underline-offset-2"
                >
                  {t("filters.clear")}
                </button>
              )}
            </div>
          )}
        </section>

        {!isFiltering && featuredWines.length > 0 && (
          <section aria-labelledby="featured-title" className="rounded-2xl border border-sky-500/30 bg-gradient-to-b from-sky-500/10 to-transparent p-5 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="h-px w-8 bg-sun-500" aria-hidden />
              <h3 id="featured-title" className="text-3xl font-serif text-brand-900">
                {t("featuredTitle")}
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredWines.map((w) => (
                <WineCard key={`featured-${w.id}`} wine={w} qty={cart[lineKey("product", w.id)]?.qty ?? 0} onChangeQty={updateQty} />
              ))}
            </div>
          </section>
        )}

        {!isFiltering && <SpecialSelection packs={packs} />}

        {REGIONS.map((region) => {
          const wines = filtered.filter((w) => w.region === region);
          if (wines.length === 0) return null;
          return (
            <section key={region} className="region-section mt-16 first:mt-0">
              <h3 className="text-3xl font-serif text-stone-900 mb-6">{t(`region.${region}`)}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {wines.map((w) => (
                  <WineCard key={w.id} wine={w} qty={cart[lineKey("product", w.id)]?.qty ?? 0} onChangeQty={updateQty} />
                ))}
              </div>
            </section>
          );
        })}

        {filtered.length === 0 && (
          <div className="py-16 text-center text-stone-400 italic">{t("noResults")}</div>
        )}

        <div className="mt-12 text-center text-sm text-stone-500 bg-stone-50 py-5 px-6 rounded-lg border border-stone-200 shadow-sm flex items-center justify-center gap-3">
          <svg className="w-6 h-6 text-stone-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="leading-relaxed text-[13px] md:text-sm">
            <strong>{t("logisticsNoteStrong")}</strong> {t("logisticsNote")}
          </p>
        </div>

        <PartnerStrip />
      </main>

      <div className="picon-bg">
      <section className="text-stone-100 py-10 md:py-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <svg className="w-8 h-8 mx-auto text-sky-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <h2 className="text-2xl md:text-3xl font-serif text-white mb-3">{t("horecaTitle")}</h2>
          <p className="text-base font-light leading-relaxed max-w-xl mx-auto mb-6">{t("horecaSubtitle")}</p>
          <a
            href="https://wa.me/34633706676"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-6 py-3 border border-stone-300/70 text-white hover:border-sky-500 rounded-sm transition-colors uppercase tracking-widest text-xs font-bold shadow-lg bg-black/30"
          >
            {t("horecaCta")}
          </a>
        </div>
      </section>

      <footer className="border-t border-sun-500/40 pt-16 pb-12 px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
          <Wordmark className="font-serif text-3xl md:text-4xl tracking-wide drop-shadow-md" />
          <Tagline className="mt-2 mb-6" />
          <div className="w-24 h-px bg-sun-500/30 mb-6" />
          <FooterLinks className="mb-6" />
          <p className="text-stone-300 text-xs font-light mb-4">{t("footerCopyright")}</p>
          <a
            href="https://www.doyo.pro/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-stone-400 hover:text-sky-500 transition-colors text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 group mt-2"
          >
            {t("poweredBy")}
            <svg
              className="w-3 h-3 group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        </div>
      </footer>
      </div>

      <CartFab />
    </>
  );
}
