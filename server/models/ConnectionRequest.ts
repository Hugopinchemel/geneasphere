import mongoose, { type Model, type Types } from 'mongoose'

const { Schema, model, models } = mongoose

export interface IConnectionRequest {
  _id: Types.ObjectId
  fromUserId: Types.ObjectId
  toUserId: Types.ObjectId
  personId: Types.ObjectId
  matchedPersonName: string
  status: 'pending' | 'accepted' | 'rejected'
  createdAt?: Date
  updatedAt?: Date
}

const ConnectionRequestSchema = new Schema<IConnectionRequest>({
  fromUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  toUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  personId: { type: Schema.Types.ObjectId, ref: 'Person', required: true },
  matchedPersonName: { type: String, required: true, trim: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' }
}, { timestamps: true })

export const ConnectionRequestModel: Model<IConnectionRequest> =
  models.ConnectionRequest || model<IConnectionRequest>('ConnectionRequest', ConnectionRequestSchema)
