export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn } = useUserSession()

  const publicPaths = ['/login', '/register', '/']

  if (publicPaths.includes(to.path)) {
    if (loggedIn.value && to.path !== '/') return navigateTo('/')
    return
  }

  // Onboarding accessible uniquement aux utilisateurs connectés
  if (to.path === '/onboarding') {
    if (!loggedIn.value) return navigateTo('/login')
    return
  }

  if (!loggedIn.value) {
    return navigateTo('/')
  }
})
