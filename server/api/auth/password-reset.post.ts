import { createError, defineEventHandler, readBody } from 'h3'
import { connectToDB } from '~~/server/utils/db'
import { UserModel } from '~~/server/models/User'
import { hash } from 'bcryptjs'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ token?: string, password?: string }>(event)

  const token = body.token || ''
  const password = body.password || ''

  if (!token || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Missing token or password' })
  }

  if (password.length < 8) {
    throw createError({ statusCode: 400, statusMessage: 'Password must be at least 8 characters' })
  }

  await connectToDB()

  const user = await UserModel.findOne({
    resetToken: token,
    resetTokenExpiry: { $gt: new Date() }
  })

  if (!user) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid or expired reset token' })
  }

  // Réinitialiser le mot de passe
  user.password = await hash(password, 10)
  user.resetToken = ''
  user.resetTokenExpiry = undefined
  await user.save()

  return { ok: true, message: 'Password reset successfully' }
})
