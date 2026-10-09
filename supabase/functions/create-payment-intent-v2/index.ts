import Stripe from 'https://esm.sh/stripe@latest?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const IGIC_RATE = 0.07;
// Shipping policy: pickup is free; shipping to the Canary Islands is free from
// FREE_SHIPPING_THRESHOLD (goods total after discount, IGIC included) and a flat
// SHIPPING_FEE (IGIC included) below it. Always computed here, never trusted from the client.
const FREE_SHIPPING_THRESHOLD = 200;
const SHIPPING_FEE = 20;
// Minimum order (goods total after discount, IGIC included). Wines are sold by the bottle.
const MIN_ORDER = 50;
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

type DeliveryMethod = 'pickup' | 'shipping';

interface OrderItemInput { id: string; qty: number; type?: 'product' | 'pack'; }

interface CustomerInput {
  name: string; email: string; phone: string | null;
  address: string; postal_code: string; island: string;
}

interface RequestBody {
  items: OrderItemInput[];
  customer: CustomerInput;
  promo_code?: string | null;
  delivery_method?: DeliveryMethod;
}

interface ProductRow {
  id: string; sku: string; name: string;
  price_retail: number; box_size: number; is_available: boolean;
}

interface PackRow {
  id: string; slug: string; name: string; price_retail: number; is_active: boolean;
}

