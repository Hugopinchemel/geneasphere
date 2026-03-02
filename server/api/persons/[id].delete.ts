import {createError, defineEventHandler, getRouterParam} from 'h3'
import {connectToDB} from '~~/server/utils/db'
import {PersonModel} from '~~/server/models/Person'
import {MatrimonialNodeModel} from '~~/server/models/MatrimonialNode'
import {TeamModel} from '~~/server/models/Team'

export default defineEventHandler(async (event) => {
  const {user} = await getUserSession(event)
  if (!user) {
    throw createError({statusCode: 401, statusMessage: 'Unauthorized'})
  }

  const id = getRouterParam(event, 'id')
  await connectToDB()

  const myTeams = await TeamModel.find({members: user.id}).select('_id')
  const myTeamIds = myTeams.map(t => t._id)

  const person = await PersonModel.findOneAndDelete({
    _id: id,
    $or: [
      {teamId: {$in: myTeamIds}},
      {createdBy: user.id}
    ]
  })
  if (!person) {
    throw createError({statusCode: 404, statusMessage: 'Personne introuvable'})
  }

  // Retirer la personne des nœuds matrimoniaux
  await MatrimonialNodeModel.updateMany(
    {parents: id},
    {$pull: {parents: id}}
  )
  await MatrimonialNodeModel.updateMany(
    {'children.person': id},
    {$pull: {children: {person: id}}}
  )

  // Supprimer les nœuds matrimoniaux orphelins (sans parents ni enfants)
  await MatrimonialNodeModel.deleteMany({
    parents: {$size: 0},
    children: {$size: 0}
  })

  return {success: true}
})
