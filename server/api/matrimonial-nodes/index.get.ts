import {connectToDB} from '~~/server/utils/db'
import {MatrimonialNodeModel} from '~~/server/models/MatrimonialNode'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({statusCode: 401, statusMessage: 'Unauthorized'})
  }

  await connectToDB()
  return MatrimonialNodeModel.find({createdBy: session.user.id})
    .populate('parents')
    .populate('children.person')
    .sort({updatedAt: -1})
})