interface PackItemRow { pack_id: string; product_id: string; bottles: number; }

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
  const deliveryMethod: DeliveryMethod = body.delivery_method ?? 'shipping';

  if (deliveryMethod !== 'pickup' && deliveryMethod !== 'shipping') {
    return badRequest('Metodo de entrega invalido.');
  }
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
    if (item.type !== undefined && item.type !== 'product' && item.type !== 'pack') {
      return badRequest('Tipo de producto invalido.');
    }
  }
  if (!customer || !customer.name || !customer.email || !customer.island || !customer.address || !customer.postal_code) {
    return badRequest('Faltan datos del cliente.');
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const productItems = items.filter((i) => i.type !== 'pack');
    const packItems = items.filter((i) => i.type === 'pack');

    // ---- Vinos (cajas) ----
    const productsById = new Map<string, ProductRow>();
    if (productItems.length > 0) {
      const uniqueIds = [...new Set(productItems.map((i) => i.id))];
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, sku, name, price_retail, box_size, is_available')
        .in('id', uniqueIds);

      if (productsError) {
        console.error('Error leyendo products:', productsError);
        return serverError('No se pudo validar el pedido.');
      }
      for (const p of (products || []) as ProductRow[]) productsById.set(p.id, p);

      for (const id of uniqueIds) {
        const product = productsById.get(id);
        if (!product) return badRequest('Uno o mas productos ya no existen.');
        if (!product.is_available) return badRequest(`"${product.name}" ya no esta disponible.`);
      }
    }

    // ---- Packs ----
    const packsById = new Map<string, PackRow>();
    const packComponents = new Map<string, { product_id: string; bottles: number }[]>();
    if (packItems.length > 0) {
      const uniquePackIds = [...new Set(packItems.map((i) => i.id))];
      const { data: packs, error: packsError } = await supabase
        .from('packs')
        .select('id, slug, name, price_retail, is_active')
        .in('id', uniquePackIds);
      if (packsError) {
        console.error('Error leyendo packs:', packsError);
        return serverError('No se pudo validar el pedido.');
      }
      for (const p of (packs || []) as PackRow[]) packsById.set(p.id, p);

      const { data: packRows, error: packRowsError } = await supabase
        .from('pack_items')
        .select('pack_id, product_id, bottles')
        .in('pack_id', uniquePackIds);
      if (packRowsError) {
        console.error('Error leyendo pack_items:', packRowsError);
        return serverError('No se pudo validar el pedido.');
      }
      for (const r of (packRows || []) as PackItemRow[]) {
        const list = packComponents.get(r.pack_id) || [];
        list.push({ product_id: r.product_id, bottles: r.bottles });
        packComponents.set(r.pack_id, list);
      }

      const componentIds = [...new Set((packRows || []).map((r: PackItemRow) => r.product_id))];
      const availability = new Map<string, { name: string; is_available: boolean }>();
      if (componentIds.length > 0) {
        const { data: comps, error: compsError } = await supabase
          .from('products')
          .select('id, name, is_available')
          .in('id', componentIds);
        if (compsError) {
          console.error('Error leyendo vinos del pack:', compsError);
          return serverError('No se pudo validar el pedido.');
        }
        for (const c of comps || []) availability.set(c.id, { name: c.name, is_available: c.is_available });
      }

      for (const id of uniquePackIds) {
        const pack = packsById.get(id);
        if (!pack) return badRequest('Uno o mas packs ya no existen.');
        if (!pack.is_active) return badRequest(`"${pack.name}" ya no esta disponible.`);
        const comps = packComponents.get(id) || [];
        if (comps.length === 0) return badRequest(`"${pack.name}" no esta disponible.`);
        for (const c of comps) {
          const a = availability.get(c.product_id);
          if (!a || !a.is_available) {
            return badRequest(`"${pack.name}" no esta disponible: falta "${a?.name || 'un vino'}".`);
          }
        }
      }
    }

    // price_retail se guarda CON IGIC incluido. Base imponible = price_retail / 1.07.
    // Vino: precio por botella x qty (qty = botellas). Pack: precio por pack x qty.
    const orderLines = items.map((item) => {
      if (item.type === 'pack') {
        const pack = packsById.get(item.id)!;
        const netUnit = Number(pack.price_retail) / (1 + IGIC_RATE);
        return {
          kind: 'pack',
          id: pack.id, sku: pack.slug, name: pack.name,
          qty: item.qty, box_size: 1,
          unit_price: Number(pack.price_retail),
          line_total: round2(netUnit * item.qty),
          components: packComponents.get(pack.id) || [],
        };
      }
      const product = productsById.get(item.id)!;
      const netUnit = product.price_retail / (1 + IGIC_RATE);
      return {
        kind: 'product',
        id: product.id, sku: product.sku, name: product.name,
        qty: item.qty, box_size: 1,
        unit_price: product.price_retail,
        line_total: round2(netUnit * item.qty),
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
    const goodsTotal = round2(baseImponible + igicAmount);

    if (goodsTotal < MIN_ORDER) {
      return badRequest(`El pedido minimo es de ${MIN_ORDER} EUR.`);
    }

    // Envio: retiro gratis; envio gratis desde 200 EUR (total de productos con IGIC),
    // 20 EUR (IGIC incluido) por debajo.
    const shippingAmount =
      deliveryMethod === 'shipping' && goodsTotal < FREE_SHIPPING_THRESHOLD ? SHIPPING_FEE : 0;
    const totalAmount = round2(goodsTotal + shippingAmount);

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
      delivery_method: deliveryMethod,
      shipping_amount: shippingAmount,
      total_amount: totalAmount,
      payment_status: 'pending',
      shipping_status: 'new',
      promo_code: promoAplicado.codigo || 'SIN CODIGO',
      promo_type: promoAplicado.tipo || 'NINGUNO',
    };

    // Limpieza: borra pedidos que nunca se pagaron (más de 24 h pendientes).
    await supabase
      .from('orders')
      .delete()
      .eq('payment_status', 'pending')
      .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

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
        description: 'VinoArgentino.es - Pedido',
        metadata: { order_id: orderId, delivery_method: deliveryMethod },
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
        breakdown: {
          subtotal, descuentoAplicado, valorDescuento, baseImponible, igicAmount,
          goodsTotal, shippingAmount, deliveryMethod, totalAmount,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error creando el pedido:', error);
    return serverError('Error procesando el pedido.');
  }
});
