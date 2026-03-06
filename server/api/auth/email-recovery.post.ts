import { createError, defineEventHandler, readBody } from 'h3'
import { connectToDB } from '~~/server/utils/db'
import { UserModel } from '~~/server/models/User'
import { getMailer } from '~~/server/utils/mailer'
import { createForgottenEmailRecoveryEmail } from '~~/server/utils/emailTemplates'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ name?: string }>(event)

  const name = (body.name || '').trim()

  if (!name) {
    throw createError({ statusCode: 400, statusMessage: 'Missing name' })
  }

  await connectToDB()

  // Rechercher l'utilisateur par nom (insensible à la casse)
  const user = await UserModel.findOne({
    name: { $regex: new RegExp(`^${name}$`, 'i') }
  })

  // Pour des raisons de sécurité, on renvoie toujours un succès même si l'utilisateur n'existe pas
  if (!user) {
    return { ok: true, message: 'If an account exists with this name, a reminder has been sent' }
  }

  // Envoyer l'email avec l'adresse email
  try {
    const mailer = await getMailer()
    const emailContent = createForgottenEmailRecoveryEmail(user.name, user.email)

    await mailer.sendMail({
      to: user.email,
      subject: emailContent.subject,
      body: emailContent.body
    })
  } catch (error) {
    console.error('Failed to send email recovery email:', error)
    // On ne révèle pas l'erreur à l'utilisateur pour des raisons de sécurité
  }

  return { ok: true, message: 'If an account exists with this name, a reminder has been sent' }
})
