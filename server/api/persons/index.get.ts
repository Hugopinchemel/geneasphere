import {createError, defineEventHandler} from 'h3'
import {connectToDB} from '~~/server/utils/db'
import {PersonModel} from '~~/server/models/Person'
import {TeamModel} from '~~/server/models/Team'

export default defineEventHandler(async (event) => {
  const {user} = await getUserSession(event)
  if (!user) {
    throw createError({statusCode: 401, statusMessage: 'Unauthorized'})
  }

  await connectToDB()

  let teamId = user.currentTeamId

  // Si pas de teamId dans la session, on essaie de trouver la team par défaut de l'utilisateur
  if (!teamId) {
    const team = await TeamModel.findOne({members: user.id})
    if (team) {
      teamId = team._id.toString()
    }
  }

  if (!teamId) {
    return PersonModel.find({createdBy: user.id}).sort({updatedAt: -1})
  }

  return PersonModel.find({teamId}).sort({updatedAt: -1})
})
