import { TeamModel } from '~~/server/models/Team'
import type { Types } from 'mongoose'

/**
 * Résout le teamId courant de l'utilisateur.
 * Si absent de la session, cherche la première équipe dont il est membre.
 */
export async function resolveTeamId(user: { id: string, currentTeamId?: string }): Promise<string | null> {
  if (user.currentTeamId) return user.currentTeamId
  const team = await TeamModel.findOne({ members: user.id })
  return team ? team._id.toString() : null
}

/**
 * Retourne tous les _id des équipes dont l'utilisateur est membre.
 * Utilisé pour les filtres d'autorisation ($or teamId / createdBy).
 */
export async function resolveTeamIds(userId: string): Promise<Types.ObjectId[]> {
  const teams = await TeamModel.find({ members: userId }).select('_id')
  return teams.map(t => t._id as Types.ObjectId)
}

