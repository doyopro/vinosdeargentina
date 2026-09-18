export interface Promotion {
  id: string;
  code: string | null;
  type: string;
  discount_value: number;
  min_cart_amount: number | null;
  is_active: boolean;
}

export interface Reseller {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
}

export type PromoTipo = "CODIGO" | "RESELLER" | null;

export interface PromoAplicado {
  codigo: string | null;
  tipo: PromoTipo;
  descuento: number;
  codigoNombre: string;
}

export const EMPTY_PROMO: PromoAplicado = {
  codigo: null,
  tipo: null,
  descuento: 0,
  codigoNombre: "",
};

// Ported verbatim from checkout.html renderCartSummary's "MOTOR DE REGLAS"
export function resolveDiscount(
  subtotal: number,
  allPromotions: Promotion[],
  promoAplicado: PromoAplicado
): { descuentoAplicado: number; labelDescuento: string } {
  const autoPromos = allPromotions.filter((p) => !p.code && subtotal >= (p.min_cart_amount || 0));
  let mejorDescuentoAuto = 0;
  if (autoPromos.length > 0) {
    const best = autoPromos.reduce(
      (acc, p) => {
        const rawVal = Number(p.discount_value);
        const pct = rawVal > 1 ? rawVal / 100 : rawVal;
        return pct > acc.pct ? { ...p, pct } : acc;
      },
      { pct: 0 } as { pct: number }
    );
    mejorDescuentoAuto = best.pct || 0;
  }

  const mejorDescuentoCupon = promoAplicado.tipo === "CODIGO" ? promoAplicado.descuento : 0;

  let descuentoAplicado = 0;
  let labelDescuento = "";

  if (promoAplicado.tipo === "RESELLER") {
    descuentoAplicado = Math.max(mejorDescuentoAuto, mejorDescuentoCupon);
    if (descuentoAplicado > 0) {
      const descPct = (descuentoAplicado * 100).toFixed(0);
      labelDescuento = `Socio: ${promoAplicado.codigoNombre} + ${
        descuentoAplicado === mejorDescuentoAuto ? "Auto" : "Cupón"
      } ${descPct}%`;
    } else {
      labelDescuento = `Socio: ${promoAplicado.codigoNombre}`;
    }
  } else if (mejorDescuentoCupon > mejorDescuentoAuto) {
    descuentoAplicado = mejorDescuentoCupon;
    labelDescuento = `Cupón ${promoAplicado.codigoNombre} ${(mejorDescuentoCupon * 100).toFixed(0)}%`;
  } else if (mejorDescuentoAuto > 0) {
    descuentoAplicado = mejorDescuentoAuto;
    labelDescuento = `Auto ${(mejorDescuentoAuto * 100).toFixed(0)}%`;
  }

  return { descuentoAplicado, labelDescuento };
}

// Shape kept identical to checkout.html's customerInfo saved to
// localStorage['altura_customer_info']. Note: this intentionally does NOT
// include the applied discount — that mirrors the original site's behavior,
// where confirmation.html's `customer.descuentoAplicado` check always misses
// because checkout.html never puts it in this object, so orders are always
// stored without a discount even when one was shown at checkout.
export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  island: string;
  address: string;
  postal_code: string;
  promo_code: string;
  promo_type: string;
}

export const CUSTOMER_INFO_KEY = "altura_customer_info";

// Response shape from supabase/functions/create-payment-intent-v2. The server
// is the source of truth for pricing; the browser calc in resolveDiscount
// above is only for the live summary shown while the cart is being built.
export interface Breakdown {
  subtotal: number;
  descuentoAplicado: number;
  valorDescuento: number;
  baseImponible: number;
  igicAmount: number;
  totalAmount: number;
}

export interface PaymentInit {
  clientSecret: string;
  orderId: string;
  totalAmount: number;
  breakdown: Breakdown;
}
