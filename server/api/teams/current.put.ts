import { defineEventHandler, createError, readBody } from 'h3'
import { connectToDB } from '~~/server/utils/db'
import { TeamModel } from '~~/server/models/Team'
import { UserModel } from '~~/server/models/User'

export default defineEventHandler(async (event) => {
  const { user } = await getUserSession(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const body = await readBody<{ teamId: string }>(event)
  if (!body.teamId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing teamId' })
  }

  await connectToDB()

  // Check if user is member of this team
  const team = await TeamModel.findOne({
    _id: body.teamId,
    members: user.id
  })

  if (!team) {
    throw createError({ statusCode: 403, statusMessage: 'You are not a member of this team' })
  }

  // Update user currentTeamId
  const dbUser = await UserModel.findById(user.id)
  if (dbUser) {
    dbUser.currentTeamId = body.teamId
    await dbUser.save()
  }

  // Update session
  await setUserSession(event, {
    user: {
      ...user,
      currentTeamId: body.teamId
    }
  })

  return { success: true, teamId: body.teamId }
})
