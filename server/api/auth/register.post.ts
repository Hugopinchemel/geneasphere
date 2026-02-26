import { createError, defineEventHandler, readBody } from 'h3'
import { connectToDB } from '~~/server/utils/db'
import { UserModel } from '~~/server/models/User'
import { hash } from 'bcryptjs'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ name?: string, email?: string, password?: string }>(event)

  const name = (body.name || '').trim()
  const email = (body.email || '').toLowerCase().trim()
  const password = body.password || ''

  if (!name || !email || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Missing name, email or password' })
  }

  await connectToDB()

  const existing = await UserModel.findOne({ email }).lean()
  if (existing) {
    throw createError({ statusCode: 409, statusMessage: 'Email already in use' })
  }

  const passwordHash = await hash(password, 10)
  const user = await UserModel.create({ name, email, password: passwordHash })

  const safeUser = {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    avatar: '',
    theme: 'dark' as const,
    primaryColor: 'green',
    neutralColor: 'zinc'
  }
  await setUserSession(event, { user: safeUser })
  return { user: safeUser }
})
