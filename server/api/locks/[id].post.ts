import {connectToDB} from '~~/server/utils/db'
import {LockModel} from '~~/server/models/Lock'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({statusCode: 401, statusMessage: 'Unauthorized'})
  }

  const resourceId = getRouterParam(event, 'id')
  if (!resourceId) {
    throw createError({statusCode: 400, statusMessage: 'Resource ID required'})
  }

  await connectToDB()

  // Durée du verrou : 7 minutes
  const LOCK_DURATION = 7 * 60 * 1000
  const expiresAt = new Date(Date.now() + LOCK_DURATION)

  // Chercher si un verrou existe déjà
  const existingLock = await LockModel.findOne({resourceId})

  if (existingLock) {
    // Si c'est le nôtre, on le renouvelle
    if (existingLock.userId === String(session.user.id)) {
      existingLock.expiresAt = expiresAt
      await existingLock.save()
      return existingLock
    } else {
      // Si c'est à quelqu'un d'autre et pas expiré
      if (existingLock.expiresAt > new Date()) {
        throw createError({
          statusCode: 409,
          statusMessage: 'Resource is locked by another user',
          data: {
            userName: existingLock.userName,
            expiresAt: existingLock.expiresAt
          }
        })
      } else {
        // Expiré, on peut le prendre
        await LockModel.deleteOne({_id: existingLock._id})
      }
    }
  }

  // Créer un nouveau verrou
  const lock = await LockModel.create({
    resourceId,
    userId: String(session.user.id),
    userName: session.user.name || 'Anonyme',
    expiresAt
  })

  return lock
})
