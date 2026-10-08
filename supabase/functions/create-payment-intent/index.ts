import Stripe from 'https://esm.sh/stripe@latest?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const IGIC_RATE = 0.07;
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

interface OrderItemInput { id: string; qty: number; }

interface CustomerInput {
  name: string; email: string; phone: string | null;
  address: string; postal_code: string; island: string;
}

interface RequestBody {
  items: OrderItemInput[];
  customer: CustomerInput;
  promo_code?: string | null;
}

interface ProductRow {
  id: string; sku: string; name: string;
  price_retail: number; box_size: number; is_available: boolean;
}

interface PromotionRow {
  id: string; code: string | null; type: string;
  discount_value: number; min_cart_amount: number | null; is_active: boolean;
}

type PromoTipo = 'CODIGO' | 'RESELLER' | null;

interface PromoAplicado {
  codigo: string | null; tipo: PromoTipo;
  descuento: number; codigoNombre: string;
}

const EMPTY_PROMO: PromoAplicado = { codigo: null, tipo: null, descuento: 0, codigoNombre: '' };

function resolveDiscount(
  subtotal: number,
  allPromotions: PromotionRow[],
  promoAplicado: PromoAplicado
): { descuentoAplicado: number } {
  const autoPromos = allPromotions.filter((p) => !p.code && subtotal >= (p.min_cart_amount || 0));
  let mejorDescuentoAuto = 0;
  if (autoPromos.length > 0) {
    const best = autoPromos.reduce(
      (acc, p) => {
        const rawVal = Number(p.discount_value);
        const pct = rawVal > 1 ? rawVal / 100 : rawVal;
        return pct > acc.pct ? { pct } : acc;
      },
      { pct: 0 }
    );
    mejorDescuentoAuto = best.pct || 0;
  }

  const mejorDescuentoCupon = promoAplicado.tipo === 'CODIGO' ? promoAplicado.descuento : 0;

  let descuentoAplicado = 0;

  if (promoAplicado.tipo === 'RESELLER') {
    descuentoAplicado = Math.max(mejorDescuentoAuto, mejorDescuentoCupon);
  } else if (mejorDescuentoCupon > mejorDescuentoAuto) {
    descuentoAplicado = mejorDescuentoCupon;
  } else if (mejorDescuentoAuto > 0) {
    descuentoAplicado = mejorDescuentoAuto;
  }

  return { descuentoAplicado };
}

