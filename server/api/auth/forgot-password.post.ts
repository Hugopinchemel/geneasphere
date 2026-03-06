import { createError, defineEventHandler, readBody } from 'h3'
import { connectToDB } from '~~/server/utils/db'
import { UserModel } from '~~/server/models/User'
import { generateResetToken } from '~~/server/utils/resetToken'
import { useRateLimit } from '~~/server/utils/rateLimit'
import { getMailerClass } from '~~/server/utils/mailer'

const rateLimit = useRateLimit({ key: 'forgot-password', limit: 3, windowMs: 15 * 60 * 1000 })

export default defineEventHandler(async (event) => {
  console.log('🔵 [forgot-password] Début de la requête')

  await rateLimit(event)
  console.log('🔵 [forgot-password] Rate limit OK')

  const body = await readBody<{ email?: string }>(event)
  const email = (body.email || '').toLowerCase().trim()
  console.log('🔵 [forgot-password] Email reçu:', email)

  if (!email) {
    console.log('❌ [forgot-password] Email manquant')
    throw createError({ statusCode: 400, statusMessage: 'Email requis' })
  }

  console.log('🔵 [forgot-password] Connexion à la DB...')
  await connectToDB()
  console.log('✅ [forgot-password] Connecté à la DB')

  const user = await UserModel.findOne({ email })
  console.log('🔵 [forgot-password] Utilisateur trouvé:', user ? `Oui (${user.name})` : 'Non')

  // On répond toujours avec succès pour ne pas révéler si l'email existe
  if (!user) {
    console.log('⚠️  [forgot-password] Utilisateur non trouvé, retour OK sans envoi')
    return { ok: true }
  }

  if (!user.password) {
    console.log('⚠️  [forgot-password] Compte Google sans mot de passe, retour OK sans envoi')
    // Compte Google sans mot de passe — on renvoie quand même ok
    return { ok: true }
  }

  console.log('🔵 [forgot-password] Génération du token de reset...')
  const token = generateResetToken(user._id.toString(), user.email)
  const baseUrl = process.env.NUXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const resetLink = `${baseUrl}/reset-password?token=${token}`
  console.log('✅ [forgot-password] Token généré, lien:', resetLink)

  // Envoyer l'email via le mailer local
  try {
    console.log('🔵 [forgot-password] Chargement de la classe Mailer...')
    const MailerAPI = getMailerClass()
    console.log('✅ [forgot-password] Classe Mailer chargée')

    const smtpConfig = {
      host: process.env.MAILER_SMTP_HOST || 'localhost',
      port: Number(process.env.MAILER_SMTP_PORT) || 25,
      secure: process.env.MAILER_SMTP_SECURE === 'true',
      tls: { rejectUnauthorized: false }
    }
    console.log('🔵 [forgot-password] Config SMTP:', JSON.stringify(smtpConfig))

    const fromEmail = process.env.MAILER_FROM || '"GeneaSphere" <noreply@localhost>'
    console.log('🔵 [forgot-password] From:', fromEmail)

    const mailer = new MailerAPI({
      smtp: smtpConfig,
      from: fromEmail
    })
    console.log('✅ [forgot-password] Instance Mailer créée')

    const mailOptions = {
      to: user.email,
      subject: 'Réinitialisation de votre mot de passe GeneaSphere',
      body: `Bonjour ${user.name},

Vous avez demandé la réinitialisation de votre mot de passe GeneaSphere.

Cliquez sur le lien ci-dessous pour choisir un nouveau mot de passe (valable 1 heure) :

${resetLink}

Si vous n'avez pas effectué cette demande, ignorez cet email.

L'équipe GeneaSphere`
    }
    console.log('🔵 [forgot-password] Envoi du mail à:', user.email)
    console.log('🔵 [forgot-password] Sujet:', mailOptions.subject)

    const result = await mailer.sendMail(mailOptions)
    console.log('✅ [forgot-password] Email envoyé avec succès!', JSON.stringify(result))
  } catch (err) {
    // On log l'erreur mais on ne la remonte pas à l'utilisateur
    console.error('❌❌❌ [forgot-password] ERREUR lors de l\'envoi:', err)
    console.error('❌❌❌ [forgot-password] Stack trace:', err instanceof Error ? err.stack : 'N/A')
  }

  console.log('🔵 [forgot-password] Fin de la requête, retour OK')
  return { ok: true }
})

