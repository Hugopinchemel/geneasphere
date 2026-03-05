import { getRouterParam } from 'h3'
import { getMailer } from '~~/server/utils/mailer'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const uid = Number(getRouterParam(event, 'uid'))
  if (!uid || isNaN(uid)) throw createError({ statusCode: 400, statusMessage: 'UID invalide' })

  const mailer = await getMailer()
  return mailer.deleteEmail(uid)
})

