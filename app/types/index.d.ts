import type {AvatarProps} from '@nuxt/ui'

export type UserStatus = 'subscribed' | 'unsubscribed' | 'bounced'
export type SaleStatus = 'paid' | 'failed' | 'refunded'

export interface User {
  id: number
  name: string
  email: string
  avatar?: AvatarProps
  status: UserStatus
  location: string
}

export interface Mail {
  id: number
  unread?: boolean
  from: User
  subject: string
  body: string
  date: string
}

export interface Member {
  name: string
  username: string
  role: 'member' | 'owner'
  avatar: AvatarProps
}

export interface Stat {
  title: string
  icon: string
  value: number | string
  variation: number
  formatter?: (value: number) => string
}

export interface Sale {
  id: string
  date: string
  status: SaleStatus
  email: string
  amount: number
}

export interface Notification {
  id: number
  unread?: boolean
  sender: User
  body: string
  date: string
}

export type Period = 'daily' | 'weekly' | 'monthly'

export interface Range {
  start: Date
  end: Date
}

// Généalogie
export type Sex = 'M' | 'F' | 'Autre'
export type MatrimonialStatus = 'marié' | 'divorcé' | 'pacsé' | 'union_libre' | 'inconnu'
export type ChildLinkType = 'biologique' | 'adoption' | 'gpa'

export interface Person {
  _id: string
  firstName: string
  lastName: string
  sex: Sex
  birthDate?: string | null
  deathDate?: string | null
  birthPlace?: string
  deathPlace?: string
  photo?: string
  notes?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface MatrimonialChild {
  person: string | Person
  linkType: ChildLinkType
}

export interface MatrimonialNode {
  _id: string
  status: MatrimonialStatus
  startDate?: string | null
  endDate?: string | null
  parents: (string | Person)[]
  children: MatrimonialChild[]
  createdBy: string
  createdAt: string
  updatedAt: string
}

/** Un nœud de rendu de l'arbre : soit un individu seul, soit un couple */
export interface TreeGroup {
  /** Clé unique du groupe (id personne seule, ou "idA__idB" pour un couple) */
  key: string
  /** Personnes du groupe (1 ou 2) */
  persons: Person[]
  /** Statut matrimonial si couple */
  coupleStatus?: MatrimonialStatus
  /** Enfants directs de ce groupe */
  children: TreeGroup[]
}

