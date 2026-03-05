import { getMailer } from '~~/server/utils/mailer'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const mailer = await getMailer()

  const [smtp, imap] = await Promise.allSettled([
    mailer.testSMTPConnection(),
    mailer.testIMAPConnection()
  ])

  return {
    smtp: smtp.status === 'fulfilled' ? smtp.value : false,
    imap: imap.status === 'fulfilled' ? imap.value : false
  }
})

