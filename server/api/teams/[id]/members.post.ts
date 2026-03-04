import type { Types } from 'mongoose'
import { createError, defineEventHandler, readBody } from 'h3'
import { connectToDB } from '~~/server/utils/db'
import { TeamModel } from '~~/server/models/Team'
import { UserModel } from '~~/server/models/User'

export default defineEventHandler(async (event) => {
  const { user } = await getUserSession(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const teamId = event.context.params?.id
  const body = await readBody<{ email: string }>(event)
  if (!body.email) {
    throw createError({ statusCode: 400, statusMessage: 'Missing email' })
  }

  await connectToDB()

  // Check if current user is owner of the team
  const team = await TeamModel.findById(teamId)
  if (!team) {
    throw createError({ statusCode: 404, statusMessage: 'Team not found' })
  }

  if (team.owner.toString() !== user.id) {
    throw createError({ statusCode: 403, statusMessage: 'Only the owner can add members' })
  }

  // Find user to add
  const userToAdd = await UserModel.findOne({ email: body.email.toLowerCase().trim() })
  if (!userToAdd) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  // Add user to members if not already there
  if (!team.members.map(m => m.toString()).includes(userToAdd._id.toString())) {
    team.members.push(userToAdd._id as Types.ObjectId)
    await team.save()
  }

  return { success: true, team }
})
