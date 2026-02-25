import {connectToDB} from '~~/server/utils/db'
import {PersonModel} from '~~/server/models/Person'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({statusCode: 401, statusMessage: 'Unauthorized'})
  }

  await connectToDB()
  return PersonModel.find({createdBy: session.user.id}).sort({updatedAt: -1})
})
