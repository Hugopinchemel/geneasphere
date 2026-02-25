import {connectToDB} from '~~/server/utils/db'
import {MatrimonialNodeModel} from '~~/server/models/MatrimonialNode'
import {z} from 'zod'

const bodySchema = z.object({
  status: z.enum(['marié', 'divorcé', 'pacsé', 'union_libre', 'inconnu']).default('inconnu'),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  parents: z.array(z.string()).max(2, 'Maximum 2 parents').default([]),
  children: z.array(z.object({
    person: z.string(),
    linkType: z.enum(['biologique', 'adoption', 'gpa']).default('biologique')
  })).default([])
})

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({statusCode: 401, statusMessage: 'Unauthorized'})
  }

  const body = await readValidatedBody(event, bodySchema.parse)

  await connectToDB()

  const node = await MatrimonialNodeModel.create({
    ...body,
    startDate: body.startDate ? new Date(body.startDate) : undefined,
    endDate: body.endDate ? new Date(body.endDate) : undefined,
    createdBy: session.user.id
  })

  return node.populate(['parents', 'children.person'] as string[])
})
