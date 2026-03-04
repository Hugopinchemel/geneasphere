import { createError, defineEventHandler, readValidatedBody } from 'h3'
import { connectToDB } from '~~/server/utils/db'
import { PersonModel } from '~~/server/models/Person'
import { TeamModel } from '~~/server/models/Team'
import { z } from 'zod'

const bodySchema = z.object({
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName: z.string().optional().default(''),
  sex: z.enum(['M', 'F', 'Autre']),
  birthDate: z.string().optional().nullable(),
  deathDate: z.string().optional().nullable(),
  birthPlace: z.string().optional().default(''),
  deathPlace: z.string().optional().default(''),
  photo: z.string().optional().default(''),
  notes: z.string().optional().default('')
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

  const person = await PersonModel.create({
    ...body,
    birthDate: body.birthDate ? new Date(body.birthDate) : undefined,
    deathDate: body.deathDate ? new Date(body.deathDate) : undefined,
    teamId,
    createdBy: user.id
  })

  return person
})
