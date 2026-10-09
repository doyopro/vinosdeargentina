"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { StripeElements, StripePaymentElement } from "@stripe/stripe-js";
import { LanguageToggle } from "@/components/LanguageToggle";
import { supabase } from "@/lib/supabase";
import { useCart, maxQtyFor } from "@/lib/CartContext";
import { keyOf, lineNet } from "@/lib/cart";
import { DeliveryNote } from "@/components/DeliveryNote";
import { getStripe, EDGE_FUNCTION_URL } from "@/lib/stripeClient";
import {
  CUSTOMER_INFO_KEY,
  CustomerInfo,
  EMPTY_PROMO,
  PaymentInit,
  PromoAplicado,
  Promotion,
  resolveDiscount,
} from "@/lib/order";

export const dynamic = "force-dynamic";

// Failure of the order/PaymentIntent call, carrying the server's message (or HTTP status).
class InitError extends Error {}

import { DeliveryMethod, FREE_SHIPPING_THRESHOLD, PICKUP_ADDRESS, PICKUP_ISLAND, PICKUP_POSTAL, SHIPPING_FEE, shippingFor } from "@/lib/shipping";

const ISLANDS = ["Tenerife", "Gran Canaria", "La Palma", "La Gomera", "El Hierro", "Fuerteventura", "Lanzarote"];

