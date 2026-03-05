import { createError, defineEventHandler, readBody } from 'h3'
import { connectToDB } from '~~/server/utils/db'
import { UserModel } from '~~/server/models/User'
import { compare } from 'bcryptjs'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string, password?: string }>(event)

  const email = (body.email || '').toLowerCase().trim()
  const password = body.password || ''

  if (!email || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Missing email or password' })
  }

  await connectToDB()

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
    const { TeamModel } = await import('~~/server/models/Team')
    const team = await TeamModel.findOne({ members: user._id })
    if (team) {
      user.currentTeamId = team._id.toString()
      await user.save()
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
  return { user: safeUser }
})
