// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: true,

  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@vueuse/nuxt',
    'nuxt-auth-utils'
  ],

  runtimeConfig: {
    oauth: {
      google: {
        clientId: process.env.NUXT_OAUTH_GOOGLE_CLIENT_ID,
        clientSecret: process.env.NUXT_OAUTH_GOOGLE_CLIENT_SECRET
      }
    }
  },

  devtools: {enabled: false},

  css: ['~/assets/css/main.css'],

  routeRules: {
    '/api/**': {cors: true}
  },

  vite: {
    optimizeDeps: {
      include: ['mongoose']
    }
  },

  compatibilityDate: '2024-07-11',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
