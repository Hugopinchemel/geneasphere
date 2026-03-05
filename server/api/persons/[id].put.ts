import { createError, defineEventHandler, getRouterParam, readValidatedBody } from 'h3'
import { connectToDB } from '~~/server/utils/db'
import { resolveTeamIds } from '~~/server/utils/team'
import { PersonModel } from '~~/server/models/Person'
import { z } from 'zod'

const bodySchema = z.object({
  firstName: z.string().min(1, 'Le prénom est requis').optional(),
  lastName: z.string().optional(),
  sex: z.enum(['M', 'F', 'Autre']).optional(),
  birthDate: z.string().optional().nullable(),
  deathDate: z.string().optional().nullable(),
  birthPlace: z.string().optional(),
  deathPlace: z.string().optional(),
  photo: z.string().optional(),
  notes: z.string().optional()
})

export default defineEventHandler(async (event) => {
  const { user } = await getUserSession(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const id = getRouterParam(event, 'id')
  const body = await readValidatedBody(event, bodySchema.parse)

  await connectToDB()

  const teamIds = await resolveTeamIds(user.id)

  const updateData: Record<string, unknown> = { ...body }
  if (body.birthDate !== undefined) updateData.birthDate = body.birthDate ? new Date(body.birthDate) : null
  if (body.deathDate !== undefined) updateData.deathDate = body.deathDate ? new Date(body.deathDate) : null

  const person = await PersonModel.findOneAndUpdate(
    { _id: id, $or: [{ teamId: { $in: teamIds } }, { createdBy: user.id }] },
    updateData,
    { returnDocument: 'after' }
  )
  if (!person) throw createError({ statusCode: 404, statusMessage: 'Personne introuvable' })

  return person
})
