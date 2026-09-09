# De Altura Wines - Marketplace & CRM

Plataforma de e-commerce premium para la distribución de vinos argentinos en Canarias.

## 📁 Estructura del Proyecto

```
├── index.html                 # Catálogo y carrito de compra
├── checkout.html              # Proceso de pago
├── admin.html                 # Dashboard administrativo (incluye vista CRM)
├── login.html                 # Autenticación
│
├── assets/                    # Recursos estáticos
│   ├── images/                # Imágenes (antes en /imagenes)
│   ├── js/
│   │   └── load-wines.js      # Carga wines.json a Supabase (usado por admin/load-wines.html)
│   └── data/
│       └── wines.json         # Catálogo de 44 vinos
│
├── supabase/
│   └── schema.sql             # Estructura de base de datos
│
├── .env.example               # Template de variables de entorno
└── README.md                  # Este archivo
```

## 🚀 Quick Start

### 1. Configurar variables de entorno
```bash
cp .env.example .env.local
# Edita .env.local con tus credenciales de Supabase y Stripe
```

### 2. Crear base de datos
Copia el contenido de `supabase/schema.sql` en el SQL Editor de Supabase.

### 3. Servir localmente
```bash
# Con Python
python -m http.server 8000

# O con Node.js
npx http-server
```

Accede a `http://localhost:8000/index.html`

## 📊 Datos de Vinos

El catálogo se encuentra en `/assets/data/wines.json` con 44 vinos estructurados por región:

- **Norte Argentino** (14 vinos): Cafayate, Maimará, Jujuy
- **Región de Cuyo** (22 vinos): San Juan, Valle de Uco, Mendoza
- **Patagonia** (8 vinos): La Pampa

Cada vino incluye:
```json
{
  "id": "llama-malbec",
  "name": "The Llama Malbec 2025",
  "type": "tinto",
  "region": "norte",
  "price": 11.48,
  "price_horeca": 9.18,      // 20% descuento
  "aiem_rate": 0.15,         // 15% impuesto
  "igic_rate": 0.07,         // IGIC Canarias 7%
  "bodega": "Viñas en Flor",
  "box": 6,
  "notes_es": "...",
  "notes_en": "..."
}
```

## 🗄️ Base de Datos (Supabase)

### Tablas Principales

- **users**: Usuarios registrados (cliente, HORECA, admin)
- **wines**: Catálogo completo con precios retail y mayorista
- **orders**: Pedidos (estado de pago y envío)
- **order_items**: Ítems individuales por orden
- **bank_transfers**: Registro de transferencias bancarias

Ver `supabase/schema.sql` para detalles completos.

## 💳 Integración de Pagos

### Stripe
- `create-payment-intent` Edge Function en `supabase/functions/`
- Stripe.js en `checkout.html`

### Transferencia Bancaria
- Tabla `bank_transfers` para almacenar referencias
- Validación manual de pagos en el admin (`admin.html`)

## 🔐 Autenticación

Próximamente integración completa con Supabase Auth. Por ahora:
- Login simple con email/contraseña
- Almacenamiento en localStorage
- Roles: customer, horeca, admin

## 📱 Responsividad

Todos los HTML usan Tailwind CSS con:
- Mobile-first approach
- Breakpoints: sm, md, lg, xl
- Tema de colores personalizado (wine, gold, stone)

## 🎨 Paleta de Colores

```css
--wine-900: #360914
--wine-800: #54101d
--wine-700: #7a182a
--gold-500: #C89F5D
--stone-50: #FAF9F7
--stone-900: #1A1918
```

## 🚀 Próximas Mejoras

- [ ] Conexión completa a Supabase Auth
- [ ] Integración con Stripe
- [ ] Historial de pedidos en CRM
- [ ] Dashboard de ventas
- [ ] Notificaciones por email
- [ ] Gestión de inventario
- [ ] Reportes de analytics

## 📄 Licencia

Proprietary - De Altura Wines © 2025

---

**Última actualización**: 2025-04-07  
**Estructura estable** ✅
