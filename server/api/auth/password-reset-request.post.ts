import { createError, defineEventHandler, readBody } from 'h3'
import { connectToDB } from '~~/server/utils/db'
import { UserModel } from '~~/server/models/User'
import { getMailer } from '~~/server/utils/mailer'
import { createPasswordResetEmail } from '~~/server/utils/emailTemplates'
import { randomBytes } from 'crypto'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string }>(event)

  const email = (body.email || '').toLowerCase().trim()

  if (!email) {
    throw createError({ statusCode: 400, statusMessage: 'Missing email' })
  }

  await connectToDB()

  const user = await UserModel.findOne({ email })

  // Pour des raisons de sécurité, on renvoie toujours un succès même si l'utilisateur n'existe pas
  if (!user) {
    return { ok: true, message: 'If an account exists, a reset link has been sent' }
  }

  // Générer un token sécurisé
  const resetToken = randomBytes(32).toString('hex')
  const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 heure

  user.resetToken = resetToken
  user.resetTokenExpiry = resetTokenExpiry
  await user.save()

  // Envoyer l'email
  try {
    const mailer = await getMailer()
    const resetUrl = `${getRequestURL(event).origin}/auth/reset-password`
    const emailContent = createPasswordResetEmail(user.name, resetToken, resetUrl)

    await mailer.sendMail({
      to: user.email,
      subject: emailContent.subject,
      body: emailContent.body
    })
  } catch (error) {
    console.error('Failed to send password reset email:', error)
    // On ne révèle pas l'erreur à l'utilisateur pour des raisons de sécurité
  }

  return { ok: true, message: 'If an account exists, a reset link has been sent' }
})
