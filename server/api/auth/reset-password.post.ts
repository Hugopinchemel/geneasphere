import { readBody } from 'h3'
import { connectToDB } from '~~/server/utils/db'
import { UserModel } from '~~/server/models/User'
import { verifyResetToken } from '~~/server/utils/resetToken'
import { hash } from 'bcryptjs'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ token?: string, password?: string }>(event)
  const token = body.token || ''
  const newPassword = body.password || ''

  if (!token || !newPassword) {
    throw createError({ statusCode: 400, statusMessage: 'Token et mot de passe requis' })
  }

  if (newPassword.length < 8) {
    throw createError({ statusCode: 400, statusMessage: 'Le mot de passe doit contenir au moins 8 caractères' })
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

