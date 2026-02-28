import { connectToDB } from '~~/server/utils/db'
import { LockModel } from '~~/server/models/Lock'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const resourceId = getRouterParam(event, 'id')
  if (!resourceId) {
    throw createError({ statusCode: 400, statusMessage: 'Resource ID required' })
  }

  await connectToDB()

  const existingLock = await LockModel.findOne({ resourceId })

  if (existingLock) {
    // Si c'est le nôtre, ou si on est admin (simplifié ici par session.user.role === 'admin' s'il existe)
    const isAdmin = (session.user as any).role === 'admin'
    if (existingLock.userId === String(session.user.id) || isAdmin) {
      await LockModel.deleteOne({ _id: existingLock._id })
      return { status: 'unlocked' }
    } else {
      throw createError({ statusCode: 403, statusMessage: 'Cannot unlock resource owned by another user' })
    }
  }

  return { status: 'already-unlocked' }
})
