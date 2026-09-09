"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { LanguageToggle } from "@/components/LanguageToggle";
import { WineCard } from "@/components/WineCard";
import { CartDrawer } from "@/components/CartDrawer";
import { supabase } from "@/lib/supabase";
import { getProvinciaBodega } from "@/lib/bodegaProvincia";
import { loadCart, saveCart } from "@/lib/cart";
import { Cart, CatalogWine, Product, Region, WineType } from "@/lib/types";

export const dynamic = "force-dynamic";

const REGIONS: Region[] = ["cuyo", "norte", "patagonia"];
const PROVINCIAS = ["Mendoza", "San Juan", "Salta", "Jujuy", "Patagonia"];

export default function Home() {
  const t = useTranslations();
  const [catalogData, setCatalogData] = useState<CatalogWine[]>([]);
  const [cart, setCart] = useState<Cart>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<Set<WineType>>(new Set());
  const [provinciaFilter, setProvinciaFilter] = useState<Set<string>>(new Set());
  const [sortPrice, setSortPrice] = useState<"default" | "asc" | "desc">("default");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read persisted cart once after mount (localStorage is client-only)
    setCart(loadCart());
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, sku, name, price_retail, created_at, bodega, region, type, box_size, aiem_rate, igic_rate, notes_es, notes_en, stock, image_url, is_available");
      if (error) {
        console.error("Error getWines:", error);
        return;
      }
      if (!active || !data) return;
      const wines: CatalogWine[] = (data as Product[])
        .map((p) => ({
          id: p.id,
          type: p.type,
          region: p.region,
          provincia: getProvinciaBodega(p.bodega),
          box: p.box_size,
          price: (p.price_retail || 0) / 1.07,
          bodega: p.bodega,
          name: p.name,
          notes_es: p.notes_es,
          notes_en: p.notes_en,
          image_url: p.image_url,
          is_available: p.is_available,
        }))
        .sort((a, b) => {
          if (a.bodega === "Buenos Aires" && b.bodega !== "Buenos Aires") return -1;
          if (b.bodega === "Buenos Aires" && a.bodega !== "Buenos Aires") return 1;
          const bOrder = (a.bodega || "").localeCompare(b.bodega || "");
          if (bOrder !== 0) return bOrder;
          return a.price - b.price;
        });
      setCatalogData(wines);
    })();
    return () => {
      active = false;
    };
  }, []);

  const updateQty = (id: string, change: number) => {
    setCart((prev) => {
      const wine = catalogData.find((w) => w.id === id);
      if (!wine) return prev;
      const qty = (prev[id] ? prev[id].qty : 0) + change;
      const next = { ...prev };
      if (qty > 0) next[id] = { ...wine, qty };
      else delete next[id];
      saveCart(next);
      return next;
    });
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

  const filtered = useMemo(() => {
    let list = catalogData.filter((w) => {
      if (typeFilter.size > 0 && !typeFilter.has(w.type)) return false;
      if (provinciaFilter.size > 0 && !provinciaFilter.has(w.provincia)) return false;
      return true;
    });
    if (sortPrice === "asc") list = [...list].sort((a, b) => a.price - b.price);
    else if (sortPrice === "desc") list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [catalogData, typeFilter, provinciaFilter, sortPrice]);

  const cartCount = Object.values(cart).reduce((sum, item) => sum + item.qty, 0);

  const filterBtnCls = (active: boolean) =>
    active
      ? "filter-btn bg-wine-900 text-white border-wine-900 border px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-full shadow-sm transition-colors"
      : "filter-btn bg-white text-stone-600 border-stone-200 border px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-full shadow-sm hover:border-wine-700 transition-colors";

  const provinciaBtnCls = (active: boolean) =>
    active
      ? "filter-btn bg-wine-900 text-white border-wine-900 border px-4 py-2 text-[10px] font-bold uppercase rounded-full transition-colors"
      : "filter-btn bg-white text-stone-600 border-stone-200 border px-4 py-2 text-[10px] font-bold uppercase rounded-full hover:border-wine-700";

  return (
    <>
      <div className="canary-stripe h-2.5 w-full fixed top-0 z-[100] shadow-md" />
      <LanguageToggle />

      <header className="relative bg-wine-900 pt-32 pb-24 px-6 lg:pt-40 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1506377247377-2a5b3b0ca7df?auto=format&fit=crop&q=80&w=2070"
            alt="Viñedos"
            className="w-full h-full object-cover object-center opacity-[0.15] mix-blend-luminosity"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-wine-900 via-wine-900/90 to-transparent" />
        </div>

        <div className="max-w-5xl mx-auto relative z-10 text-center flex flex-col items-center mt-6">
          <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/5 border border-gold-500/30 backdrop-blur-md mb-8 shadow-[0_0_15px_rgba(200,159,93,0.2)]">
            <svg className="w-4 h-4 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            <span className="text-[10px] font-bold text-gold-500 tracking-[0.2em] uppercase">{t("badge")}</span>
          </div>
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-serif text-white mb-8 tracking-tight drop-shadow-lg">
            {t("heroTitle")}
          </h1>
          <div className="flex flex-col w-56 md:w-64 h-3 md:h-4 mb-10 rounded-sm overflow-hidden border border-white/10">
            <div className="h-1/3 w-full bg-[#74ACDF]" />
            <div className="h-1/3 w-full bg-white" />
            <div className="h-1/3 w-full bg-[#74ACDF]" />
          </div>
          <p className="text-2xl md:text-3xl text-stone-100 font-light max-w-3xl mx-auto leading-relaxed mb-10 italic drop-shadow-md">
            {t("heroSubtitle")}
          </p>
          <a
            href="#catalog"
            className="bg-gold-500 hover:bg-gold-600 text-wine-900 font-bold px-10 py-5 rounded-sm transition-colors uppercase tracking-widest text-xs shadow-xl"
          >
            {t("exploreCatalog")}
          </a>
        </div>
      </header>

      <main id="catalog" className="max-w-6xl mx-auto px-4 py-20 space-y-16">
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 pb-6 border-b border-stone-200">
          <div>
            <h2 className="text-4xl font-serif text-wine-900">{t("catalogTitle")}</h2>
            <p className="text-stone-500 mt-2 font-medium">{t("catalogSubtitle")}</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-6">
          <div className="flex flex-wrap gap-2 md:gap-3">
            <button onClick={() => toggleType("all")} className={filterBtnCls(typeFilter.size === 0)}>
              {t("filters.all")}
            </button>
            <div className="w-px h-6 bg-stone-300 mx-1 hidden sm:block self-center" />
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
          <div className="flex flex-wrap gap-3 w-full lg:w-auto">
            <select
              value={sortPrice}
              onChange={(e) => setSortPrice(e.target.value as "default" | "asc" | "desc")}
              className="bg-white text-stone-600 border border-stone-200 px-4 py-2.5 text-[10px] font-bold uppercase rounded-md shadow-sm focus:outline-none w-full sm:w-auto"
            >
              <option value="default">{t("sort.default")}</option>
              <option value="asc">{t("sort.asc")}</option>
              <option value="desc">{t("sort.desc")}</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-10 pb-6 border-b border-stone-100">
          <div className="text-xs font-bold uppercase text-stone-400 tracking-widest py-2.5 pr-2">
            {t("filters.provincia")}
          </div>
          <button onClick={() => toggleProvincia("todas_prov")} className={provinciaBtnCls(provinciaFilter.size === 0)}>
            {t("filters.todas")}
          </button>
          {PROVINCIAS.map((p) => (
            <button key={p} onClick={() => toggleProvincia(p)} className={provinciaBtnCls(provinciaFilter.has(p))}>
              {p}
            </button>
          ))}
        </div>

        {REGIONS.map((region) => {
          const wines = filtered.filter((w) => w.region === region);
          if (wines.length === 0) return null;
          return (
            <section key={region} className="region-section mt-16 first:mt-0">
              <h3 className="text-3xl font-serif text-stone-900 mb-6">{t(`region.${region}`)}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {wines.map((w) => (
                  <WineCard key={w.id} wine={w} qty={cart[w.id]?.qty ?? 0} onChangeQty={updateQty} />
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
      </main>

      <section className="bg-stone-900 text-stone-300 py-20 px-6 border-t-4 border-wine-800">
        <div className="max-w-4xl mx-auto text-center">
          <svg className="w-12 h-12 mx-auto text-gold-500 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <h2 className="text-3xl md:text-4xl font-serif text-white mb-6">{t("horecaTitle")}</h2>
          <p className="text-lg font-light leading-relaxed max-w-2xl mx-auto mb-10">{t("horecaSubtitle")}</p>
          <a
            href="https://wa.me/34633706676"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 border border-stone-600 hover:border-gold-500 hover:text-white rounded-sm transition-colors uppercase tracking-widest text-xs font-bold shadow-lg bg-white/5"
          >
            {t("horecaCta")}
          </a>
        </div>
      </section>

      <footer className="bg-wine-900 pt-16 pb-12 px-6 border-t border-wine-800 relative z-10">
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-serif text-white tracking-wide mb-6 drop-shadow-md leading-relaxed">
            Vinos de Altura <span className="text-gold-500 mx-2 hidden md:inline">·</span>
            <br className="md:hidden" />
            Canarias <span className="text-gold-500 mx-2">·</span> Lanzarote{" "}
            <span className="text-gold-500 mx-2">·</span> Islas Canarias
          </h2>
          <div className="w-24 h-px bg-gold-500/30 mb-8" />
          <p className="text-stone-400 text-xs font-light mb-4">{t("footerCopyright")}</p>
          <a
            href="https://www.doyo.pro/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-stone-500 hover:text-gold-500 transition-colors text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 group mt-2"
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

      <button
        onClick={() => setCartOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-wine-900 hover:bg-wine-800 text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 border border-wine-700 group"
      >
        <svg className="w-6 h-6 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
          />
        </svg>
        {cartCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-gold-500 text-wine-900 text-[10px] font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-wine-900">
            {cartCount}
          </span>
        )}
      </button>

      <CartDrawer cart={cart} open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
