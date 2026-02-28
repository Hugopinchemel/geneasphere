import { createError, defineEventHandler } from 'h3'
import { connectToDB } from '~~/server/utils/db'
import { MatrimonialNodeModel } from '~~/server/models/MatrimonialNode'
import { TeamModel } from '~~/server/models/Team'

export default defineEventHandler(async (event) => {
  const { user } = await getUserSession(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  await connectToDB()

  let teamId = user.currentTeamId

  if (!teamId) {
    const team = await TeamModel.findOne({ members: user.id })
    if (team) {
      teamId = team._id.toString()
    }
  }

  const query = teamId ? { teamId } : { createdBy: user.id }

  return MatrimonialNodeModel.find(query)
    .populate('parents')
    .populate('children.person')
    .sort({ updatedAt: -1 })
})
