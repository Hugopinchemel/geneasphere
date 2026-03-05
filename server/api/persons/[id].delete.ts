import { createError, defineEventHandler, getRouterParam } from 'h3'
import { connectToDB } from '~~/server/utils/db'
import { resolveTeamIds } from '~~/server/utils/team'
import { PersonModel } from '~~/server/models/Person'
import { MatrimonialNodeModel } from '~~/server/models/MatrimonialNode'

export default defineEventHandler(async (event) => {
  const { user } = await getUserSession(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const id = getRouterParam(event, 'id')
  await connectToDB()

  const teamIds = await resolveTeamIds(user.id)

  const person = await PersonModel.findOneAndDelete({
    _id: id,
    $or: [{ teamId: { $in: teamIds } }, { createdBy: user.id }]
  })
  if (!person) throw createError({ statusCode: 404, statusMessage: 'Personne introuvable' })

  await MatrimonialNodeModel.updateMany({ parents: id }, { $pull: { parents: id } })
  await MatrimonialNodeModel.updateMany({ 'children.person': id }, { $pull: { children: { person: id } } })
  await MatrimonialNodeModel.deleteMany({ parents: { $size: 0 }, children: { $size: 0 } })

  return { success: true }
})
