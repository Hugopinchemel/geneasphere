// Sensitive credentials (MONGODB_URI, NUXT_SESSION_PASSWORD, NUXT_OAUTH_*, MAILER_IMAP_PASS)
// are loaded from the .env file on the server — never commit real values here.
require('dotenv').config({ path: __dirname + '/.env' })

module.exports = {
  apps: [
    {
      name: 'geneasphere',
      script: '.output/server/index.mjs',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 3005,
        HOST: process.env.HOST || '0.0.0.0',
        MONGODB_URI: process.env.MONGODB_URI,
        NUXT_SESSION_PASSWORD: process.env.NUXT_SESSION_PASSWORD,
        NUXT_PUBLIC_BASE_URL: process.env.NUXT_PUBLIC_BASE_URL || 'https://geneasphere.hugo-pinchemel.fr',
        NUXT_OAUTH_GOOGLE_CLIENT_ID: process.env.NUXT_OAUTH_GOOGLE_CLIENT_ID,
        NUXT_OAUTH_GOOGLE_CLIENT_SECRET: process.env.NUXT_OAUTH_GOOGLE_CLIENT_SECRET,
        MAILER_SMTP_HOST: process.env.MAILER_SMTP_HOST || 'localhost',
        MAILER_SMTP_PORT: process.env.MAILER_SMTP_PORT || 25,
        MAILER_SMTP_SECURE: process.env.MAILER_SMTP_SECURE || false,
        MAILER_IMAP_HOST: process.env.MAILER_IMAP_HOST || 'localhost',
        MAILER_IMAP_PORT: process.env.MAILER_IMAP_PORT || 143,
        MAILER_IMAP_SECURE: process.env.MAILER_IMAP_PASS || false,
        MAILER_IMAP_USER: process.env.MAILER_IMAP_USER || 'contact',
        MAILER_IMAP_PASS: process.env.MAILER_IMAP_PASS,
        MAILER_FROM: process.env.MAILER_FROM || '"GeneaSphere" <geneasphere@hugo-pinchemel.fr>',
        NODE_PATH: __dirname + '/node_modules'
      }
    },
    {
      name: 'geneasphere-webhook',
      script: 'webhook.mjs',
      instances: 1,
      exec_mode: 'fork',
      env: {
        WEBHOOK_PORT: 9000,
        WEBHOOK_SECRET: process.env.WEBHOOK_SECRET || ''
      }
    }
  ]
}
