import mongoose, { type Model, type Types } from 'mongoose'

const { Schema, model, models } = mongoose

export type MatrimonialStatus = 'married' | 'divorced' | 'pacsed' | 'union_libre' | 'inconnu'
export type ChildLinkType = 'biologique' | 'adoption' | 'gpa'

export interface IMatrimonialChild {
  person: Types.ObjectId
  linkType: ChildLinkType
}

export interface IMatrimonialNode {
  _id: Types.ObjectId
  status: MatrimonialStatus
  startDate?: Date
  endDate?: Date
  parents: Types.ObjectId[]
  children: IMatrimonialChild[]
  teamId: Types.ObjectId
  createdBy: Types.ObjectId
  createdAt?: Date
  updatedAt?: Date
}

const MatrimonialChildSchema = new Schema<IMatrimonialChild>({
  person: { type: Schema.Types.ObjectId, ref: 'Person', required: true },
  linkType: { type: String, enum: ['biologique', 'adoption', 'gpa'], default: 'biologique' }
}, { _id: false })

const MatrimonialNodeSchema = new Schema<IMatrimonialNode>({
  status: { type: String, enum: ['married', 'divorced', 'pacsed', 'union_libre', 'inconnu'], default: 'inconnu' },
  startDate: { type: Date, default: null },
  endDate: { type: Date, default: null },
  parents: {
    type: [{ type: Schema.Types.ObjectId, ref: 'Person' }],
    validate: {
      validator: (v: Types.ObjectId[]) => v.length <= 2,
      message: 'Un nœud matrimonial ne peut avoir plus de 2 parents.'
    },
    default: []
  },
  children: { type: [MatrimonialChildSchema], default: [] },
  teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true })

export const MatrimonialNodeModel: Model<IMatrimonialNode> = models.MatrimonialNode || model<IMatrimonialNode>('MatrimonialNode', MatrimonialNodeSchema)
