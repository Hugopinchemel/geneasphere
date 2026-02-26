export default defineNuxtRouteMiddleware((to) => {
  const {loggedIn} = useUserSession()

  const authPaths = ['/login', '/register']

  if (authPaths.includes(to.path)) {
    if (loggedIn.value) return navigateTo('/')
    return
  }

  if (!loggedIn.value) {
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }
})
