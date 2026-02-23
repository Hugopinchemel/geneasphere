import { defineEventHandler, readBody, createError } from 'h3'
import { setUserSession } from '#imports'
import { connectToDB } from '~~/server/utils/db'
import { UserModel } from '~~/server/models/User'
import { compare } from 'bcryptjs'

export default defineEventHandler( async (event) => {
  const body = await readBody<{ email?: string; password?: string }>(event)

  const email = (body.email || '').toLowerCase().trim()
  const password = body.password || ''

  if (!email || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Missing email or password' })
  }

  await connectToDB()

  const user = await UserModel.findOne({ email })
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
  }

  const match = await compare(password, user.password)
  if (!match) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
  }

  const safeUser = { id: user._id.toString(), name: user.name, email: user.email }
  await setUserSession(event, { user: safeUser })
  return { user: safeUser }
})
