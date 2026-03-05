import { createError, defineEventHandler } from 'h3'
import { connectToDB } from '~~/server/utils/db'
import { ConnectionRequestModel } from '~~/server/models/ConnectionRequest'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  await connectToDB()

  // Récupérer toutes les demandes de connexion reçues par l'utilisateur
  const requests = await ConnectionRequestModel.find({ toUserId: session.user.id })
    .populate('fromUserId', 'name email avatar')
    .populate('personId', 'firstName lastName')
    .sort({ createdAt: -1 })
    .lean()

  return requests.map(req => ({
    id: req._id.toString(),
    from: req.fromUserId,
    person: req.personId,
    matchedPersonName: req.matchedPersonName,
    status: req.status,
    createdAt: req.createdAt?.toISOString()
  }))
})
