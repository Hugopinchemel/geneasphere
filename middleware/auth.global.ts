export default defineNuxtRouteMiddleware(async (to) => {
  const {user, fetch: fetchSession, ready} = useUserSession()
  if (!ready.value) {
    await fetchSession()
  }

  const authPaths = ['/login', '/register']

  if (authPaths.includes(to.path)) {
    if (user.value) {
      return navigateTo('/')
    }
    return
  }

  if (!user.value) {
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }
})
