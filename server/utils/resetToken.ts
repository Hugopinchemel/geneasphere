import { createHmac, randomBytes } from 'node:crypto'

const SECRET = () => process.env.NUXT_SESSION_PASSWORD || 'fallback-secret-change-me'
const EXPIRES_IN = 60 * 60 * 1000 // 1 heure

export interface ResetPayload {
  userId: string
  email: string
  exp: number
}

export function generateResetToken(userId: string, email: string): string {
  const payload: ResetPayload = {
    userId,
    email,
    exp: Date.now() + EXPIRES_IN
  }
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = createHmac('sha256', SECRET()).update(data).digest('base64url')
  return `${data}.${sig}`
}

export function verifyResetToken(token: string): ResetPayload | null {
  const parts = token.split('.')
  if (parts.length !== 2) return null

  const [data, sig] = parts as [string, string]
  const expectedSig = createHmac('sha256', SECRET()).update(data).digest('base64url')

  // Comparaison en temps constant pour éviter les timing attacks
  if (sig.length !== expectedSig.length) return null
  let diff = 0
  for (let i = 0; i < sig.length; i++) {
    diff |= sig.charCodeAt(i) ^ expectedSig.charCodeAt(i)
  }
  if (diff !== 0) return null

  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString()) as ResetPayload
    if (payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

// Inutilisé ici mais utile pour la génération de secrets
export { randomBytes }

