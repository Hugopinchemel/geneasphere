import { createError, defineEventHandler, getRouterParam } from 'h3'
import { connectToDB } from '~~/server/utils/db'
import { PersonModel } from '~~/server/models/Person'
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

  const person = await PersonModel.findOne({
    _id: id,
    $or: [
      { teamId: { $in: myTeamIds } },
      { createdBy: user.id }
    ]
  })
  if (!person) {
    throw createError({statusCode: 404, statusMessage: 'Personne introuvable'})
  }

  return person
})
