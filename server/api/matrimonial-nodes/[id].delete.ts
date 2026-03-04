import { createError, defineEventHandler, getRouterParam } from 'h3'
import { connectToDB } from '~~/server/utils/db'
import { MatrimonialNodeModel } from '~~/server/models/MatrimonialNode'
import { TeamModel } from '~~/server/models/Team'

export default defineEventHandler(async (event) => {
  const { user } = await getUserSession(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const id = getRouterParam(event, 'id')
  await connectToDB()

  const myTeams = await TeamModel.find({ members: user.id }).select('_id')
  const myTeamIds = myTeams.map(t => t._id)

  const node = await MatrimonialNodeModel.findOneAndDelete({
    _id: id,
    $or: [
      { teamId: { $in: myTeamIds } },
      { createdBy: user.id }
    ]
  })
  if (!node) {
    throw createError({ statusCode: 404, statusMessage: 'Nœud matrimonial introuvable' })
  }

  return { success: true }
})