export default function CheckoutPage() {
  const t = useTranslations("checkoutPage");
  const tc = useTranslations();

  const router = useRouter();
  const { items, hydrated: ready, setQty, remove } = useCart();
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
  const [delivery, setDelivery] = useState<DeliveryMethod>("shipping");
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const [submitting, setSubmitting] = useState(false);
  const [stripeError, setStripeError] = useState("");
  const [paymentInit, setPaymentInit] = useState<PaymentInit | null>(null);
  const [pricedSig, setPricedSig] = useState<string | null>(null);
  const [initFailed, setInitFailed] = useState(false);
  const [initAttempt, setInitAttempt] = useState(0);

  const stripeContainerRef = useRef<HTMLDivElement>(null);
  const elementsRef = useRef<StripeElements | null>(null);
  const paymentElementRef = useRef<StripePaymentElement | null>(null);
  const requestIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const lastCartSigRef = useRef<string | null>(null);

  // Empty cart (never filled, or everything removed here): back to the shop.
  useEffect(() => {
    if (ready && items.length === 0) router.replace("/");
  }, [ready, items.length, router]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("promotions").select("*").eq("is_active", true);
      if (data && data.length > 0) setAllPromotions(data as Promotion[]);
    })();
  }, []);

  // Pickup needs no postal address: send the pickup point instead.
  const effIsland = delivery === "pickup" ? PICKUP_ISLAND : island;
  const effAddress = delivery === "pickup" ? PICKUP_ADDRESS : address;
  const effPostal = delivery === "pickup" ? PICKUP_POSTAL : postal;

  // Client-side estimate: only used to render the summary while the cart is
  // being built, before the server has priced the order.
  const { labelDescuento, ...clientTotals } = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + lineNet(item), 0);
    const { descuentoAplicado, labelDescuento } = resolveDiscount(subtotal, allPromotions, promoAplicado);
    const valorDescuento = subtotal * descuentoAplicado;
    const baseImponible = subtotal - valorDescuento;
    const igicAmount = baseImponible * 0.07;
    const goodsTotal = baseImponible + igicAmount;
    const shippingAmount = shippingFor(delivery, goodsTotal);
    const totalAmount = goodsTotal + shippingAmount;
    return {
      importeBruto: subtotal,
      valorDescuento,
      baseImponible,
      igicAmount,
      goodsTotal,
      shippingAmount,
      totalAmount,
      labelDescuento,
      descuentoAplicado,
    };
  }, [items, allPromotions, promoAplicado, delivery]);

  // The server needs full customer info to price + create the order, so we
  // can't price until the billing form is filled in.
  const customerReady = useMemo(
    () => Boolean(name.trim() && email.trim() && effIsland.trim() && effAddress.trim() && effPostal.trim()),
    [name, email, effIsland, effAddress, effPostal]
  );

  // Everything the server prices from. If this differs from the signature of
  // the last server response, the displayed total is stale.
  const cartSig = useMemo(
    () => JSON.stringify({ items: items.map((i) => [i.id, i.qty, i.kind ?? "product"]), promo: promoAplicado.codigo }),
    [items, promoAplicado.codigo]
  );
  const pricingSig = useMemo(
    () => JSON.stringify({ cartSig, customer: [name, email, phone, effAddress, effPostal, effIsland, delivery] }),
    [cartSig, name, email, phone, effAddress, effPostal, effIsland, delivery]
  );

  const isStale = !paymentInit || pricedSig !== pricingSig;
  const updating = customerReady && items.length > 0 && isStale && !initFailed;

  // The server's numbers are the source of truth for what's shown and charged.
  // The browser estimate is only a provisional value until a fresh response lands.
  const serverBreakdown = paymentInit && !isStale ? paymentInit.breakdown : null;
  const { importeBruto, valorDescuento, baseImponible, igicAmount, goodsTotal, shippingAmount, totalAmount, descuentoAplicado } =
    serverBreakdown
      ? {
          importeBruto: serverBreakdown.subtotal,
          valorDescuento: serverBreakdown.valorDescuento,
          baseImponible: serverBreakdown.baseImponible,
          igicAmount: serverBreakdown.igicAmount,
          goodsTotal: serverBreakdown.goodsTotal ?? serverBreakdown.baseImponible + serverBreakdown.igicAmount,
          shippingAmount: serverBreakdown.shippingAmount ?? 0,
          totalAmount: serverBreakdown.totalAmount,
          descuentoAplicado: serverBreakdown.descuentoAplicado,
        }
      : clientTotals;
  const missingForFree = Math.max(0, FREE_SHIPPING_THRESHOLD - goodsTotal);

  // (Re)price on the server whenever the cart, the coupon or the customer data
  // change: new order + PaymentIntent. Debounced; stale responses are ignored.
  useEffect(() => {
    if (!ready || items.length === 0 || !customerReady) return;
    if (pricedSig === pricingSig) return;

    // Cart/coupon edits: ~400ms. Customer-only edits wait longer to avoid
    // creating an order per pause while typing.
    const delay = lastCartSigRef.current !== cartSig ? 400 : 1000;
    const timer = setTimeout(async () => {
      const requestId = ++requestIdRef.current;
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      lastCartSigRef.current = cartSig;
      setStripeError("");
      setInitFailed(false);

      try {
        if (!EDGE_FUNCTION_URL) throw new InitError("EDGE_FUNCTION_URL no configurada");
        const res = await fetch(EDGE_FUNCTION_URL, {
          method: "POST",
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            items: items.map((item) => ({ id: item.id, qty: item.qty, type: item.kind ?? "product" })),
            customer: { name, email, phone, address: effAddress, postal_code: effPostal, island: effIsland },
            promo_code: promoAplicado.codigo,
            delivery_method: delivery,
          }),
        });
        const data = await res.json().catch(() => null);
        if (requestId !== requestIdRef.current) return; // a newer request superseded this one
        if (!res.ok || !data?.clientSecret || !data?.orderId) {
          const detail = typeof data?.error === "string" ? data.error : `HTTP ${res.status}`;
          throw new InitError(detail);
        }
        setPaymentInit(data as PaymentInit);
        setPricedSig(pricingSig);
      } catch (e) {
        if (controller.signal.aborted || requestId !== requestIdRef.current) return;
        console.error("Error calculando el total en el servidor:", e);
        const detail = e instanceof InitError ? ` (${e.message})` : "";
        setStripeError(`${t("paymentInitFailed")}${detail}`);
        setInitFailed(true);
        setPaymentInit(null);
      }
    }, delay);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- pricingSig/cartSig cover every input the request reads
  }, [ready, items.length, customerReady, pricingSig, pricedSig, initAttempt]);

  // Abort anything still in flight when leaving the page.
  useEffect(
    () => () => {
      requestIdRef.current++;
      abortRef.current?.abort();
    },
    []
  );

  // (Re)mount the Stripe Payment Element whenever a new clientSecret arrives.
  const clientSecret = paymentInit?.clientSecret;
  useEffect(() => {
    if (!clientSecret || !stripeContainerRef.current) return;
    let cancelled = false;
    (async () => {
      const stripe = await getStripe();
      if (cancelled || !stripe || !stripeContainerRef.current) return;
      const elements = stripe.elements({ clientSecret });
      const paymentElement = elements.create("payment");
      paymentElement.mount(stripeContainerRef.current);
      elementsRef.current = elements;
      paymentElementRef.current = paymentElement;
    })();
    return () => {
      cancelled = true;
      paymentElementRef.current?.unmount();
      paymentElementRef.current = null;
      elementsRef.current = null;
    };
  }, [clientSecret]);

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
    const fields: Record<string, string> =
      delivery === "pickup" ? { name, email } : { name, email, island, address, postal };
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
    if (updating) return;
    if (!elementsRef.current || !paymentInit || isStale) {
      if (!initFailed) setStripeError(t("paymentNotReady"));
      return;
    }

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
        island: effIsland,
        address: effAddress,
        postal_code: effPostal,
        promo_code: promoAplicado.codigo || "SIN CODIGO",
        promo_type: promoAplicado.tipo || "NINGUNO",
        delivery_method: delivery,
      };
      window.localStorage.setItem(CUSTOMER_INFO_KEY, JSON.stringify(customerInfo));

      const { error } = await stripe.confirmPayment({
        elements: elementsRef.current,
        clientSecret: paymentInit.clientSecret,
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
    `p-3 border rounded-lg focus:ring-2 focus:ring-sun-500/20 focus:border-sky-500 outline-none transition-all ${
      errors[field] ? "border-red-500 bg-red-50" : "border-stone-200"
    }`;

  return (
    <>
      <div className="canary-stripe h-2 w-full fixed top-0 z-[100]" />
      <LanguageToggle />

      <div className="max-w-6xl mx-auto px-4 py-12 md:py-20">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-sm font-semibold text-brand-800 hover:text-sky-700 transition-colors">
            &larr; {t("backToShop")}
          </Link>
        </div>

        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-serif text-brand-900 mb-4">{t("title")}</h1>
          <p className="text-stone-500 font-medium">{t("subtitle")}</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 order-2 lg:order-1 bg-white p-6 md:p-10 rounded-2xl shadow-sm border border-stone-100">
            {ready && items.length === 0 ? (
              <div className="text-center py-10">
                <p>{t("emptyCart")}</p>
                <Link href="/" className="mt-4 inline-block text-sky-700 underline text-sm">
                  {t("backToShopLink")}
                </Link>
              </div>
            ) : (
              <div>
                <div className="mb-10">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="w-8 h-8 rounded-full bg-brand-900 text-white flex items-center justify-center text-sm font-bold">
                      1
                    </span>
                    <h2 className="text-xl font-serif text-brand-900 font-bold">{t("step1")}</h2>
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

                  <div className="flex flex-col mb-6">
                    <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">{t("phone")}</label>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={`${inputCls("phone")} md:w-1/2`} />
                  </div>

                  <fieldset className="mb-6">
                    <legend className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">{t("deliveryTitle")}</legend>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(
                        [
                          ["shipping", t("deliveryShipping"), t("deliveryShippingDesc", { threshold: FREE_SHIPPING_THRESHOLD, fee: SHIPPING_FEE })],
                          ["pickup", t("deliveryPickup"), t("deliveryPickupDesc")],
                        ] as [DeliveryMethod, string, string][]
                      ).map(([value, label, desc]) => (
                        <label
                          key={value}
                          className={`cursor-pointer rounded-xl border p-4 transition-colors ${
                            delivery === value ? "border-brand-900 bg-brand-900/[0.04] ring-2 ring-sky-500/40" : "border-stone-200 hover:border-stone-300"
                          }`}
                        >
                          <input type="radio" name="delivery" value={value} checked={delivery === value} onChange={() => setDelivery(value)} className="sr-only" />
                          <div className="font-bold text-brand-900 text-sm">{label}</div>
                          <div className="mt-1 text-xs text-stone-500 leading-relaxed">{desc}</div>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  {delivery === "shipping" ? (
                    <>
                      <div className="flex flex-col mb-5 md:w-1/2">
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

                      <div className="flex flex-col mb-5">
                        <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">{t("address")}</label>
                        <input value={address} onChange={(e) => setAddress(e.target.value)} className={inputCls("address")} />
                      </div>

                      <div className="flex flex-col w-full md:w-1/2">
                        <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">{t("postal")}</label>
                        <input value={postal} onChange={(e) => setPostal(e.target.value)} className={inputCls("postal")} />
                      </div>
                    </>
                  ) : (
                    <p className="rounded-xl bg-stone-50 border border-stone-200 p-4 text-sm text-stone-600 leading-relaxed">{t("pickupNote")}</p>
                  )}
                </div>

                <div className="mb-10">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="w-8 h-8 rounded-full bg-brand-900 text-white flex items-center justify-center text-sm font-bold">
                      2
                    </span>
                    <h2 className="text-xl font-serif text-brand-900 font-bold">{t("step2")}</h2>
                  </div>
                  <div ref={stripeContainerRef} className="p-4 border border-stone-200 rounded-xl bg-stone-50" />
                  {stripeError && (
                    <div className="mt-4 text-red-500 text-sm font-medium" role="alert">
                      {stripeError}
                      {initFailed && (
                        <button
                          type="button"
                          onClick={() => {
                            setStripeError("");
                            setInitFailed(false);
                            setInitAttempt((n) => n + 1);
                          }}
                          className="ml-3 underline font-bold"
                        >
                          {t("paymentRetry")}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="mb-8">
                  <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3 block">{t("promoLabel")}</label>
                  <div className="flex gap-2">
                    <input
                      value={promoCodeInput}
                      onChange={(e) => setPromoCodeInput(e.target.value)}
                      placeholder={t("promoPlaceholder")}
                      className="flex-1 p-3 border border-stone-200 rounded-lg focus:ring-2 focus:ring-sun-500/20 focus:border-sky-500 outline-none transition-all text-sm"
                    />
                    <button
                      type="button"
                      onClick={applyPromo}
                      className="px-6 py-3 bg-sun-500 hover:bg-sun-600 text-brand-900 font-bold rounded-lg transition-all text-[10px] uppercase tracking-widest shadow-sm"
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

                <DeliveryNote className="mb-5" />

                <button
                  onClick={handlePayment}
                  disabled={submitting || updating}
                  className="w-full bg-brand-900 hover:bg-brand-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-5 rounded-lg transition-all shadow-xl hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
                >
                  {updating ? t("pricingUpdating") : t("payNow")}
                </button>
              </div>
            )}
          </div>

          <div className="lg:col-span-5 order-1 lg:order-2">
            <div className="bg-brand-900 text-white p-6 md:p-8 rounded-2xl shadow-xl sticky top-24">
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
                      const key = keyOf(item);
                      const itemTotal = lineNet(item);
                      return (
                        <div key={key} className="bg-white/5 p-4 rounded-xl border border-white/5">
                          <div className="flex justify-between items-start">
                            <div className="pr-2">
                              <div className="text-sm font-bold text-white">{item.name}</div>
                              <div className="text-[10px] text-stone-400 mt-1 uppercase font-bold tracking-widest">
                                {item.kind === "pack"
                                  ? `${item.qty} × ${tc("packBottles", { n: item.bottles })}`
                                  : `${item.qty} Caja(s) × ${item.box || 1} bot.`}
                              </div>
                            </div>
                            <div className="text-sm font-bold text-sky-500 whitespace-nowrap">{itemTotal.toFixed(2)} &euro;</div>
                          </div>
                          <div className="mt-3 flex items-center justify-between">
                            <div className="flex items-center bg-white/10 rounded-lg h-8">
                              <button
                                type="button"
                                onClick={() => setQty(key, item.qty - 1)}
                                disabled={item.qty <= 1}
                                aria-label={tc("cartDecrease")}
                                className="w-8 font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                −
                              </button>
                              <span className="w-8 text-center text-xs font-bold">{item.qty}</span>
                              <button
                                type="button"
                                onClick={() => setQty(key, item.qty + 1)}
                                disabled={item.qty >= maxQtyFor(item)}
                                aria-label={tc("cartIncrease")}
                                className="w-8 font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                +
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => remove(key)}
                              className="text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-white underline underline-offset-2"
                            >
                              {tc("cartRemove")}
                            </button>
                          </div>
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
                      <div className="flex justify-between text-sky-500 text-sm font-medium">
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
                    <div className="flex justify-between text-stone-400 text-sm">
                      <span>{delivery === "pickup" ? t("summaryPickup") : t("summaryShipping")}</span>
                      <span className="text-white font-semibold">
                        {shippingAmount > 0 ? `${shippingAmount.toFixed(2)} €` : t("free")}
                      </span>
                    </div>
                    {delivery === "shipping" && shippingAmount > 0 && (
                      <div className="text-right text-[11px] text-sky-500">{t("freeShippingHint", { amount: missingForFree.toFixed(2) })}</div>
                    )}
                    {delivery === "shipping" && (
                      <a
                        href="https://wa.me/34633706676"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-right text-[11px] text-stone-400 hover:text-white underline underline-offset-2"
                      >
                        {t("bigOrders")}
                      </a>
                    )}
                    {updating && (
                      <div className="text-right text-[11px] text-sky-500 animate-pulse" role="status">
                        {t("pricingUpdating")}
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-4 text-white">
                      <span className="text-lg font-bold">{t("total")}</span>
                      <span className="text-3xl font-serif font-bold text-sky-500">{totalAmount.toFixed(2)} &euro;</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div
        className={`fixed inset-0 bg-brand-900/90 backdrop-blur-md z-[2000] flex flex-col items-center justify-center text-white transition-opacity duration-300 ${
          submitting ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="w-16 h-16 border-4 border-white/20 border-t-sky-500 rounded-full animate-spin mb-6" />
        <p className="font-serif text-xl animate-pulse">{t("processingPayment")}</p>
      </div>
    </>
  );
}
