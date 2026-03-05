// Mock Nuxt auto-imports globally so server handlers and middleware can reference them
const g = global as Record<string, unknown>

g.getUserSession = jest.fn()
g.setUserSession = jest.fn()
g.navigateTo = jest.fn()
g.useUserSession = jest.fn(() => ({ loggedIn: { value: false }, fetch: jest.fn() }))
g.defineNuxtRouteMiddleware = (fn: unknown) => fn
