import { createError, defineEventHandler, readBody } from 'h3'
import { connectToDB } from '~~/server/utils/db'
import { UserModel } from '~~/server/models/User'
import { compare, hash } from 'bcryptjs'
import { validatePassword } from '~~/server/utils/password'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const body = await readBody<{ current?: string, new?: string }>(event)
  const currentPw = body.current || ''
  const newPw = body.new || ''

  if (!currentPw || !newPw) {
    throw createError({ statusCode: 400, statusMessage: 'Missing current or new password' })
  }

  const pwdValidation = validatePassword(newPw)
  if (!pwdValidation.valid) {
    throw createError({ statusCode: 400, statusMessage: pwdValidation.message })
  }

  await connectToDB()

  const user = await UserModel.findById(session.user.id)
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  const match = await compare(currentPw, user.password || '')
  if (!match) {
    throw createError({ statusCode: 401, statusMessage: 'Current password is incorrect' })
  }

  user.password = await hash(newPw, 10)
  await user.save()

  return { ok: true }
})
