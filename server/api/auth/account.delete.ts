import { defineEventHandler, createError } from 'h3'
import { getUserSession, clearUserSession } from '#imports'
import { connectToDB } from '~~/server/utils/db'
import { UserModel } from '~~/server/models/User'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  await connectToDB()

  const deleted = await UserModel.findByIdAndDelete(session.user.id)
  if (!deleted) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  await clearUserSession(event)

  return { ok: true }
})
