import {connectToDB} from '~~/server/utils/db'
import {PersonModel} from '~~/server/models/Person'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({statusCode: 401, statusMessage: 'Unauthorized'})
  }

  const id = getRouterParam(event, 'id')
  await connectToDB()

  const person = await PersonModel.findOne({_id: id, createdBy: session.user.id})
  if (!person) {
    throw createError({statusCode: 404, statusMessage: 'Personne introuvable'})
  }

  return person
})
