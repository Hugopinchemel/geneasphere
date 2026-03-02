import {createError, defineEventHandler, readBody} from 'h3'
import {connectToDB} from '~~/server/utils/db'
import {UserModel} from '~~/server/models/User'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({statusCode: 401, statusMessage: 'Unauthorized'})
  }

  const body = await readBody<{ name?: string, email?: string, bio?: string, avatar?: string }>(event)

  await connectToDB()

  const update: Record<string, string> = {}
  if (body.name?.trim()) update.name = body.name.trim()
  if (body.email?.trim()) update.email = body.email.toLowerCase().trim()
  if (body.bio !== undefined) update.bio = body.bio
  if (body.avatar !== undefined) update.avatar = body.avatar

  if (update.email && update.email !== session.user.email) {
    const existing = await UserModel.findOne({email: update.email}).lean()
    if (existing) {
      throw createError({statusCode: 409, statusMessage: 'Email already in use'})
    }
  }

  const user = await UserModel.findByIdAndUpdate(session.user.id, update, {returnDocument: 'after'}).select('-password').lean()
  if (!user) {
    throw createError({statusCode: 404, statusMessage: 'User not found'})
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
  await setUserSession(event, {user: safeUser})

  return {
    ...safeUser,
    bio: user.bio || ''
  }
})
