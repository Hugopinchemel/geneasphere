import { createError, defineEventHandler, getRouterParam } from 'h3'
import { connectToDB } from '~~/server/utils/db'
import { resolveTeamIds } from '~~/server/utils/team'
import { MatrimonialNodeModel } from '~~/server/models/MatrimonialNode'

export default defineEventHandler(async (event) => {
  const { user } = await getUserSession(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const id = getRouterParam(event, 'id')
  await connectToDB()

  const teamIds = await resolveTeamIds(user.id)

  const node = await MatrimonialNodeModel.findOneAndDelete({
    _id: id,
    $or: [{ teamId: { $in: teamIds } }, { createdBy: user.id }]
  })
  if (!node) throw createError({ statusCode: 404, statusMessage: 'Nœud matrimonial introuvable' })

  return { success: true }
})
