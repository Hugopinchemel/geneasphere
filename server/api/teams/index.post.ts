import {createError, defineEventHandler, readBody} from 'h3'
import {connectToDB} from '~~/server/utils/db'
import {TeamModel} from '~~/server/models/Team'
import {UserModel} from '~~/server/models/User'

export default defineEventHandler(async (event) => {
  const {user} = await getUserSession(event)
  if (!user) {
    throw createError({statusCode: 401, statusMessage: 'Unauthorized'})
  }

  const body = await readBody<{ name: string }>(event)
  if (!body.name) {
    throw createError({statusCode: 400, statusMessage: 'Missing team name'})
  }

  await connectToDB()

  const team = await TeamModel.create({
    name: body.name,
    owner: user.id,
    members: [user.id]
  })

  // Optionally set as current team
  const dbUser = await UserModel.findById(user.id)
  if (dbUser) {
    dbUser.currentTeamId = team._id.toString()
    await dbUser.save()

    // Update session
    await setUserSession(event, {
      user: {
        ...user,
        currentTeamId: team._id.toString()
      }
    })
  }

  return team
})
