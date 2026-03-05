import { createError, defineEventHandler, readBody } from 'h3'
import { connectToDB } from '~~/server/utils/db'
import { ConnectionRequestModel } from '~~/server/models/ConnectionRequest'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing connection request ID' })
  }

  const body = await readBody<{ status?: 'accepted' | 'rejected' }>(event)
  if (!body.status || !['accepted', 'rejected'].includes(body.status)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid status' })
  }

  await connectToDB()

  const request = await ConnectionRequestModel.findById(id)
  if (!request) {
    throw createError({ statusCode: 404, statusMessage: 'Connection request not found' })
  }

  // Vérifier que l'utilisateur est le destinataire de la demande
  if (request.toUserId.toString() !== session.user.id) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  request.status = body.status
  await request.save()

  return {
    ok: true,
    status: request.status
  }
})
