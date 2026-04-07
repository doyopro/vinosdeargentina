// Configuración global de APIs y endpoints
const API_CONFIG = {
  // Credenciales de Supabase (hardcoded para development, idealmente desde .env)
  SUPABASE_URL: 'https://pzzbvinbyzaxrshlmlcn.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6emJ2aW5ieXpheHJzaGxtbGNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NTI5NDYsImV4cCI6MjA5MTEyODk0Nn0.YgeGDVZfyqI-nv7iAhROMsBfZbIK7BGUDyU1ERE-SFA',
  STRIPE_PUBLIC: '',
  WINES_DATA: '/assets/data/wines.json',

  // Configuración de rutas locales
  PATHS: {
    WINES: '/assets/data/wines.json',
    LOGIN: '/public/login.html',
    MARKETPLACE: '/public/marketplace.html',
    CHECKOUT: '/public/checkout.html',
    CRM: '/public/crm.html'
  },

  // Configuración de impuestos y márgenes
  TAXES: {
    AIEM_DEFAULT: 0.15,      // 15% por defecto
    IGIC_CANARIAS: 0.07,     // IGIC Canarias 7%
    HORECA_DISCOUNT: 0.20    // 20% descuento mayorista
  }
};

// Exportar para ES modules y CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = API_CONFIG;
}
