import { createError, defineEventHandler, readBody } from 'h3'
import { connectToDB } from '~~/server/utils/db'
import { UserModel } from '~~/server/models/User'
import { compare } from 'bcryptjs'
import { useRateLimit } from '~~/server/utils/rateLimit'

const rateLimit = useRateLimit({ key: 'login', limit: 5, windowMs: 15 * 60 * 1000 })

export default defineEventHandler(async (event) => {
  await rateLimit(event)

  const body = await readBody<{ email?: string, password?: string }>(event)

  const email = (body.email || '').toLowerCase().trim()
  const password = body.password || ''

  if (!email || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Missing email or password' })
  }

  try {
    await connectToDB()
  } catch (error) {
    console.error('Database connection error in login:', error)
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error' })
  }

  const user = await UserModel.findOne({ email })
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
  }

  const match = await compare(password, user.password || '')
  if (!match) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
  }

  // S'assurer que l'utilisateur a une team actuelle
  if (!user.currentTeamId) {
    try {
      const { TeamModel } = await import('~~/server/models/Team')
      const team = await TeamModel.findOne({ members: user._id })
      if (team) {
        user.currentTeamId = team._id.toString()
        await user.save()
      }
    } catch (error) {
      console.error('Failed to resolve/save currentTeamId:', error)
    }
  }

  const safeUser = {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    avatar: user.avatar || '',
    theme: user.theme || 'dark',
    primaryColor: user.primaryColor || 'green',
    neutralColor: user.neutralColor || 'zinc',
    currentTeamId: user.currentTeamId || ''
  }
  await setUserSession(event, { user: safeUser })

  // Envoyer une notification de connexion si activée
  if (user.loginNotifications) {
    try {
      const { getMailer } = await import('~~/server/utils/mailer')
      const { createLoginNotificationEmail } = await import('~~/server/utils/emailTemplates')

      const mailer = await getMailer()
      const ipAddress = getRequestIP(event, { xForwardedFor: true })
      const emailContent = createLoginNotificationEmail(user.name, new Date(), ipAddress)

      await mailer.sendMail({
        to: user.email,
        subject: emailContent.subject,
        body: emailContent.body
      })
    } catch (error) {
      console.error('Failed to send login notification email:', error)
    }
  }

  return { user: safeUser }
})
