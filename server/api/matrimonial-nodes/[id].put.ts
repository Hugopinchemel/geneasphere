import { createError, defineEventHandler, getRouterParam, readValidatedBody } from 'h3'
import { connectToDB } from '~~/server/utils/db'
import { resolveTeamIds } from '~~/server/utils/team'
import { MatrimonialNodeModel, type IMatrimonialNode } from '~~/server/models/MatrimonialNode'
import { z } from 'zod'

const bodySchema = z.object({
  status: z.enum(['married', 'divorced', 'pacsed', 'union_libre', 'inconnu']).optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  parents: z.array(z.string()).max(2, 'Maximum 2 parents').optional(),
  children: z.array(z.object({
    person: z.string(),
    linkType: z.enum(['biologique', 'adoption', 'gpa']).default('biologique')
  })).optional().refine(
    (children) => {
      if (!children) return true
      const ids = children.map(c => c.person)
      return ids.length === new Set(ids).size
    },
    { message: 'Un enfant ne peut pas apparaître deux fois' }
  )
}).refine(
  (data) => {
    const parents = data.parents ?? []
    const children = data.children ?? []
    const childIds = new Set(children.map(c => c.person))
    return !parents.some(p => childIds.has(p))
  },
  { message: 'Une personne ne peut pas être parent et enfant dans le même nœud' }
)

export default defineEventHandler(async (event) => {
  const { user } = await getUserSession(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const id = getRouterParam(event, 'id')
  const body = await readValidatedBody(event, bodySchema.parse)

  await connectToDB()

  const teamIds = await resolveTeamIds(user.id)

  const existingNode = await MatrimonialNodeModel.findOne({
    _id: id,
    $or: [{ teamId: { $in: teamIds } }, { createdBy: user.id }]
  })

  if (!existingNode) {
    throw createError({ statusCode: 404, statusMessage: 'Nœud matrimonial introuvable' })
  }

  // Multi-node consistency check
  const allNodes = await MatrimonialNodeModel.find({ teamId: existingNode.teamId })
  const parentIds = body.parents ?? existingNode.parents.map(p => p.toString())
  const childIds = body.children?.map(c => c.person) ?? existingNode.children.map(c => c.person.toString())

  for (const pId of parentIds) {
    const ancestors = getAncestors(pId, allNodes, id)
    if (childIds.some(cId => ancestors.has(cId))) {
      throw createError({ statusCode: 400, statusMessage: 'Incohérence dans la hiérarchie (cycle ou ancêtre comme enfant)' })
    }
  }

  for (const cId of childIds) {
    const descendants = getDescendants(cId, allNodes, id)
    if (parentIds.some(pId => descendants.has(pId))) {
      throw createError({ statusCode: 400, statusMessage: 'Incohérence dans la hiérarchie (cycle ou descendant comme parent)' })
    }
  }

  const updateData: Record<string, unknown> = { ...body }
  if (body.startDate !== undefined) {
    updateData.startDate = body.startDate ? new Date(body.startDate) : null
  }
  if (body.endDate !== undefined) {
    updateData.endDate = body.endDate ? new Date(body.endDate) : null
  }

  const node = await MatrimonialNodeModel.findOneAndUpdate(
    { _id: id, $or: [{ teamId: { $in: teamIds } }, { createdBy: user.id }] },
    updateData,
    { returnDocument: 'after' }
  )
    .populate('parents')
    .populate('children.person')

  if (!node) {
    throw createError({ statusCode: 404, statusMessage: 'Nœud matrimonial introuvable' })
  }

  return node
})

function getAncestors(personId: string, nodes: IMatrimonialNode[], excludeNodeId?: string): Set<string> {
  const ancestors = new Set<string>()
  const stack = [personId]
  while (stack.length > 0) {
    const currentId = stack.pop()!
    for (const node of nodes) {
      if (excludeNodeId && node._id.toString() === excludeNodeId) continue
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

function getDescendants(personId: string, nodes: IMatrimonialNode[], excludeNodeId?: string): Set<string> {
  const descendants = new Set<string>()
  const stack = [personId]
  while (stack.length > 0) {
    const currentId = stack.pop()!
    for (const node of nodes) {
      if (excludeNodeId && node._id.toString() === excludeNodeId) continue
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
