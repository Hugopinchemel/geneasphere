import {createError, defineEventHandler} from 'h3'
import {connectToDB} from '~~/server/utils/db'
import {TeamModel} from '~~/server/models/Team'

export default defineEventHandler(async (event) => {
  const {user} = await getUserSession(event)
  if (!user) {
    throw createError({statusCode: 401, statusMessage: 'Unauthorized'})
  }

  await connectToDB()

  return await TeamModel.find({
    members: user.id
  })
    .populate('members', 'name email avatar')
    .sort({createdAt: -1})
    .lean()
})
