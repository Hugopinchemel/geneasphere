import { createError, type H3Event, getRequestIP } from 'h3'

interface RateLimitInfo {
  count: number
  resetTime: number
}

const stores = new Map<string, Map<string, RateLimitInfo>>()

export function useRateLimit(options: {
  key: string
  limit: number
  windowMs: number
}) {
  const { key: storeKey, limit, windowMs } = options

  if (!stores.has(storeKey)) {
    stores.set(storeKey, new Map())
  }

  const store = stores.get(storeKey)!

  return async (event: H3Event) => {
    const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
    const now = Date.now()
    const info = store.get(ip)

    if (!info || now > info.resetTime) {
      store.set(ip, {
        count: 1,
        resetTime: now + windowMs
      })
      return
    }

    info.count++
    if (info.count > limit) {
      throw createError({
        statusCode: 429,
        statusMessage: 'Too Many Requests',
        data: {
          retryAfter: Math.ceil((info.resetTime - now) / 1000)
        }
      })
    }
  }
}
