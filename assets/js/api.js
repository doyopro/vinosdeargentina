/**
 * API Module - Integración con backend (Supabase y Stripe)
 * Estructura para llamadas HTTP y gestión de datos
 */

// Importar cliente Supabase desde CDN
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.0/+esm';

const APIModule = (() => {
  const config = API_CONFIG;
  const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);

  // Obtener catálogo de vinos desde Supabase
  const getWines = async () => {
    try {
      const { data, error } = await supabase
        .from('wines')
        .select('*')
        .order('region', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error en getWines:', error);
      return [];
    }
  };

  // Obtener vino por ID
  const getWineById = async (id) => {
    const wines = await getWines();
    return wines.find(w => w.id === id) || null;
  };

  // Filtrar vinos
  const filterWines = async (filters) => {
    let wines = await getWines();

    if (filters.type) {
      wines = wines.filter(w => filters.type.includes(w.type));
    }
    if (filters.region) {
      wines = wines.filter(w => filters.region.includes(w.region));
    }
    if (filters.box) {
      wines = wines.filter(w => filters.box.includes(w.box));
    }
    if (filters.priceMax) {
      wines = wines.filter(w => w.price <= filters.priceMax);
    }

    return wines;
  };

  // Crear orden en Supabase
  const createOrder = async (orderData) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert([{
          customer_name: orderData.customer_name,
          customer_email: orderData.customer_email,
          customer_phone: orderData.customer_phone || '',
          island: orderData.island,
          address: orderData.address,
          postal_code: orderData.postal_code || '',
          subtotal_amount: orderData.subtotal_amount || 0,
          tax_amount: orderData.tax_amount || 0,
          total_amount: orderData.total_amount,
          items: orderData.items,
          payment_method: orderData.payment_method,
          payment_status: orderData.payment_status || 'pending',
          shipping_status: orderData.shipping_status || 'new',
          notes: orderData.notes || ''
        }])
        .select();

      if (error) throw error;
      return { order: data ? data[0] : null };
    } catch (error) {
      console.error('Error creando orden:', error);
      return { error: error.message || 'No se pudo crear la orden' };
    }
  };

  // Procesar pago con Stripe (preparado)
  const createPaymentIntent = async (amount, currency = 'EUR') => {
    try {
      // TODO: POST a backend para crear PaymentIntent
      console.log('PaymentIntent creado (mock):', { amount, currency });
      return { clientSecret: 'pi_mock_' + Math.random() };
    } catch (error) {
      console.error('Error en pago:', error);
      return { error: 'No se pudo procesar el pago' };
    }
  };

  // Obtener órdenes del usuario desde Supabase
  const getUserOrders = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { orders: data || [] };
    } catch (error) {
      console.error('Error obteniendo órdenes:', error);
      return { error: 'No se pudieron obtener las órdenes' };
    }
  };

  // Obtener todas las órdenes (admin)
  const getAllOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { orders: data || [] };
    } catch (error) {
      console.error('Error obteniendo todas las órdenes:', error);
      return { error: 'No se pudieron obtener las órdenes' };
    }
  };

  // Calcular total con impuestos
  const calculateTotal = (items, userDiscountPercent = 0) => {
    let subtotal = 0;

    items.forEach(item => {
      const pricePerUnit = item.price || 0;
      const quantity = item.quantity || 1;
      subtotal += pricePerUnit * quantity;
    });

    // Aplicar descuento del usuario
    if (userDiscountPercent > 0) {
      subtotal *= (1 - userDiscountPercent / 100);
    }

    // Aplicar IGIC Canarias
    const igic = subtotal * config.TAXES.IGIC_CANARIAS;
    const total = subtotal + igic;

    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      igic: parseFloat(igic.toFixed(2)),
      total: parseFloat(total.toFixed(2))
    };
  };

  return {
    getWines,
    getWineById,
    filterWines,
    createOrder,
    createPaymentIntent,
    getUserOrders,
    getAllOrders,
    calculateTotal,
    supabase // Exportar cliente para acceso directo si es necesario
  };
})();
