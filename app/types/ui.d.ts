import type { AvatarProps } from '@nuxt/ui'

export interface Mail {
  uid: number
  unread?: boolean
  from: string
  subject: string
  body: string
  html?: string
  date: string
  cc?: string | null
  attachments: { filename: string }[]
}

export interface Member {
  name: string
  username: string
  role: 'member' | 'owner'
  avatar: AvatarProps
}

export interface Notification {
  id: number
  unread?: boolean
  sender: User
  body: string
  date: string
}

