import mongoose, { type Model } from 'mongoose'

const { Schema, model, models } = mongoose

export interface ILock {
  resourceId: string
  userId: string
  userName: string
  expiresAt: Date
}

const LockSchema = new Schema<ILock>({
  resourceId: { type: String, required: true, index: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  expiresAt: { type: Date, required: true }
}, { timestamps: true })

// Index TTL pour supprimer automatiquement les verrous expirés (ajoutons 2 secondes de marge)
LockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export const LockModel: Model<ILock> = models.Lock || model<ILock>('Lock', LockSchema)
