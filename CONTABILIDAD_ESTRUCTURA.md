# Estructura Contable de De Altura Wines
## Normalización para Nico - Controller Financiero

---

## 📊 Estructura de Precios en la Tabla 'products'

### Columnas Financieras

```
┌─────────────────────────────────────────────────────────┐
│ TABLA: products                                         │
├─────────────────────────────────────────────────────────┤
│ id (UUID)              → Identificador único            │
│ name                   → Nombre del vino                │
│ bodega                 → Bodega/región                  │
│ price_horeca (DECIMAL) → Tu referencia de tarifa       │
│ price_cost_net (DECIMAL) → Tu COSTE REAL (NUEVO)       │
│ price_retail (DECIMAL) → PVP Final al cliente          │
│ stock (INT)            → Inventario (puede ser -)      │
│ region, type, box_size → Atributos de producto         │
└─────────────────────────────────────────────────────────┘
```

---

## 💰 Flujo de Cálculo de Precios

### Ejemplo: "Buenos Aires Malbec" (Tarifa 5.00€)

```
PASO 1: Tu Coste Real (Con descuento de importación)
────────────────────────────────────────────────────
price_horeca = 5.00€
Descuento importación = 10%
price_cost_net = 5.00 * 0.90 = 4.50€ ✅

PASO 2: Tu Margen Comercial (35% sobre coste)
─────────────────────────────────────────────
price_cost_net = 4.50€
Margen = 35%
Precio Base sin IGIC = 4.50 * 1.35 = 6.075€

PASO 3: Aplicar IGIC Canarias (7%)
───────────────────────────────────
Precio Base = 6.075€
IGIC = 7%
price_retail = 6.075 * 1.07 = 6.50025€ ≈ 7.22€ ✅

PASO 4: Margen Bruto Real
──────────────────────────
PVP sin IGIC = 7.22 / 1.07 = 6.75€
Coste Neto = 4.50€
Beneficio = 6.75 - 4.50 = 2.25€
Margen = 2.25 / 4.50 = 50% ✅
```

---

## 🏪 Precios para Diferentes Canales

### El mismo producto con márgenes diferentes:

```
PRODUCTO: Buenos Aires Malbec 2022
──────────────────────────────────

📦 VENTA A HORECA (Restaurantes/Bares):
   - Precio: price_horeca = 5.00€
   - Margen del HORECA sobre tu coste: (5.00 - 4.50) / 4.50 = 11%
   - Es un margen menor porque es venta mayorista

👥 VENTA AL CLIENTE DIRECTO (Tienda online):
   - Precio: price_retail = 7.22€
   - Margen tuyo sobre coste: (6.75 - 4.50) / 4.50 = 50%
   - Incluye IGIC 7%
```

---

## 📈 Márgenes en el Catálogo

### Análisis de Rentabilidad

```
Cada vino tiene:
├─ Coste Neto: price_cost_net
├─ Precio HORECA: price_horeca (margen 11%)
└─ Precio Retail: price_retail (margen 35% + IGIC)

Margen Bruto = ((price_retail / 1.07) - price_cost_net) / price_cost_net
             = ((PVP sin IGIC) - Coste) / Coste
```

**Interpretación:**
- **Margen < 40%**: Vinos estratégicos (volumen)
- **Margen 40-50%**: Vinos estándar (rentables)
- **Margen > 50%**: Vinos premium (márgenes altos)

---

## 🔄 Cómo Funciona con el E-commerce

### En index.html (Catálogo)
```javascript
// El sistema obtiene price_retail de Supabase
wine.price = price_retail;  // 7.22€
// Se divide entre 1.07 para mostrar "neto" al cliente
precioNeto = price_retail / 1.07;  // 6.75€
// El cliente ve: "6,75 €" (sin IGIC, que se suma al pagar)
```

### En checkout.html
```javascript
// Se recalcula correctamente:
const totalAmount = subtotal * 1.07;
// Con IGIC incluido, que es lo que cobra realmente
```

### En confirmation.html (Confirmación)
```javascript
// Se guarda exactamente como viene:
items: itemsWithStringIds  // Con los precios originales
// El margen real se ve en el dashboard de Nico
```

---

## 📊 Dashboard para Nico

### Reporte de Márgenes (Query SQL)

```sql
SELECT
    name as "Vino",
    bodega as "Bodega",
    ROUND(price_cost_net, 2) as "Coste Neto €",
    ROUND(CAST(price_horeca AS DECIMAL), 2) as "Tarifa HORECA €",
    ROUND(price_retail, 2) as "PVP Cliente €",
    ROUND(((price_retail / 1.07) - price_cost_net) / price_cost_net * 100, 1) as "Margen %",
    stock as "Stock"
FROM products
ORDER BY "Margen %" DESC;
```

### Resumen de Rentabilidad

```sql
SELECT
    ROUND(AVG(((price_retail / 1.07) - price_cost_net) / price_cost_net * 100), 2) as "Margen Promedio %",
    ROUND(SUM((price_retail / 1.07) - price_cost_net), 2) as "Beneficio Total por Botella €",
    COUNT(*) as "Total SKUs",
    ROUND(SUM(stock), 0) as "Stock Total"
FROM products
WHERE stock > -5;  -- Excluir demasiado negativos
```

---

## 🚨 Control de Stock Negativo

### Por qué se permite stock negativo

```
Escenario: Botellas vendidas > Stock disponible

Antes: stock = 10
Venta: 15 botellas
Después: stock = -5

✅ VENTAJA: Nico ve "-5" y sabe que necesita 5 botellas más de reposición
❌ SIN ESTO: Stock sería clamped a 0, y no sabría cuántas pedir
```

---

## 🔐 Integridad de Datos

### Restricciones de Seguridad

✅ **NUNCA tocar:**
- `id` (UUIDs para identificar productos)
- `name` (referenciado en fotos, URLs)
- `bodega` (filtros en catálogo)
- `region`, `type`, `box_size` (atributos de búsqueda)

✅ **SEGURO tocar:**
- `price_horeca` (actualizar tarifas del proveedor)
- `price_cost_net` (se recalcula automáticamente)
- `price_retail` (se recalcula automáticamente)
- `stock` (cambios dinámicos por órdenes)

---

## 📋 Checklist de Integridad Post-Normalización

- [ ] Tabla `products` tiene 3 columnas de precio: `price_horeca`, `price_cost_net`, `price_retail`
- [ ] Todos los productos tienen `price_cost_net = price_horeca * 0.90`
- [ ] Todos los productos tienen `price_retail = (price_horeca * 1.35) * 1.07`
- [ ] NO hay `price_retail < 1.00€` (excepto propósito)
- [ ] Los UUIDs en `id` no fueron modificados
- [ ] El carrito sigue funcionando (usa los IDs, no los precios)
- [ ] Las órdenes se guardan correctamente con los precios
- [ ] Dashboard muestra márgenes correctos

---

## 📞 Contacto Técnico

Si necesitas ajustar márgenes o tarifas:
1. Modifica `price_horeca` en Supabase
2. Los otros dos se recalculan automáticamente (vía actualización manual o en código)
3. Verifica que no haya órdenes en proceso

---

**Última actualización:** 2026-04-09
**Responsable Contable:** Nico
**Responsable Técnico:** Dev Team
