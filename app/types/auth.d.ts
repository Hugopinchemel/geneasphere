import type {AvatarProps} from '@nuxt/ui'

export type UserStatus = 'subscribed' | 'unsubscribed' | 'bounced'

export interface User {
  id: number
  name: string
  email: string
  avatar?: AvatarProps
  status: UserStatus
  location: string
}

export interface TeamMember {
  _id: string
  name: string
  email: string
  avatar?: string
}

export interface Team {
  _id: string
  name: string
  owner: string
  members: (string | TeamMember)[]
  createdAt: string
  updatedAt: string
}
