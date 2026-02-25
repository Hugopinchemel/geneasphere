import mongoose, {type Model, type Types} from 'mongoose'

const {Schema, model, models} = mongoose

export interface IPerson {
  _id: Types.ObjectId
  firstName: string
  lastName: string
  sex: 'M' | 'F' | 'Autre'
  birthDate?: Date
  deathDate?: Date
  birthPlace?: string
  deathPlace?: string
  photo?: string
  notes?: string
  createdBy: Types.ObjectId
  createdAt?: Date
  updatedAt?: Date
}

const PersonSchema = new Schema<IPerson>({
  firstName: {type: String, required: true, trim: true},
  lastName: {type: String, default: '', trim: true},
  sex: {type: String, enum: ['M', 'F', 'Autre'], required: true},
  birthDate: {type: Date, default: null},
  deathDate: {type: Date, default: null},
  birthPlace: {type: String, default: '', trim: true},
  deathPlace: {type: String, default: '', trim: true},
  photo: {type: String, default: ''},
  notes: {type: String, default: ''},
  createdBy: {type: Schema.Types.ObjectId, ref: 'User', required: true}
}, {timestamps: true})

export const PersonModel: Model<IPerson> = models.Person || model<IPerson>('Person', PersonSchema)
