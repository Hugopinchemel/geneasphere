import {connectToDB} from '~~/server/utils/db'
import {MatrimonialNodeModel} from '~~/server/models/MatrimonialNode'
import {z} from 'zod'

const bodySchema = z.object({
  status: z.enum(['marié', 'divorcé', 'pacsé', 'union_libre', 'inconnu']).optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  parents: z.array(z.string()).max(2, 'Maximum 2 parents').optional(),
  children: z.array(z.object({
    person: z.string(),
    linkType: z.enum(['biologique', 'adoption', 'gpa']).default('biologique')
  })).optional()
})

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({statusCode: 401, statusMessage: 'Unauthorized'})
  }

  const id = getRouterParam(event, 'id')
  const body = await readValidatedBody(event, bodySchema.parse)

  await connectToDB()

  const updateData: Record<string, unknown> = {...body}
  if (body.startDate !== undefined) {
    updateData.startDate = body.startDate ? new Date(body.startDate) : null
  }
  if (body.endDate !== undefined) {
    updateData.endDate = body.endDate ? new Date(body.endDate) : null
  }

  const node = await MatrimonialNodeModel.findOneAndUpdate(
    {_id: id, createdBy: session.user.id},
    updateData,
    {new: true}
  )
    .populate('parents')
    .populate('children.person')

  if (!node) {
    throw createError({statusCode: 404, statusMessage: 'Nœud matrimonial introuvable'})
  }

  return node
})
