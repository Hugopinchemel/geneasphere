import mongoose, { type Model } from 'mongoose'

const { Schema, model, models } = mongoose

export interface IUser {
  _id: string
  name: string
  email: string
  password: string
  createdAt?: Date
  updatedAt?: Date
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true }
}, { timestamps: true })

export const UserModel: Model<IUser> = models.User || model<IUser>('User', UserSchema)
