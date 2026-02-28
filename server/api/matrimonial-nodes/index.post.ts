import { createError, defineEventHandler, readValidatedBody } from 'h3'
import { connectToDB } from '~~/server/utils/db'
import { MatrimonialNodeModel } from '~~/server/models/MatrimonialNode'
import { TeamModel } from '~~/server/models/Team'
import { z } from 'zod'

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
  const { user } = await getUserSession(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const body = await readValidatedBody(event, bodySchema.parse)

  await connectToDB()

  let teamId = user.currentTeamId

  if (!teamId) {
    const team = await TeamModel.findOne({ members: user.id })
    if (team) {
      teamId = team._id.toString()
    }
  }

  if (!teamId) {
    throw createError({ statusCode: 400, statusMessage: 'No team selected' })
  }

  const node = await MatrimonialNodeModel.create({
    ...body,
    startDate: body.startDate ? new Date(body.startDate) : undefined,
    endDate: body.endDate ? new Date(body.endDate) : undefined,
    teamId,
    createdBy: user.id
  })

  return node.populate(['parents', 'children.person'] as string[])
})
