/**
 * Script para cargar wines.json en Supabase (ejecutar una sola vez)
 * Uso: Llamar loadWinesToSupabase() desde la consola
 */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.0/+esm';

const loadWinesToSupabase = async () => {
  const supabase = createClient(API_CONFIG.SUPABASE_URL, API_CONFIG.SUPABASE_ANON_KEY);

  try {
    console.log('Cargando wines.json...');
    const response = await fetch('/assets/data/wines.json');
    const wines = await response.json();

    // Transformar datos para la BD (mapear campos)
    const winesForDB = wines.map(wine => ({
      id: wine.id,
      name: wine.name,
      bodega: wine.bodega,
      region: wine.region,
      type: wine.type,
      price_retail: wine.price,
      price_horeca: wine.price_horeca,
      aiem_rate: wine.aiem_rate,
      igic_rate: wine.igic_rate,
      box_size: wine.box,
      notes_es: wine.notes_es,
      notes_en: wine.notes_en
    }));

    console.log(`Insertando ${winesForDB.length} vinos en Supabase...`);

    // Insertar en lotes para evitar errores
    const batchSize = 10;
    for (let i = 0; i < winesForDB.length; i += batchSize) {
      const batch = winesForDB.slice(i, i + batchSize);
      const { error } = await supabase
        .from('wines')
        .insert(batch);

      if (error) {
        console.error(`Error en batch ${i / batchSize + 1}:`, error);
      } else {
        console.log(`✓ Lote ${i / batchSize + 1}/${Math.ceil(winesForDB.length / batchSize)} insertado`);
      }
    }

    console.log('✅ Carga completada');
  } catch (error) {
    console.error('Error cargando wines:', error);
  }
};

// Exportar para uso global
window.loadWinesToSupabase = loadWinesToSupabase;
