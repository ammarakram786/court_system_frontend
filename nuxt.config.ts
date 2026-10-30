export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: true,

  modules: ['@nuxt/ui', '@pinia/nuxt'],

  css: ['~/assets/css/main.css'],

  // Server-only keys go at the top level; only `public` is exposed to the browser.
  runtimeConfig: {
    public: {
      appName: 'Law DTE',
      // Django DRF API root, e.g. http://localhost:8000/api/v1
      // Override with NUXT_PUBLIC_API_BASE
      apiBase: 'http://localhost:8000/api/v1'
    }
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
