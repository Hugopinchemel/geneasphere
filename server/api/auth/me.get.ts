import { defineEventHandler, createError } from 'h3'
import { getUserSession } from '#imports'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  return { user: session.user }
})
