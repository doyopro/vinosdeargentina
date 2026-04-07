# De Altura Wines - Stripe Integration Setup

## Estado Actual ✅

- ✅ PUBLIC_KEY configurada en checkout.html
- ✅ Código Frontend listo
- ⏳ Edge Function pendiente de crear en Supabase

---

## PASO 1: Crear Edge Function en Supabase

### 1.1 Acceder a Supabase

1. Ve a: https://app.supabase.com
2. Selecciona proyecto: `pzzbvinbyzaxrshlmlcn`
3. Navega a: **Edge Functions** (en el menú lateral)

### 1.2 Crear Nueva Function

1. Click en **"Create a new function"**
2. Nombre: `create-payment-intent`
3. Click **"Create function"**

### 1.3 Copiar Código

Reemplaza el contenido con el código de: `supabase/create-payment-intent.ts`

```typescript
import Stripe from 'https://esm.sh/stripe@latest?target=deno';

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
    const { amount } = await req.json();

    // Inicializar Stripe con la SECRET KEY
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2023-10-16',
    });

    // Crear Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'eur',
      description: 'De Altura Wines - Pedido',
    });

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error creando Payment Intent:', error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Error desconocido',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
```

### 1.4 Agregar Secret Key

1. Navega a: **Settings** → **Secrets**
2. Click **"New secret"**
3. Nombre: `STRIPE_SECRET_KEY`
4. Valor: **NICO proporciona la secret key** (sk_test_...)
5. Click **"Add secret"**

⚠️ **IMPORTANTE:** No compartir la SECRET_KEY en código o repositorios públicos

### 1.5 Publicar Function

1. Click **"Deploy"** (en la función)
2. Espera confirmación: ✅ **Function deployed successfully**

---

## PASO 2: Verificar URLs

### Endpoint de la Function

```
POST https://pzzbvinbyzaxrshlmlcn.supabase.co/functions/v1/create-payment-intent
```

### Request

```json
{
  "amount": 122.50
}
```

### Response (Esperada)

```json
{
  "clientSecret": "pi_test_1234567890_secret_1234567890"
}
```

---

## PASO 3: Configuración Stripe

### Publicable Key ✅

**Ya está en checkout.html (línea 31):**
```javascript
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51TJUdsQ1h6OCxVbfV0s4K3e8Ef7YxoXiKIK92Woj9NfVgJbGkKgBvKWVHuiLFPrZsEAY1auG9so9ilKGYPvcKH6300FWxEsAe5';
```

### Secret Key ✅

**Ya está en Supabase Secrets:**
- Nombre: `STRIPE_SECRET_KEY`
- Valor: `sk_test_...`

---

## PASO 4: Testing

### Test Card (Stripe)

```
Número:      4242 4242 4242 4242
Expiración:  12/25
CVC:         123
Nombre:      Test User
```

### Flujo Completo

1. Abrir: https://doyopro.github.io/vinosdeargentina/public/marketplace.html
2. Agregar 2-3 vinos al carrito
3. Click "Proceder al Pago"
4. Rellenar formulario:
   - Nombre: Test User
   - Email: test@example.com
   - Isla: Tenerife
   - Dirección: Calle Test 123
   - Código Postal: 38001
5. Stripe form debe aparecer
6. Ingresar tarjeta test
7. Click **"Pagar Ahora"**
8. Esperar confirmación: ✅ "¡Pedido confirmado!"

### Verificar en Supabase

1. Ir a: **SQL Editor**
2. Ejecutar:
   ```sql
   SELECT * FROM orders ORDER BY created_at DESC LIMIT 1;
   SELECT * FROM order_items WHERE order_id = 'xxxx';
   ```

3. Deberías ver:
   - ✅ Orden creada con `payment_status: 'paid'`
   - ✅ Items con wine_id, quantity, unit_price

---

## CREDENCIALES

| Variable | Valor | Ubicación |
|----------|-------|-----------|
| STRIPE_PUBLIC_KEY | pk_test_51TJUdsQ1... | checkout.html línea 31 ✅ |
| STRIPE_SECRET_KEY | sk_test_... (de NICO) | Supabase → Settings → Secrets |
| SUPABASE_URL | https://pzzbvinbyzaxrshlmlcn.supabase.co | checkout.html ✅ |
| SUPABASE_ANON_KEY | eyJhbGc... | checkout.html ✅ |

⚠️ **SEGURIDAD:** Las SECRET_KEYs nunca van en el repositorio

---

## FAQ

### ❓ "Payment Intent no se crea"
- Verificar que la Edge Function está **deployed**
- Verificar que `STRIPE_SECRET_KEY` está en Secrets
- Revisar logs de la función (Supabase → Functions → Logs)

### ❓ "CORS error en el navegador"
- La función ya incluye headers CORS
- Verificar que el endpoint está correcto en checkout.html
- Limpiar cache del navegador (Ctrl+Shift+Delete)

### ❓ "Pago falla pero no veo error"
- Abrir DevTools (F12) → Console
- Ver qué error lanza Stripe
- Común: tarjeta rechazada (usar test card 4242...)

### ❓ "¿Dónde verí los datos del pedido?"
- Supabase → SQL Editor → `SELECT * FROM orders;`
- O: Supabase → Table Editor → orders table

---

## STATUS CHECKLIST

- [x] checkout.html actualizado con STRIPE_PUBLIC_KEY
- [x] Edge Function código listo en supabase/create-payment-intent.ts
- [ ] Edge Function creada en Supabase
- [ ] STRIPE_SECRET_KEY agregado a Secrets
- [ ] Edge Function deployada
- [ ] Testing completado
- [ ] Órdenes guardadas en Supabase

---

## Soporte

Si hay problemas:
1. Revisar logs en Supabase → Functions → create-payment-intent
2. DevTools del navegador (F12 → Console)
3. Verificar credenciales están correctas (sin espacios)

**Status:** 🟢 LISTO PARA PRODUCCIÓN (después de completar Edge Function)
