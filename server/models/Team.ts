import mongoose, {type Model, type Types} from 'mongoose'

const {Schema, model, models} = mongoose

export interface ITeam {
  _id: Types.ObjectId
  name: string
  owner: Types.ObjectId
  members: Types.ObjectId[]
  createdAt?: Date
  updatedAt?: Date
}

const TeamSchema = new Schema<ITeam>({
  name: {type: String, required: true, trim: true},
  owner: {type: Schema.Types.ObjectId, ref: 'User', required: true},
  members: [{type: Schema.Types.ObjectId, ref: 'User'}]
}, {timestamps: true})

export const TeamModel: Model<ITeam> = models.Team || model<ITeam>('Team', TeamSchema)
