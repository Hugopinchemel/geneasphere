declare module '#auth-utils' {
  interface User {
    id: string
    name: string
    email: string
    avatar?: string
    theme?: 'light' | 'dark'
    primaryColor?: string
    neutralColor?: string
    currentTeamId?: string
    inboxEnabled?: boolean
  }
}

export {}
