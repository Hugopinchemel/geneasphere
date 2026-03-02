import {createError, defineEventHandler, readBody} from 'h3'
import {connectToDB} from '~~/server/utils/db'
import {UserModel} from '~~/server/models/User'
import {TeamModel} from '~~/server/models/Team'
import {hash} from 'bcryptjs'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ name?: string, email?: string, password?: string }>(event)

  const name = (body.name || '').trim()
  const email = (body.email || '').toLowerCase().trim()
  const password = body.password || ''

  if (!name || !email || !password) {
    throw createError({statusCode: 400, statusMessage: 'Missing name, email or password'})
  }

  await connectToDB()

  const existing = await UserModel.findOne({email}).lean()
  if (existing) {
    throw createError({statusCode: 409, statusMessage: 'Email already in use'})
  }

  const passwordHash = await hash(password, 10)
  const user = await UserModel.create({name, email, password: passwordHash})

  // Création d'une team par défaut pour l'utilisateur
  const team = await TeamModel.create({
    name: `Généalogie de ${user.name}`,
    owner: user._id,
    members: [user._id]
  })

  // Mise à jour de l'utilisateur avec sa team actuelle
  user.currentTeamId = team._id.toString()
  await user.save()

  const safeUser = {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    avatar: '',
    theme: 'dark' as const,
    primaryColor: 'green',
    neutralColor: 'zinc',
    currentTeamId: team._id.toString()
  }
  await setUserSession(event, {user: safeUser})
  return {user: safeUser}
})
