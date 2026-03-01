module.exports = {
  apps: [
    {
      name: 'geneasphere',
      script: '.output/server/index.mjs',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'geneasphere-webhook',
      script: 'webhook.mjs',
      instances: 1,
      exec_mode: 'fork',
      env: {
        WEBHOOK_PORT: 9000,
        WEBHOOK_SECRET: '' // set via: pm2 set geneasphere-webhook:WEBHOOK_SECRET <secret>
                           // or use a .env file / systemd environment
      }
    }
  ]
}
