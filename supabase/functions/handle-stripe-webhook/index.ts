import Stripe from 'https://esm.sh/stripe@latest?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get('stripe-signature');
    const body = await req.text();
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    console.log('🔔 Webhook recibido');
    console.log('Signature:', signature?.slice(0, 20) + '...');

    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET no configurada');
    }

    if (!signature) {
      throw new Error('No stripe-signature header');
    }

    // Inicializar Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2023-10-16',
    });

    // Verificar firma del webhook
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      console.log('✅ Firma del webhook validada');
      console.log('Tipo de evento:', event.type);
    } catch (err) {
      console.error('❌ Error validando firma:', err.message);
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Solo procesar checkout.session.completed
    if (event.type !== 'checkout.session.completed') {
      console.log('⏭️ Evento ignorado (no es checkout.session.completed)');
      return new Response(
        JSON.stringify({ success: true, message: 'Event type not processed' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const session = event.data.object as any;
    console.log('📦 Session ID:', session.id);
    console.log('Metadata:', session.metadata);

    // Inicializar Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parsear datos del session
    const totalAmountCents = session.amount_total; // En céntimos
    const totalAmountEuros = totalAmountCents / 100;
    const igic = Number((totalAmountEuros * 0.07 / 1.07).toFixed(2));
    const subtotal = Number((totalAmountEuros - igic).toFixed(2));

    console.log('💰 Total:', totalAmountEuros, '€');
    console.log('📊 Subtotal:', subtotal, '€');
    console.log('📈 IGIC:', igic, '€');

    // Parsear items desde metadata
    let items = [];
    try {
      if (session.metadata?.items) {
        items = JSON.parse(session.metadata.items);
        console.log('📋 Items parseados:', items);
      }
    } catch (e) {
      console.warn('⚠️ Error parseando items:', e.message);
      items = [];
    }

    // Insertar orden en Supabase
    console.log('💾 Insertando orden en BD...');
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert([{
        customer_name: session.customer_details?.name || 'Unknown',
        customer_email: session.customer_details?.email || session.customer_email,
        customer_phone: session.metadata?.customer_phone || null,
        island: session.metadata?.island || null,
        address: session.metadata?.address || null,
        postal_code: session.metadata?.postal_code || null,
        subtotal_amount: subtotal,
        tax_amount: igic,
        total_amount: totalAmountEuros,
        items: items,
        payment_method: 'stripe',
        payment_status: 'paid',
        shipping_status: 'pending',
        stripe_payment_id: session.payment_intent,
        stripe_invoice_id: session.invoice || null,
        created_at: new Date().toISOString(),
      }])
      .select();

    if (orderError) {
      console.error('❌ Error insertando orden:', orderError);
      throw orderError;
    }

    if (!orderData || orderData.length === 0) {
      throw new Error('No se retornó el ID de la orden');
    }

    const orderId = orderData[0].id;
    console.log('✅ Orden creada con ID:', orderId);

    // Insertar items de la orden
    if (items && items.length > 0) {
      console.log('📦 Insertando', items.length, 'items...');

      const orderItems = items.map((item: any) => ({
        order_id: orderId,
        wine_id: item.id,
        quantity: item.qty || item.quantity,
        unit_price: item.price,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('❌ Error insertando items:', itemsError);
        // No bloquear - la orden ya está creada
      } else {
        console.log('✅ Items insertados correctamente');
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        order_id: orderId,
        message: 'Webhook procesado correctamente',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ Error procesando webhook:', error.message);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
