export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn } = useUserSession()

  const publicPaths = ['/login', '/register', '/']

  if (publicPaths.includes(to.path)) {
    if (loggedIn.value && to.path !== '/') return navigateTo('/')
    return
  }

  if (!loggedIn.value) {
    return navigateTo('/')
  }
})
