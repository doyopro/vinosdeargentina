"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { StripeElements, StripePaymentElement } from "@stripe/stripe-js";
import { LanguageToggle } from "@/components/LanguageToggle";
import { supabase } from "@/lib/supabase";
import { loadCart } from "@/lib/cart";
import { getStripe, EDGE_FUNCTION_URL } from "@/lib/stripeClient";
import { CUSTOMER_INFO_KEY, CustomerInfo, EMPTY_PROMO, PromoAplicado, Promotion, resolveDiscount } from "@/lib/order";
import { Cart } from "@/lib/types";

export const dynamic = "force-dynamic";

const ISLANDS = ["Tenerife", "Gran Canaria", "La Palma", "La Gomera", "El Hierro", "Fuerteventura", "Lanzarote"];

export default function CheckoutPage() {
  const t = useTranslations("checkoutPage");

  const [cart, setCart] = useState<Cart>({});
  const [ready, setReady] = useState(false);
  const [allPromotions, setAllPromotions] = useState<Promotion[]>([]);
  const [promoAplicado, setPromoAplicado] = useState<PromoAplicado>(EMPTY_PROMO);
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [promoMessage, setPromoMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [island, setIsland] = useState("");
  const [address, setAddress] = useState("");
  const [postal, setPostal] = useState("");
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const [submitting, setSubmitting] = useState(false);
  const [stripeError, setStripeError] = useState("");

  const stripeContainerRef = useRef<HTMLDivElement>(null);
  const elementsRef = useRef<StripeElements | null>(null);
  const paymentElementRef = useRef<StripePaymentElement | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is client-only, read once after mount
    setCart(loadCart());
    setReady(true);
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("promotions").select("*").eq("is_active", true);
      if (data && data.length > 0) setAllPromotions(data as Promotion[]);
    })();
  }, []);

  const items = useMemo(() => Object.values(cart), [cart]);

  const { importeBruto, valorDescuento, baseImponible, igicAmount, totalAmount, labelDescuento, descuentoAplicado } =
    useMemo(() => {
      const subtotal = items.reduce((sum, item) => sum + (item.price || 0) * (item.qty || 1) * (item.box || 1), 0);
      const { descuentoAplicado, labelDescuento } = resolveDiscount(subtotal, allPromotions, promoAplicado);
      const valorDescuento = subtotal * descuentoAplicado;
      const baseImponible = subtotal - valorDescuento;
      const igicAmount = baseImponible * 0.07;
      const totalAmount = baseImponible + igicAmount;
      return {
        importeBruto: subtotal,
        valorDescuento,
        baseImponible,
        igicAmount,
        totalAmount,
        labelDescuento,
        descuentoAplicado,
      };
    }, [items, allPromotions, promoAplicado]);

  // Mount Stripe Payment Element once we know the cart is non-empty (mirrors checkout.html's init())
  useEffect(() => {
    if (!ready || items.length === 0 || !stripeContainerRef.current) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(EDGE_FUNCTION_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ amount: totalAmount }),
        });
        const { clientSecret } = await res.json();
        if (cancelled) return;
        const stripe = await getStripe();
        if (!stripe || !stripeContainerRef.current) return;
        const elements = stripe.elements({ clientSecret });
        const paymentElement = elements.create("payment");
        paymentElement.mount(stripeContainerRef.current);
        elementsRef.current = elements;
        paymentElementRef.current = paymentElement;
      } catch (e) {
        console.error("Error inicializando Stripe:", e);
      }
    })();

    return () => {
      cancelled = true;
      paymentElementRef.current?.unmount();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount once when cart becomes available, like the original init()
  }, [ready, items.length]);

  async function applyPromo() {
    const codigo = promoCodeInput.trim().toUpperCase();
    setPromoAplicado(EMPTY_PROMO);

    if (!codigo) {
      setPromoMessage(null);
      return;
    }

    try {
      const promo = allPromotions.find((p) => p.code && p.code.toUpperCase() === codigo);
      if (promo) {
        const rawVal = Number(promo.discount_value);
        const pct = rawVal > 1 ? rawVal / 100 : rawVal;
        setPromoAplicado({ codigo, tipo: "CODIGO", descuento: pct, codigoNombre: codigo });
        setPromoMessage({ text: t("promoCouponApplied", { code: codigo, pct: rawVal > 1 ? rawVal : (rawVal * 100).toFixed(0) }), ok: true });
        return;
      }

      const { data: reseller } = await supabase
        .from("resellers")
        .select("id, code, name, is_active")
        .ilike("code", codigo)
        .eq("is_active", true)
        .single();

      if (reseller) {
        setPromoAplicado({ codigo, tipo: "RESELLER", descuento: 0, codigoNombre: reseller.name });
        setPromoMessage({ text: t("promoResellerApplied", { name: reseller.name }), ok: true });
        return;
      }

      setPromoMessage({ text: t("promoInvalid"), ok: false });
    } catch (err) {
      console.error("Error validando código:", err);
      setPromoMessage({ text: t("promoError"), ok: false });
    }
  }

  function validateForm() {
    const fields: Record<string, string> = { name, email, island, address, postal };
    const nextErrors: Record<string, boolean> = {};
    let valid = true;
    for (const key of Object.keys(fields)) {
      if (!fields[key].trim()) {
        nextErrors[key] = true;
        valid = false;
      }
    }
    setErrors(nextErrors);
    return valid;
  }

  async function handlePayment() {
    if (!validateForm()) return;
    if (!elementsRef.current) return;

    setSubmitting(true);
    setStripeError("");

    try {
      const stripe = await getStripe();
      if (!stripe) throw new Error("Stripe failed to load");

      await elementsRef.current.submit();

      const customerInfo: CustomerInfo = {
        name,
        email,
        phone,
        island,
        address,
        postal_code: postal,
        promo_code: promoAplicado.codigo || "SIN CODIGO",
        promo_type: promoAplicado.tipo || "NINGUNO",
      };
      window.localStorage.setItem(CUSTOMER_INFO_KEY, JSON.stringify(customerInfo));

      const res = await fetch(EDGE_FUNCTION_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount: totalAmount }),
      });
      const { clientSecret } = await res.json();

      const { error } = await stripe.confirmPayment({
        elements: elementsRef.current,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/confirmation`,
        },
      });

      if (error) throw new Error(error.message);
    } catch (err) {
      console.error("Error crítico en proceso:", err);
      setStripeError(err instanceof Error ? err.message : String(err));
      setSubmitting(false);
    }
  }

  const inputCls = (field: string) =>
    `p-3 border rounded-lg focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 outline-none transition-all ${
      errors[field] ? "border-red-500 bg-red-50" : "border-stone-200"
    }`;

  return (
    <>
      <div className="canary-stripe h-2 w-full fixed top-0 z-[100]" />
      <LanguageToggle />

      <div className="max-w-6xl mx-auto px-4 py-12 md:py-20">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-sm font-semibold text-wine-800 hover:text-gold-600 transition-colors">
            &larr; {t("backToShop")}
          </Link>
        </div>

        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-serif text-wine-900 mb-4">{t("title")}</h1>
          <p className="text-stone-500 font-medium">{t("subtitle")}</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 order-2 lg:order-1 bg-white p-6 md:p-10 rounded-2xl shadow-sm border border-stone-100">
            {ready && items.length === 0 ? (
              <div className="text-center py-10">
                <p>{t("emptyCart")}</p>
                <Link href="/" className="mt-4 inline-block text-gold-600 underline text-sm">
                  {t("backToShopLink")}
                </Link>
              </div>
            ) : (
              <div>
                <div className="mb-10">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="w-8 h-8 rounded-full bg-wine-900 text-white flex items-center justify-center text-sm font-bold">
                      1
                    </span>
                    <h2 className="text-xl font-serif text-wine-900 font-bold">{t("step1")}</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">{t("fullName")}</label>
                      <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls("name")} />
                      {errors.name && <span className="text-red-500 text-xs mt-1">{t("nameRequired")}</span>}
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">{t("email")}</label>
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls("email")} />
                      {errors.email && <span className="text-red-500 text-xs mt-1">{t("emailInvalid")}</span>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">{t("phone")}</label>
                      <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls("phone")} />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">{t("island")}</label>
                      <select value={island} onChange={(e) => setIsland(e.target.value)} className={`${inputCls("island")} appearance-none bg-white`}>
                        <option value="">{t("selectIsland")}</option>
                        {ISLANDS.map((i) => (
                          <option key={i} value={i}>
                            {i}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col mb-5">
                    <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">{t("address")}</label>
                    <input value={address} onChange={(e) => setAddress(e.target.value)} className={inputCls("address")} />
                  </div>

                  <div className="flex flex-col w-full md:w-1/2">
                    <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">{t("postal")}</label>
                    <input value={postal} onChange={(e) => setPostal(e.target.value)} className={inputCls("postal")} />
                  </div>
                </div>

                <div className="mb-10">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="w-8 h-8 rounded-full bg-wine-900 text-white flex items-center justify-center text-sm font-bold">
                      2
                    </span>
                    <h2 className="text-xl font-serif text-wine-900 font-bold">{t("step2")}</h2>
                  </div>
                  <div ref={stripeContainerRef} className="p-4 border border-stone-200 rounded-xl bg-stone-50" />
                  {stripeError && <div className="mt-4 text-red-500 text-sm font-medium">{stripeError}</div>}
                </div>

                <div className="mb-8">
                  <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3 block">{t("promoLabel")}</label>
                  <div className="flex gap-2">
                    <input
                      value={promoCodeInput}
                      onChange={(e) => setPromoCodeInput(e.target.value)}
                      placeholder={t("promoPlaceholder")}
                      className="flex-1 p-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 outline-none transition-all text-sm"
                    />
                    <button
                      type="button"
                      onClick={applyPromo}
                      className="px-6 py-3 bg-gold-500 hover:bg-gold-600 text-wine-900 font-bold rounded-lg transition-all text-[10px] uppercase tracking-widest shadow-sm"
                    >
                      {t("apply")}
                    </button>
                  </div>
                  {promoMessage && (
                    <div className={`text-[10px] mt-2 font-medium ${promoMessage.ok ? "text-green-600" : "text-red-600"}`}>
                      {promoMessage.text}
                    </div>
                  )}
                </div>

                <button
                  onClick={handlePayment}
                  disabled={submitting}
                  className="w-full bg-wine-900 hover:bg-wine-800 disabled:opacity-60 text-white font-bold py-5 rounded-lg transition-all shadow-xl hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
                >
                  {t("payNow")}
                </button>
              </div>
            )}
          </div>

          <div className="lg:col-span-5 order-1 lg:order-2">
            <div className="bg-wine-900 text-white p-6 md:p-8 rounded-2xl shadow-xl sticky top-24">
              <h2 className="text-2xl font-serif mb-6 border-b border-white/10 pb-4 flex justify-between items-center">
                {t("yourOrder")}
              </h2>

              {items.length === 0 ? (
                <div className="text-center py-10">
                  <p>{t("emptyCart")}</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-8 max-h-[40vh] overflow-y-auto pr-2">
                    {items.map((item) => {
                      const boxSize = item.box || 1;
                      const itemTotal = (item.price || 0) * (item.qty || 1) * boxSize;
                      return (
                        <div key={item.id} className="flex justify-between items-start bg-white/5 p-4 rounded-xl border border-white/5">
                          <div className="pr-2">
                            <div className="text-sm font-bold text-white">{item.name}</div>
                            <div className="text-[10px] text-stone-400 mt-1 uppercase font-bold tracking-widest">
                              {item.qty} Caja(s) &times; {boxSize} bot.
                            </div>
                          </div>
                          <div className="text-sm font-bold text-gold-500 whitespace-nowrap">{itemTotal.toFixed(2)} &euro;</div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="space-y-3 border-t border-white/10 pt-6">
                    <div className="flex justify-between text-stone-400 text-sm">
                      <span>{t("productAmount")}</span>
                      <span className="text-white font-semibold">{importeBruto.toFixed(2)} &euro;</span>
                    </div>
                    {descuentoAplicado > 0 && (
                      <div className="flex justify-between text-gold-500 text-sm font-medium">
                        <div>
                          {t("discount")} <span className="text-stone-400 text-xs ml-1">({labelDescuento})</span>
                        </div>
                        <span className="font-bold">-{valorDescuento.toFixed(2)} &euro;</span>
                      </div>
                    )}
                    <div className="flex justify-between text-stone-400 text-sm">
                      <span>{t("taxableBase")}</span>
                      <span className="text-white font-semibold">{baseImponible.toFixed(2)} &euro;</span>
                    </div>
                    <div className="flex justify-between text-stone-400 text-sm">
                      <span>{t("taxes")}</span>
                      <span className="text-white font-semibold">{igicAmount.toFixed(2)} &euro;</span>
                    </div>
                    <div className="flex justify-between items-center pt-4 text-white">
                      <span className="text-lg font-bold">{t("total")}</span>
                      <span className="text-3xl font-serif font-bold text-gold-500">{totalAmount.toFixed(2)} &euro;</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div
        className={`fixed inset-0 bg-wine-900/90 backdrop-blur-md z-[2000] flex flex-col items-center justify-center text-white transition-opacity duration-300 ${
          submitting ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="w-16 h-16 border-4 border-white/20 border-t-gold-500 rounded-full animate-spin mb-6" />
        <p className="font-serif text-xl animate-pulse">{t("processingPayment")}</p>
      </div>
    </>
  );
}
