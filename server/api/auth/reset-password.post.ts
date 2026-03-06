import { readBody } from 'h3'
import { connectToDB } from '~~/server/utils/db'
import { UserModel } from '~~/server/models/User'
import { verifyResetToken } from '~~/server/utils/resetToken'
import { hash } from 'bcryptjs'
import { validatePassword } from '~~/server/utils/password'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ token?: string, password?: string }>(event)
  const token = body.token || ''
  const newPassword = body.password || ''

  if (!token || !newPassword) {
    throw createError({ statusCode: 400, statusMessage: 'Token et mot de passe requis' })
  }

  const pwdValidation = validatePassword(newPassword)
  if (!pwdValidation.valid) {
    throw createError({ statusCode: 400, statusMessage: pwdValidation.message })
  }

  const payload = verifyResetToken(token)
  if (!payload) {
    throw createError({ statusCode: 400, statusMessage: 'Lien invalide ou expiré' })
  }

  await connectToDB()

  const user = await UserModel.findById(payload.userId)
  if (!user || user.email !== payload.email) {
    throw createError({ statusCode: 404, statusMessage: 'Utilisateur introuvable' })
  }

  user.password = await hash(newPassword, 10)
  await user.save()

  return { ok: true }
})

