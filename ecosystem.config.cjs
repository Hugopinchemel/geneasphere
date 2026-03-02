const fs = require('fs')
const path = require('path')

// Parse .env file so PM2 passes the required env vars to the server process.
// Nitro's production build does not auto-load .env, so we do it here.
function loadDotEnv() {
  const envPath = path.join(__dirname, '.env')
  try {
    const content = fs.readFileSync(envPath, 'utf-8')
    const vars = {}
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx === -1) continue
      const key = trimmed.slice(0, eqIdx).trim()
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
      vars[key] = val
    }
    return vars
  } catch {
    return {}
  }
}

const dotEnv = loadDotEnv()

module.exports = {
  apps: [
    {
      name: 'geneasphere',
      script: '.output/server/index.mjs',
      // cwd must be the project root so the server resolves paths correctly
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        // Spread all .env vars so NUXT_SESSION_PASSWORD, MONGODB_URI, etc. are available
        ...dotEnv
      }
    },
    {
      name: 'geneasphere-webhook',
      script: 'webhook.mjs',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      env: {
        WEBHOOK_PORT: 9000,
        WEBHOOK_SECRET: dotEnv.WEBHOOK_SECRET || '' // set in .env or system environment
      }
    }
  ]
}
