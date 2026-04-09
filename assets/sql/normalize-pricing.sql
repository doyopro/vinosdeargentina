-- ═══════════════════════════════════════════════════════════════════
-- NORMALIZACIÓN CONTABLE DE TABLA 'products'
-- Controller Financiero: Sincronización Nico Canarias
-- ═══════════════════════════════════════════════════════════════════

-- PASO 1: Crear columna 'price_cost_net' si no existe
ALTER TABLE products
ADD COLUMN IF NOT EXISTS price_cost_net DECIMAL(10,2);

-- PASO 2: Actualizar 'price_cost_net' = 90% de precio_horeca (Tu coste real con 10% dto)
UPDATE products
SET price_cost_net = ROUND(CAST(price_horeca AS DECIMAL) * 0.90, 2)
WHERE price_horeca IS NOT NULL AND price_horeca > 0;

-- PASO 3: Actualizar 'price_retail' = (Tarifa Proveedor * 1.35 margen) * 1.07 IGIC
-- Esto genera el PVP final exacto: (5.00 * 1.35) * 1.07 = 7.22€
UPDATE products
SET price_retail = ROUND((CAST(price_horeca AS DECIMAL) * 1.35) * 1.07, 2)
WHERE price_horeca IS NOT NULL AND price_horeca > 0;

-- PASO 4: Limpiar basura de tests (precios que son 0.10, 0.01, etc. - probablemente de tests)
UPDATE products
SET price_retail = ROUND((CAST(price_horeca AS DECIMAL) * 1.35) * 1.07, 2)
WHERE price_retail < 1.00 OR price_retail IS NULL;

-- ═══════════════════════════════════════════════════════════════════
-- AUDITORÍA: Verificar estructura final
-- ═══════════════════════════════════════════════════════════════════

-- Verificar "Buenos Aires Malbec" (o similar)
-- Esperado: cost_net ≈ 4.50€ | horeca = 5.00€ | retail ≈ 7.22€
SELECT
    id,
    name,
    bodega,
    ROUND(CAST(price_horeca AS DECIMAL), 2) as "Tarifa Proveedor",
    ROUND(price_cost_net, 2) as "Tu Coste Neto (90%)",
    ROUND(price_retail, 2) as "PVP Final (con IGIC)",
    ROUND((ROUND(price_retail, 2) / 1.07) - price_cost_net, 2) as "Margen Bruto"
FROM products
WHERE name LIKE '%Malbec%' OR name LIKE '%Buenos%'
LIMIT 5;

-- Verificar que NO hay precios inválidos (< 1.00)
SELECT
    id,
    name,
    price_horeca,
    price_cost_net,
    price_retail
FROM products
WHERE price_retail < 1.00 OR price_retail IS NULL
ORDER BY price_retail ASC;

-- Verificar conteo total de productos procesados
SELECT
    COUNT(*) as "Total Productos",
    COUNT(price_cost_net) as "Con Coste Neto",
    COUNT(price_retail) as "Con PVP Final",
    MIN(price_retail) as "PVP Mínimo",
    MAX(price_retail) as "PVP Máximo",
    ROUND(AVG(price_retail), 2) as "PVP Promedio"
FROM products;

-- ═══════════════════════════════════════════════════════════════════
-- REPORTE DE MÁRGENES
-- ═══════════════════════════════════════════════════════════════════

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
ORDER BY margen_beneficio DESC
LIMIT 20;
