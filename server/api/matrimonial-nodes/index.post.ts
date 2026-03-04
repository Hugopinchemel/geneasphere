import { createError, defineEventHandler, readValidatedBody } from 'h3'
import { connectToDB } from '~~/server/utils/db'
import { MatrimonialNodeModel, type IMatrimonialNode } from '~~/server/models/MatrimonialNode'
import { TeamModel } from '~~/server/models/Team'
import { z } from 'zod'

const bodySchema = z.object({
  status: z.enum(['married', 'divorced', 'pacsed', 'union_libre', 'inconnu']).default('inconnu'),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  parents: z.array(z.string()).max(2, 'Maximum 2 parents').default([]),
  children: z.array(z.object({
    person: z.string(),
    linkType: z.enum(['biologique', 'adoption', 'gpa']).default('biologique')
  })).default([]).refine(
    (children) => {
      const ids = children.map(c => c.person)
      return ids.length === new Set(ids).size
    },
    { message: 'Un enfant ne peut pas apparaître deux fois' }
  )
}).refine(
  (data) => {
    const childIds = new Set(data.children.map(c => c.person))
    return !data.parents.some(p => childIds.has(p))
  },
  { message: 'Une personne ne peut pas être parent et enfant dans le même nœud' }
)

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

  // Multi-node consistency check
  const allNodes = await MatrimonialNodeModel.find({ teamId })
  const parentIds = body.parents
  const childIds = body.children.map(c => c.person)

  for (const pId of parentIds) {
    const ancestors = getAncestors(pId, allNodes)
    if (childIds.some(cId => ancestors.has(cId))) {
      throw createError({ statusCode: 400, statusMessage: 'Incohérence dans la hiérarchie (cycle ou ancêtre comme enfant)' })
    }
  }

  for (const cId of childIds) {
    const descendants = getDescendants(cId, allNodes)
    if (parentIds.some(pId => descendants.has(pId))) {
      throw createError({ statusCode: 400, statusMessage: 'Incohérence dans la hiérarchie (cycle ou descendant comme parent)' })
    }
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

function getAncestors(personId: string, nodes: IMatrimonialNode[]): Set<string> {
  const ancestors = new Set<string>()
  const stack = [personId]
  while (stack.length > 0) {
    const currentId = stack.pop()!
    for (const node of nodes) {
      const isChild = node.children.some(c => c.person.toString() === currentId)
      if (isChild) {
        for (const parent of node.parents) {
          const pId = parent.toString()
          if (!ancestors.has(pId)) {
            ancestors.add(pId)
            stack.push(pId)
          }
        }
      }
    }
  }
  return ancestors
}

function getDescendants(personId: string, nodes: IMatrimonialNode[]): Set<string> {
  const descendants = new Set<string>()
  const stack = [personId]
  while (stack.length > 0) {
    const currentId = stack.pop()!
    for (const node of nodes) {
      const isParent = node.parents.some(p => p.toString() === currentId)
      if (isParent) {
        for (const child of node.children) {
          const cId = child.person.toString()
          if (!descendants.has(cId)) {
            descendants.add(cId)
            stack.push(cId)
          }
        }
      }
    }
  }
  return descendants
}
