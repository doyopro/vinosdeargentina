"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { LanguageToggle } from "@/components/LanguageToggle";
import { CART_STORAGE_KEY } from "@/lib/cart";
import { CUSTOMER_INFO_KEY, CustomerInfo } from "@/lib/order";

export const dynamic = "force-dynamic";

export default function ConfirmationPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmationInner />
    </Suspense>
  );
}

function ConfirmationInner() {
  const t = useTranslations("confirmationPage");
  const searchParams = useSearchParams();

  const [orderId, setOrderId] = useState("--------");
  const [errored, setErrored] = useState(false);
  const [whatsappHref, setWhatsappHref] = useState(
    "https://wa.me/34633706676?text=Hola,%20tengo%20una%20pregunta%20sobre%20mi%20pedido"
  );

  useEffect(() => {
    function processRedirect() {
      const paymentIntent = searchParams.get("payment_intent");
      const redirectStatus = searchParams.get("redirect_status");
      if (!paymentIntent) return;

      if (redirectStatus !== "succeeded") {
        setErrored(true);
        return;
      }

      const shortId = paymentIntent.slice(-8).toUpperCase();
      setOrderId(shortId);

      if (window.localStorage.getItem(`processed_${paymentIntent}`)) {
        console.log("Orden ya procesada, evitando duplicado");
        return;
      }
      window.localStorage.setItem(`processed_${paymentIntent}`, "true");

      // The order was already created and marked paid server-side (edge
      // function + webhook). This page only clears the client-side state.
      window.localStorage.removeItem(CART_STORAGE_KEY);
      window.localStorage.removeItem(CUSTOMER_INFO_KEY);
    }

    processRedirect();
  }, [searchParams]);

  useEffect(() => {
    const customerStr = window.localStorage.getItem(CUSTOMER_INFO_KEY);
    if (!customerStr) return;
    try {
      const customer = JSON.parse(customerStr) as CustomerInfo;
      const promoCode = customer.promo_code || "SIN CODIGO";
      const baseMsg = "Hola,%20tengo%20una%20pregunta%20sobre%20mi%20pedido";
      const promoMsg = `${baseMsg}%0AC%C3%93DIGO/SOCIO:%20${promoCode}`;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is client-only, read once after mount
      setWhatsappHref(`https://wa.me/34633706676?text=${promoMsg}`);
    } catch {
      // no-op, mirrors original's silent catch
    }
  }, []);

  return (
    <div className="min-h-screen bg-wine-900 flex items-center justify-center py-12 px-4">
      <div className="canary-stripe h-2 w-full fixed top-0 z-[100]" />
      <LanguageToggle variant="dark" />

      <main className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden text-center p-10 md:p-14 relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-gold-500" />

        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8 border shadow-sm ${
            errored ? "bg-red-50 text-red-500 border-red-100" : "bg-green-50 text-green-600 border-green-100"
          }`}
        >
          <span className="text-3xl">{errored ? "!" : "✓"}</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-serif text-wine-900 mb-4">
          {errored ? t("errorTitle") : t("thankYou")}
        </h1>

        <p className="text-stone-500 text-sm leading-relaxed mb-8">
          {errored ? t("errorMessage") : t("successMessage")}
        </p>

        <div className="bg-stone-50 rounded-2xl p-6 mb-10 border border-stone-100 relative group">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] block mb-2">{t("orderNumber")}</span>
          <code className="text-lg font-bold text-wine-900 tracking-tight">{orderId}</code>
        </div>

        <div className="flex flex-col gap-4">
          <Link
            href="/"
            className="w-full bg-wine-900 hover:bg-black text-white font-bold py-5 rounded-xl transition-all shadow-xl active:scale-95 uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"
          >
            {t("backToStore")}
          </Link>

          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 uppercase tracking-widest text-[10px] active:scale-95"
          >
            {t("whatsappSupport")}
          </a>
        </div>

        <footer className="mt-12 pt-6 border-t border-stone-100">
          <p className="text-[9px] text-stone-400 uppercase tracking-widest font-bold">{t("footer")}</p>
        </footer>
      </main>
    </div>
  );
}
