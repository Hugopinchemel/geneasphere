import { createError, defineEventHandler, getRouterParam } from 'h3'
import { connectToDB } from '~~/server/utils/db'
import { resolveTeamIds } from '~~/server/utils/team'
import { PersonModel } from '~~/server/models/Person'

export default defineEventHandler(async (event) => {
  const { user } = await getUserSession(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const id = getRouterParam(event, 'id')
  await connectToDB()

  const teamIds = await resolveTeamIds(user.id)

  const person = await PersonModel.findOne({
    _id: id,
    $or: [{ teamId: { $in: teamIds } }, { createdBy: user.id }]
  })
  if (!person) throw createError({ statusCode: 404, statusMessage: 'Personne introuvable' })

  return person
})
