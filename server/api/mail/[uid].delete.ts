import { getRouterParam } from 'h3'
import { connectToDB } from '~~/server/utils/db'
import { UserModel } from '~~/server/models/User'
import { getMailerClass, type MailerInstance } from '~~/server/utils/mailer'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const uid = Number(getRouterParam(event, 'uid'))
  if (!uid || isNaN(uid)) throw createError({ statusCode: 400, statusMessage: 'UID invalide' })

  await connectToDB()
  const user = await UserModel.findById(session.user.id).lean()
  if (!user) throw createError({ statusCode: 404, statusMessage: 'User not found' })

  if (!user.inboxEnabled) throw createError({ statusCode: 403, statusMessage: 'Inbox not enabled' })
  if (!user.password) throw createError({ statusCode: 400, statusMessage: 'No password set — cannot connect to IMAP' })

  const MailerAPI = getMailerClass()
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

  return mailer.deleteEmail(uid)
})
