import { readValidatedBody } from 'h3'
import { z } from 'zod'
import { getMailer } from '~~/server/utils/mailer'

const bodySchema = z.object({
  to: z.string().email('Adresse email invalide'),
  subject: z.string().min(1, 'Objet requis'),
  body: z.string().min(1, 'Corps du message requis'),
  cc: z.string().optional(),
  bcc: z.string().optional()
})

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const data = await readValidatedBody(event, bodySchema.parse)

  const mailer = await getMailer()
  return mailer.sendMail({
    to: data.to,
    subject: data.subject,
    body: data.body,
    ...(data.cc ? { cc: data.cc } : {}),
    ...(data.bcc ? { bcc: data.bcc } : {})
  })
})

