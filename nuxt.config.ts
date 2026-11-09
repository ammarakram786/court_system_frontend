export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: true,

  modules: ['@nuxt/ui', '@pinia/nuxt'],

  css: ['~/assets/css/main.css'],

  // Enterprise Dual-Base Runtime Configuration:
  // - Top-level keys are private and only accessible on the Node.js SSR server.
  // - `public` keys are bundled and exposed to the client browser.
  runtimeConfig: {
    // Internal server-to-server URL for high-speed, direct SSR requests (skips public DNS/ingress)
    apiBaseInternal: process.env.NUXT_API_BASE_INTERNAL || 'http://127.0.0.1:8000/api/v1',
    public: {
      appName: 'Law DTE',
      // Public API base for browser clients: defaults to relative '/api/v1' under unified reverse proxy
      apiBase: process.env.NUXT_PUBLIC_API_BASE || '/api/v1'
    }
  },

  // High-performance Nitro engine configuration
  nitro: {
    compressPublicAssets: true
  },

  // Zero-CORS Developer Experience:
  // In development without Nginx, transparently proxy /api to the Django DRF backend
  routeRules: {
    ...(process.env.NODE_ENV !== 'production' ? {
      '/api/**': { proxy: 'http://127.0.0.1:8000/api/**' }
    } : {})
  },

  app: {
    head: {
      titleTemplate: '%s · Law DTE',
      title: 'Admin',
      htmlAttrs: { lang: 'en' }
    }
  },

  typescript: {
    strict: true
  }
})
