import { createError, defineEventHandler } from 'h3'
import { connectToDB } from '~~/server/utils/db'
import { resolveTeamId } from '~~/server/utils/team'
import { PersonModel } from '~~/server/models/Person'

export default defineEventHandler(async (event) => {
  const { user } = await getUserSession(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  await connectToDB()

  const teamId = await resolveTeamId(user)
  if (!teamId) return PersonModel.find({ createdBy: user.id }).sort({ updatedAt: -1 })
  return PersonModel.find({ teamId }).sort({ updatedAt: -1 })
})
