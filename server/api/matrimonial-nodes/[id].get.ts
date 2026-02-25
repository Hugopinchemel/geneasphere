import {connectToDB} from '~~/server/utils/db'
import {MatrimonialNodeModel} from '~~/server/models/MatrimonialNode'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({statusCode: 401, statusMessage: 'Unauthorized'})
  }

  const id = getRouterParam(event, 'id')
  await connectToDB()

  const node = await MatrimonialNodeModel.findOne({_id: id, createdBy: session.user.id})
    .populate('parents')
    .populate('children.person')

  if (!node) {
    throw createError({statusCode: 404, statusMessage: 'Nœud matrimonial introuvable'})
  }

  return node
})
