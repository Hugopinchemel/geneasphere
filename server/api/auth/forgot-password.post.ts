import { readBody } from 'h3'
import { connectToDB } from '~~/server/utils/db'
import { UserModel } from '~~/server/models/User'
import { generateResetToken } from '~~/server/utils/resetToken'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string }>(event)
  const email = (body.email || '').toLowerCase().trim()

  if (!email) {
    throw createError({ statusCode: 400, statusMessage: 'Email requis' })
  }

  await connectToDB()

  const user = await UserModel.findOne({ email })

  // On répond toujours avec succès pour ne pas révéler si l'email existe
  if (!user) {
    return { ok: true }
  }

  if (!user.password) {
    // Compte Google sans mot de passe — on renvoie quand même ok
    return { ok: true }
  }

  const token = generateResetToken(user._id.toString(), user.email)
  const baseUrl = process.env.NUXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const resetLink = `${baseUrl}/reset-password?token=${token}`

  // Envoyer l'email via le mailer local
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const MailerAPI = require('mailer')
    const mailer = new MailerAPI({
      smtp: {
        host: process.env.MAILER_SMTP_HOST || 'localhost',
        port: Number(process.env.MAILER_SMTP_PORT) || 25,
        secure: process.env.MAILER_SMTP_SECURE === 'true',
        tls: { rejectUnauthorized: false }
      },
      from: process.env.MAILER_FROM || '"GeneaSphere" <noreply@localhost>'
    })

    await mailer.sendMail({
      to: user.email,
      subject: 'Réinitialisation de votre mot de passe GeneaSphere',
      body: `Bonjour ${user.name},

Vous avez demandé la réinitialisation de votre mot de passe GeneaSphere.

Cliquez sur le lien ci-dessous pour choisir un nouveau mot de passe (valable 1 heure) :

${resetLink}

Si vous n'avez pas effectué cette demande, ignorez cet email.

L'équipe GeneaSphere`
    })
  } catch (err) {
    // On log l'erreur mais on ne la remonte pas à l'utilisateur
    console.error('[forgot-password] Failed to send email:', err)
  }

  return { ok: true }
})

