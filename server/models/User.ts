import mongoose, { type Model } from 'mongoose'

const { Schema, model, models } = mongoose

export interface IUser {
  _id: string
  name: string
  email: string
  password?: string
  avatar?: string
  bio?: string
  theme?: 'light' | 'dark'
  primaryColor?: string
  neutralColor?: string
  currentTeamId?: string
  googleId?: string
  inboxEnabled?: boolean
  resetToken?: string
  resetTokenExpiry?: Date
  loginNotifications?: boolean
  createdAt?: Date
  updatedAt?: Date
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, default: '' },
  googleId: { type: String, default: '' },
  avatar: { type: String, default: '' },
  bio: { type: String, default: '' },
  theme: { type: String, enum: ['light', 'dark'], default: 'dark' },
  primaryColor: { type: String, default: 'green' },
  neutralColor: { type: String, default: 'zinc' },
  currentTeamId: { type: String, default: '' },
  inboxEnabled: { type: Boolean, default: false },
  resetToken: { type: String, default: '' },
  resetTokenExpiry: { type: Date },
  loginNotifications: { type: Boolean, default: false }
}, { timestamps: true })

export const UserModel: Model<IUser> = models.User || model<IUser>('User', UserSchema)