function badRequest(message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status: 400,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function serverError(message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status: 500,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return badRequest('Cuerpo de la peticion invalido.');
  }

  const items = body.items;
  const customer = body.customer;
  const promoCodeRaw = body.promo_code;

  if (!Array.isArray(items) || items.length === 0) {
    return badRequest('El pedido no tiene productos.');
  }
  for (const item of items) {
    if (!item || typeof item.id !== 'string' || !item.id) {
      return badRequest('Uno o mas productos del pedido son invalidos.');
    }
    if (!Number.isInteger(item.qty) || item.qty <= 0) {
      return badRequest('Cantidad invalida en uno o mas productos.');
    }
  }
  if (!customer || !customer.name || !customer.email || !customer.island || !customer.address || !customer.postal_code) {
    return badRequest('Faltan datos del cliente.');
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const uniqueIds = [...new Set(items.map((i) => i.id))];
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, sku, name, price_retail, box_size, is_available')
      .in('id', uniqueIds);

    if (productsError) {
      console.error('Error leyendo products:', productsError);
      return serverError('No se pudo validar el pedido.');
    }

    const productsById = new Map<string, ProductRow>((products || []).map((p: ProductRow) => [p.id, p]));

    for (const id of uniqueIds) {
      const product = productsById.get(id);
      if (!product) {
        return badRequest('Uno o mas productos ya no existen.');
      }
      if (!product.is_available) {
        return badRequest(`"${product.name}" ya no esta disponible.`);
      }
    }

    // price_retail se guarda CON IGIC incluido. Base imponible = price_retail / 1.07.
    const orderLines = items.map((item) => {
      const product = productsById.get(item.id)!;
      const netUnit = product.price_retail / (1 + IGIC_RATE);
      const lineTotal = round2(netUnit * item.qty * product.box_size);
      return {
        id: product.id, sku: product.sku, name: product.name,
        qty: item.qty, box_size: product.box_size,
        unit_price: product.price_retail, line_total: lineTotal,
      };
    });
    const subtotal = round2(orderLines.reduce((sum, line) => sum + line.line_total, 0));

    const { data: promotions, error: promotionsError } = await supabase
      .from('promotions')
      .select('id, code, type, discount_value, min_cart_amount, is_active')
      .eq('is_active', true);

    if (promotionsError) {
      console.error('Error leyendo promotions:', promotionsError);
      return serverError('No se pudo calcular el descuento.');
    }

    const allPromotions: PromotionRow[] = promotions || [];
    let promoAplicado: PromoAplicado = EMPTY_PROMO;

    const codigo = (promoCodeRaw || '').trim().toUpperCase();
    if (codigo) {
      const cuponPromo = allPromotions.find((p) => p.code && p.code.toUpperCase() === codigo);
      if (cuponPromo) {
        const rawVal = Number(cuponPromo.discount_value);
        const pct = rawVal > 1 ? rawVal / 100 : rawVal;
        promoAplicado = { codigo, tipo: 'CODIGO', descuento: pct, codigoNombre: codigo };
      } else {
        const { data: reseller, error: resellerError } = await supabase
          .from('resellers')
          .select('id, code, name, is_active')
          .ilike('code', codigo)
          .eq('is_active', true)
          .single();

        if (resellerError && resellerError.code !== 'PGRST116') {
          console.error('Error leyendo resellers:', resellerError);
          return serverError('No se pudo validar el codigo.');
        }

        if (reseller) {
          promoAplicado = { codigo, tipo: 'RESELLER', descuento: 0, codigoNombre: reseller.name };
        }
      }
    }

    const { descuentoAplicado } = resolveDiscount(subtotal, allPromotions, promoAplicado);

    const valorDescuento = round2(subtotal * descuentoAplicado);
    const baseImponible = round2(subtotal - valorDescuento);
    const igicAmount = round2(baseImponible * IGIC_RATE);
    const totalAmount = round2(baseImponible + igicAmount);

    const orderPayload = {
      customer_name: customer.name,
      customer_email: customer.email,
      customer_phone: customer.phone || null,
      island: customer.island,
      address: customer.address,
      postal_code: customer.postal_code,
      items: orderLines,
      subtotal_bruto: subtotal,
      descuento_aplicado: descuentoAplicado,
      valor_descuento: valorDescuento,
      base_imponible: baseImponible,
      igic_amount: igicAmount,
      total_amount: totalAmount,
      payment_status: 'pending',
      shipping_status: 'new',
      promo_code: promoAplicado.codigo || 'SIN CODIGO',
      promo_type: promoAplicado.tipo || 'NINGUNO',
    };

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert([orderPayload])
      .select('id')
      .single();

    if (orderError || !orderData) {
      console.error('Error insertando orden:', orderError);
      return serverError('No se pudo crear el pedido.');
    }

    const orderId = orderData.id;

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' });

    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(totalAmount * 100),
        currency: 'eur',
        description: 'De Altura Wines - Pedido',
        metadata: { order_id: orderId },
      });
    } catch (stripeErr) {
      console.error('Error creando Payment Intent:', stripeErr);
      return serverError('No se pudo iniciar el pago.');
    }

    const { error: linkError } = await supabase
      .from('orders')
      .update({ stripe_payment_intent_id: paymentIntent.id })
      .eq('id', orderId);

    if (linkError) {
      console.error('Error vinculando Payment Intent a la orden:', linkError);
      return serverError('No se pudo finalizar el pedido.');
    }

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        orderId,
        totalAmount,
        breakdown: { subtotal, descuentoAplicado, valorDescuento, baseImponible, igicAmount, totalAmount },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error creando el pedido:', error);
    return serverError('Error procesando el pedido.');
  }
});
