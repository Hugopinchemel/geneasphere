import {createError, defineEventHandler, readBody} from 'h3'
import {connectToDB} from '~~/server/utils/db'
import {UserModel} from '~~/server/models/User'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({statusCode: 401, statusMessage: 'Unauthorized'})
  }

  const body = await readBody<{
    theme?: 'light' | 'dark'
    primaryColor?: string
    neutralColor?: string
  }>(event)

  await connectToDB()

  const update: Record<string, string> = {}
  if (body.theme && ['light', 'dark'].includes(body.theme)) {
    update.theme = body.theme
  }
  if (body.primaryColor) update.primaryColor = body.primaryColor
  if (body.neutralColor) update.neutralColor = body.neutralColor

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
    neutralColor: user.neutralColor || 'zinc'
  }
  await setUserSession(event, {user: safeUser})

  return safeUser
})
