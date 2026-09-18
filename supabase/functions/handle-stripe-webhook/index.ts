import Stripe from 'https://esm.sh/stripe@latest?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrderLine {
  id: string;
  qty: number;
  box_size: number;
}

function ok(body: Record<string, unknown> = { received: true }) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const signature = req.headers.get('stripe-signature');
  const body = await req.text();
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  if (!webhookSecret || !signature) {
    console.error('Falta STRIPE_WEBHOOK_SECRET o la cabecera stripe-signature');
    return new Response(JSON.stringify({ error: 'Missing webhook secret or signature' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
    apiVersion: '2023-10-16',
  });

  // 1. Verificar la firma. constructEventAsync porque constructEvent (síncrono)
  // depende de SubtleCrypto de forma incompatible con el runtime de Deno.
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    console.error('Firma de webhook inválida:', err instanceof Error ? err.message : err);
    return new Response(JSON.stringify({ error: 'Invalid signature' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // A partir de aquí la firma ya es válida: siempre respondemos 200 para que
  // Stripe no reintente en bucle, y los errores solo se loguean.
  try {
    // 2. Solo nos interesa payment_intent.succeeded
    if (event.type !== 'payment_intent.succeeded') {
      return ok();
    }

    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    // 3. order_id viene en la metadata puesta por create-payment-intent-v2
    const orderId = paymentIntent.metadata?.order_id;
    if (!orderId) {
      console.error('payment_intent.succeeded sin metadata.order_id:', paymentIntent.id);
      return ok();
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 4. Idempotencia: solo marcamos como pagada (y solo descontamos stock)
    // si la orden seguía en 'pending'. Un reintento de Stripe sobre la misma
    // orden ya pagada no vuelve a tocar stock.
    const { data: updatedOrders, error: updateError } = await supabase
      .from('orders')
      .update({ payment_status: 'paid', payment_method: 'stripe' })
      .eq('id', orderId)
      .eq('payment_status', 'pending')
      .select('id, items');

    if (updateError) {
      console.error('Error marcando la orden como pagada:', updateError);
      return ok();
    }

    if (!updatedOrders || updatedOrders.length === 0) {
      // Ya estaba pagada (o no existe): nada más que hacer.
      return ok();
    }

    const order = updatedOrders[0];
    const items: OrderLine[] = Array.isArray(order.items) ? order.items : [];

    // 5. Descuento de stock JIT (puede quedar negativo a propósito)
    for (const line of items) {
      if (!line || !line.id) continue;
      const decrement = (line.qty || 0) * (line.box_size || 0);
      if (decrement <= 0) continue;

      const { data: product, error: productError } = await supabase
        .from('products')
        .select('stock')
        .eq('id', line.id)
        .single();

      if (productError || !product) {
        console.error(`Error leyendo stock de ${line.id}:`, productError);
        continue;
      }

      const { error: stockError } = await supabase
        .from('products')
        .update({ stock: (product.stock || 0) - decrement })
        .eq('id', line.id);

      if (stockError) {
        console.error(`Error descontando stock de ${line.id}:`, stockError);
      }
    }

    return ok();
  } catch (error) {
    console.error('Error procesando webhook:', error instanceof Error ? error.message : error);
    return ok();
  }
});
