import { createError, defineEventHandler, readBody } from 'h3'
import { connectToDB } from '~~/server/utils/db'
import { ConnectionRequestModel } from '~~/server/models/ConnectionRequest'
import { UserModel } from '~~/server/models/User'
import { PersonModel } from '~~/server/models/Person'
import { getMailer } from '~~/server/utils/mailer'
import { createTreeConnectionRequestEmail } from '~~/server/utils/emailTemplates'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const body = await readBody<{
    toUserId?: string
    personId?: string
    matchedPersonName?: string
  }>(event)

  const { toUserId, personId, matchedPersonName } = body

  if (!toUserId || !personId || !matchedPersonName) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing toUserId, personId, or matchedPersonName'
    })
  }

  await connectToDB()

  // Vérifier que l'utilisateur cible existe
  const targetUser = await UserModel.findById(toUserId)
  if (!targetUser) {
    throw createError({ statusCode: 404, statusMessage: 'Target user not found' })
  }

  // Vérifier que la personne existe et appartient à l'utilisateur demandeur
  const person = await PersonModel.findById(personId)
  if (!person) {
    throw createError({ statusCode: 404, statusMessage: 'Person not found' })
  }

  // Vérifier qu'une demande n'existe pas déjà
  const existingRequest = await ConnectionRequestModel.findOne({
    fromUserId: session.user.id,
    toUserId,
    personId,
    status: 'pending'
  })

  if (existingRequest) {
    throw createError({ statusCode: 409, statusMessage: 'Connection request already exists' })
  }

  // Créer la demande de connexion
  const request = await ConnectionRequestModel.create({
    fromUserId: session.user.id,
    toUserId,
    personId,
    matchedPersonName
  })

  // Envoyer l'email de notification
  try {
    const mailer = await getMailer()
    const acceptUrl = `${getRequestURL(event).origin}/connections/${request._id.toString()}`
    const emailContent = createTreeConnectionRequestEmail(
      targetUser.name,
      session.user.name,
      matchedPersonName,
      acceptUrl
    )

    await mailer.sendMail({
      to: targetUser.email,
      subject: emailContent.subject,
      body: emailContent.body
    })
  } catch (error) {
    console.error('Failed to send connection request email:', error)
  }

  return {
    ok: true,
    requestId: request._id.toString()
  }
})
