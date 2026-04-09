# Normalización Contable de Tabla Products
## Instrucciones para Ejecutar en Supabase

### 🔒 ANTES DE EMPEZAR
⚠️ **IMPORTANTE:** Este script modifica datos financieros críticos. Hacer un **BACKUP** primero.

1. Ve a tu dashboard de Supabase: https://app.supabase.com
2. Selecciona tu proyecto
3. Ve a "SQL Editor" en el menú lateral izquierdo

---

## 📋 CONTEXTO CONTABLE (Para Nico)

**Flujo de Costes:**
```
Tarifa Proveedor (price_horeca): 5.00€
    ↓ Descuento 10% (para importación)
Tu Coste Real (price_cost_net): 4.50€
    ↓ Margen 35%
Precio Base (sin IGIC): 6.08€
    ↓ Aplicar IGIC 7%
PVP Final (price_retail): 7.22€
```

**Las columnas finales serán:**
- `price_horeca`: 5.00€ (Tu precio de venta a HORECA - margen 11% sobre coste neto)
- `price_cost_net`: 4.50€ (Tu coste neto después de descuento 10%)
- `price_retail`: 7.22€ (PVP final que cobra al cliente directo)

---

## 🚀 PASOS DE EJECUCIÓN

### Paso 1: Crear la columna 'price_cost_net'

Copia y ejecuta SOLO ESTE BLOQUE primero:

```sql
ALTER TABLE products
ADD COLUMN IF NOT EXISTS price_cost_net DECIMAL(10,2);
```

✅ Presiona "Run" (Ctrl+Enter)

---

### Paso 2: Calcular Coste Neto (90% de tarifa proveedor)

Copia y ejecuta:

```sql
UPDATE products
SET price_cost_net = ROUND(CAST(price_horeca AS DECIMAL) * 0.90, 2)
WHERE price_horeca IS NOT NULL AND price_horeca > 0;
```

✅ Presiona "Run"
✅ Deberías ver "X rows affected"

---

### Paso 3: Actualizar PVP Final

Copia y ejecuta:

```sql
UPDATE products
SET price_retail = ROUND((CAST(price_horeca AS DECIMAL) * 1.35) * 1.07, 2)
WHERE price_horeca IS NOT NULL AND price_horeca > 0;
```

✅ Presiona "Run"

---

### Paso 4: Limpiar Basura de Tests

Copia y ejecuta (para eliminar precios < 1.00€ que son de tests):

```sql
UPDATE products
SET price_retail = ROUND((CAST(price_horeca AS DECIMAL) * 1.35) * 1.07, 2)
WHERE price_retail < 1.00 OR price_retail IS NULL;
```

✅ Presiona "Run"

---

## ✅ AUDITORÍA - Verificar Datos

### Paso 5A: Buscar "Buenos Aires Malbec"

Copia y ejecuta para verificar que quedó correcto:

```sql
SELECT
    id,
    name,
    bodega,
    ROUND(CAST(price_horeca AS DECIMAL), 2) as "Tarifa Proveedor",
    ROUND(price_cost_net, 2) as "Tu Coste Neto",
    ROUND(price_retail, 2) as "PVP Final"
FROM products
WHERE name LIKE '%Malbec%' OR name LIKE '%Buenos%'
LIMIT 5;
```

**Esperado:**
```
Tarifa Proveedor: 5.00€
Tu Coste Neto: 4.50€
PVP Final: 7.22€
```

---

### Paso 5B: Verificar que NO hay precios rotos

Copia y ejecuta:

```sql
SELECT
    id,
    name,
    price_horeca,
    price_cost_net,
    price_retail
FROM products
WHERE price_retail < 1.00 OR price_retail IS NULL
ORDER BY price_retail ASC;
```

**Esperado:** 0 filas (lista vacía)

Si hay resultados, son basura de tests - deberían estar limpiadas ya.

---

### Paso 5C: Ver Estadísticas Generales

Copia y ejecuta:

```sql
SELECT
    COUNT(*) as "Total Productos",
    COUNT(price_cost_net) as "Con Coste Neto",
    COUNT(price_retail) as "Con PVP Final",
    MIN(price_retail) as "PVP Mínimo",
    MAX(price_retail) as "PVP Máximo",
    ROUND(AVG(price_retail), 2) as "PVP Promedio"
FROM products;
```

---

## 📊 REPORTE DE MÁRGENES

Copia y ejecuta para ver los márgenes por producto:

```sql
SELECT
    name,
    bodega,
    ROUND(CAST(price_horeca AS DECIMAL), 2) as "Tarifa €",
    ROUND(price_cost_net, 2) as "Coste Neto €",
    ROUND(price_retail, 2) as "PVP Final €",
    ROUND((price_retail / 1.07), 2) as "PVP sin IGIC €",
    ROUND(((price_retail / 1.07) - price_cost_net) / price_cost_net * 100, 1) as "Margen %",
    region,
    type
FROM products
ORDER BY "Margen %" DESC
LIMIT 20;
```

---

## 🔍 MARGEN PROMEDIO DEL CATÁLOGO

Para ver el margen de beneficio PROMEDIO:

```sql
SELECT
    ROUND(AVG(((price_retail / 1.07) - price_cost_net) / price_cost_net * 100), 2) as "Margen Promedio %",
    ROUND(AVG(price_retail / 1.07), 2) as "PVP Promedio sin IGIC €",
    ROUND(AVG(price_cost_net), 2) as "Coste Neto Promedio €",
    ROUND(AVG(((price_retail / 1.07) - price_cost_net)), 2) as "Beneficio Promedio por Botella €"
FROM products;
```

---

## ⚡ VERIFICACIÓN FINAL

Una vez completados todos los pasos, ejecuta esto para confirmar integridad:

```sql
SELECT
    COUNT(*) as "Total",
    COUNT(CASE WHEN price_horeca > 0 THEN 1 END) as "Con Tarifa",
    COUNT(CASE WHEN price_cost_net > 0 THEN 1 END) as "Con Coste Neto",
    COUNT(CASE WHEN price_retail > 0 THEN 1 END) as "Con PVP Final",
    COUNT(CASE WHEN price_retail >= 1.00 THEN 1 END) as "PVP >= 1€ (válidos)"
FROM products;
```

**Esperado:** Todos los conteos deben ser iguales (o muy cercanos)

---

## 🚨 SI ALGO SALE MAL

### Revertir Cambios
Si necesitas revertir TODO:

```sql
-- ⚠️ Solo si algo salió mal
DROP COLUMN IF EXISTS price_cost_net;
-- Y restaurar desde backup
```

---

## 📝 RESUMEN DE CAMBIOS

| Campo | Antes | Después | Lógica |
|-------|-------|---------|--------|
| `price_horeca` | 5.00 | 5.00 | NO CAMBIA (precio HORECA) |
| `price_cost_net` | (no existía) | 4.50 | price_horeca * 0.90 |
| `price_retail` | Variado | 7.22 | (price_horeca * 1.35) * 1.07 |

---

## ✨ Próximos Pasos

1. ✅ Ejecutar el script SQL anterior
2. ✅ Ejecutar auditorías
3. ✅ Verificar que el carrito siga funcionando (los IDs no cambian)
4. ✅ Ver Dashboard de Nico con márgenes correctos
5. ✅ Confirmar que las órdenes se graban con precios correctos
