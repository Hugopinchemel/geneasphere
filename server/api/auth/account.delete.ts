import { createError, defineEventHandler, readBody } from 'h3'
import { connectToDB } from '../../utils/db'
import { UserModel } from '../../models/User'
import { compare } from 'bcryptjs'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const body = await readBody<{ password?: string }>(event)
  const password = body.password || ''

  if (!password) {
    throw createError({ statusCode: 400, statusMessage: 'Confirmation password required' })
  }

  await connectToDB()

  const user = await UserModel.findById(session.user.id)
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  const match = await compare(password, user.password || '')
  if (!match) {
    throw createError({ statusCode: 401, statusMessage: 'Incorrect password' })
  }

  await UserModel.findByIdAndDelete(session.user.id)
  await clearUserSession(event)

  return { ok: true }
})
