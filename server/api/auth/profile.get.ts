import {defineEventHandler} from 'h3'
import {connectToDB} from '~~/server/utils/db'
import {UserModel} from '~~/server/models/User'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({statusCode: 401, statusMessage: 'Unauthorized'})
  }

  await connectToDB()

  const user = await UserModel.findById(session.user.id).select('-password').lean()
  if (!user) {
    throw createError({statusCode: 404, statusMessage: 'User not found'})
  }

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    avatar: user.avatar || '',
    bio: user.bio || '',
    theme: user.theme || 'dark',
    primaryColor: user.primaryColor || 'green',
    neutralColor: user.neutralColor || 'zinc'
  }
})
