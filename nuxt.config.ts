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

  devtools: { enabled: false },

  components: [
    {
      path: '~/components',
      pathPrefix: false
    },
    {
      path: '~/components/dashboard',
      pathPrefix: false
    },
    {
      path: '~/components/tree',
      pathPrefix: false
    },
    {
      path: '~/components/teams',
      pathPrefix: false
    },
    {
      path: '~/components/user',
      pathPrefix: false
    },
    {
      path: '~/components/notifications',
      pathPrefix: false
    },
    {
      path: '~/components/inbox',
      pathPrefix: false
    }
  ],

  css: ['~/assets/css/main.css'],

  routeRules: {
    '/api/**': {
      cors: true,
      headers: {
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Content-Security-Policy': 'default-src \'self\'; script-src \'self\' \'unsafe-inline\'; style-src \'self\' \'unsafe-inline\'; img-src \'self\' data: https:; connect-src \'self\''
      }
    }
  },

  nitro: {
    externals: {
      external: ['mailer']
    }
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
