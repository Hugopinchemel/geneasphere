// eslint-disable-next-line @typescript-eslint/no-var-requires
const middleware = require('~~/middleware/auth.global').default

describe('auth.global middleware', () => {
  let mockNavigateTo: jest.Mock

  beforeEach(() => {
    mockNavigateTo = jest.fn()
    ;(global as any).navigateTo = mockNavigateTo
  })

  function buildRoute(path: string) {
    return { path }
  }

  describe('when user is NOT logged in', () => {
    beforeEach(() => {
      ;(global as any).useUserSession = jest.fn(() => ({ loggedIn: { value: false } }))
    })

    it('allows access to /login', () => {
      const result = middleware(buildRoute('/login'))
      expect(result).toBeUndefined()
      expect(mockNavigateTo).not.toHaveBeenCalled()
    })

    it('allows access to /register', () => {
      const result = middleware(buildRoute('/register'))
      expect(result).toBeUndefined()
      expect(mockNavigateTo).not.toHaveBeenCalled()
    })

    it('allows access to /', () => {
      const result = middleware(buildRoute('/'))
      expect(result).toBeUndefined()
      expect(mockNavigateTo).not.toHaveBeenCalled()
    })

    it('redirects to /login when accessing /onboarding', () => {
      middleware(buildRoute('/onboarding'))
      expect(mockNavigateTo).toHaveBeenCalledWith('/login')
    })

    it('redirects to / when accessing a protected route', () => {
      middleware(buildRoute('/dashboard'))
      expect(mockNavigateTo).toHaveBeenCalledWith('/')
    })
  })

  describe('when user IS logged in', () => {
    beforeEach(() => {
      ;(global as any).useUserSession = jest.fn(() => ({ loggedIn: { value: true } }))
    })

    it('redirects away from /login', () => {
      middleware(buildRoute('/login'))
      expect(mockNavigateTo).toHaveBeenCalledWith('/')
    })

    it('redirects away from /register', () => {
      middleware(buildRoute('/register'))
      expect(mockNavigateTo).toHaveBeenCalledWith('/')
    })

    it('allows access to /', () => {
      const result = middleware(buildRoute('/'))
      expect(result).toBeUndefined()
      expect(mockNavigateTo).not.toHaveBeenCalled()
    })

    it('allows access to /onboarding', () => {
      const result = middleware(buildRoute('/onboarding'))
      expect(result).toBeUndefined()
      expect(mockNavigateTo).not.toHaveBeenCalled()
    })

    it('allows access to protected routes', () => {
      const result = middleware(buildRoute('/dashboard'))
      expect(result).toBeUndefined()
      expect(mockNavigateTo).not.toHaveBeenCalled()
    })
  })
})
