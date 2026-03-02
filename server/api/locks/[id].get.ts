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

  const lock = await LockModel.findOne({resourceId})

  if (lock && lock.expiresAt > new Date()) {
    return {
      locked: true,
      owner: lock.userId === String(session.user.id),
      userName: lock.userName,
      expiresAt: lock.expiresAt
    }
  }

  return {locked: false}
})
