import { connectToDB } from '~~/server/utils/db'
import { UserModel } from '~~/server/models/User'
import type { MailerInstance } from '~~/server/utils/mailer'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  // Charger l'utilisateur complet pour vérifier inboxEnabled et récupérer le mot de passe
  await connectToDB()
  const user = await UserModel.findById(session.user.id).lean()
  if (!user) throw createError({ statusCode: 404, statusMessage: 'User not found' })

  if (!user.inboxEnabled) {
    throw createError({ statusCode: 403, statusMessage: 'Inbox not enabled for this account' })
  }

  if (!user.password) {
    throw createError({ statusCode: 400, statusMessage: 'No password set — cannot connect to IMAP (Google OAuth only account)' })
  }

  const query = getQuery(event)
  const limit = Number(query.limit) || 30

  // Instancier le mailer avec les credentials de l'utilisateur
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const MailerAPI = require('mailer')
  const mailer: MailerInstance = new MailerAPI({
    imap: {
      host: process.env.MAILER_IMAP_HOST || 'localhost',
      port: Number(process.env.MAILER_IMAP_PORT) || 143,
      secure: process.env.MAILER_IMAP_SECURE === 'true',
      auth: { user: user.email, pass: user.password },
      tls: { rejectUnauthorized: false }
    },
    smtp: {
      host: process.env.MAILER_SMTP_HOST || 'localhost',
      port: Number(process.env.MAILER_SMTP_PORT) || 25,
      secure: process.env.MAILER_SMTP_SECURE === 'true',
      tls: { rejectUnauthorized: false }
    },
    from: `"${user.name}" <${user.email}>`
  })

  const emails = await mailer.fetchInbox({ limit })

  return emails.map(mail => ({
    uid: mail.uid,
    from: mail.from,
    subject: mail.subject || '(sans objet)',
    body: mail.text || '',
    html: mail.html || '',
    date: mail.date.toISOString(),
    cc: mail.cc || null,
    attachments: mail.attachments ?? [],
    unread: true
  }))
})
