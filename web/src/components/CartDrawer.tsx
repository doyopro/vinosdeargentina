"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCart, maxQtyFor } from "@/lib/CartContext";
import { DeliveryNote } from "@/components/DeliveryNote";
import { PackCollage } from "@/components/PackCollage";
import { keyOf, lineGross } from "@/lib/cart";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CartDrawer({ open, onClose }: Props) {
  const t = useTranslations();
  const router = useRouter();
  const { items, setQty, remove } = useCart();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const total = items.reduce((sum, item) => sum + lineGross(item), 0);

  const processCheckout = () => {
    router.push("/checkout");
  };

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/40 z-[105] transition-opacity ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />
      <aside
        id="cart-drawer"
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white z-[106] shadow-2xl flex flex-col transition-transform duration-400 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="sticky top-0 z-10 bg-white border-b border-stone-100 flex justify-between items-center pl-6 pr-3 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <h3 className="text-2xl font-serif text-wine-900 font-bold">{t("cartTitle")}</h3>
          <button
            onClick={onClose}
            aria-label={t("cartClose")}
            className="w-11 h-11 flex items-center justify-center rounded-full text-stone-500 hover:text-wine-900 hover:bg-stone-100 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
          {items.length === 0 ? (
            <p className="text-center text-stone-400 italic mt-10">{t("cartEmpty")}</p>
          ) : (
            items.map((item) => {
              const key = keyOf(item);
              const itemTotal = lineGross(item);
              const atMax = item.qty >= maxQtyFor(item);
              const isPack = item.kind === "pack";
              return (
                <div key={key} className="p-4 bg-white border rounded-lg shadow-sm mb-3">
                  <div className="flex justify-between gap-3">
                    {isPack && (
                      <div className="flex-shrink-0 rounded-md bg-stone-50 pt-1" aria-hidden={false}>
                        <PackCollage images={item.images} size="mini" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h5 className="text-sm font-bold text-wine-900">{item.name}</h5>
                      <div className="text-xs text-stone-500">
                        {isPack ? t("packBottles", { n: item.bottles }) : t("boxOf", { n: item.box })}
                      </div>
                    </div>
                    <div className="font-bold text-wine-900 whitespace-nowrap">
                      {itemTotal.toFixed(2).replace(".", ",")} €
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center bg-stone-100 rounded-lg h-9">
                      <button
                        onClick={() => setQty(key, item.qty - 1)}
                        disabled={item.qty <= 1}
                        aria-label={t("cartDecrease")}
                        className="w-9 font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        −
                      </button>
                      <span className="min-w-12 px-1 text-center text-xs font-bold whitespace-nowrap">
                        {isPack ? item.qty : `${item.qty} ${t("boxesUnit")}`}
                      </span>
                      <button
                        onClick={() => setQty(key, item.qty + 1)}
                        disabled={atMax}
                        aria-label={t("cartIncrease")}
                        className="w-9 font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => remove(key)}
                      className="text-[11px] font-bold uppercase tracking-widest text-stone-400 hover:text-red-600 underline underline-offset-2"
                    >
                      {t("cartRemove")}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="px-6 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] border-t border-stone-100">
          <div className="flex justify-between items-center mb-4">
            <span className="text-stone-500 font-medium">{t("cartTotal")}</span>
            <div className="text-3xl font-serif text-wine-900 font-bold">
              {total.toFixed(2).replace(".", ",")} €
            </div>
          </div>
          <DeliveryNote className="mb-4" />
          <button
            onClick={processCheckout}
            disabled={items.length === 0}
            className="w-full bg-wine-900 hover:bg-wine-800 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-bold h-12 rounded-lg text-xs uppercase tracking-widest transition-colors"
          >
            {t("checkout")}
          </button>
        </div>
      </aside>
    </>
  );
}
