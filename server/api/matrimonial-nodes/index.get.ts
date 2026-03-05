import { createError, defineEventHandler } from 'h3'
import { connectToDB } from '~~/server/utils/db'
import { resolveTeamId } from '~~/server/utils/team'
import { MatrimonialNodeModel } from '~~/server/models/MatrimonialNode'

export default defineEventHandler(async (event) => {
  const { user } = await getUserSession(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  await connectToDB()

  const teamId = await resolveTeamId(user)
  const query = teamId ? { teamId } : { createdBy: user.id }

  return MatrimonialNodeModel.find(query)
    .populate('parents')
    .populate('children.person')
    .sort({ updatedAt: -1 })
})
