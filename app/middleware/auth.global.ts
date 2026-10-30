const PUBLIC_ROUTES = ['/login']

export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuthStore()
  const isPublic = PUBLIC_ROUTES.includes(to.path)

  if (!auth.isAuthenticated) {
    if (isPublic) return
    return navigateTo({ path: '/login', query: to.fullPath !== '/' ? { redirect: to.fullPath } : undefined })
  }

  if (isPublic) return navigateTo('/')

  // Hydrate session once (runs on the server during SSR, so no flash on reload)
  if (!auth.user) {
    try {
      await auth.fetchUser()
    } catch {
      auth.clear()
      return navigateTo('/login')
    }
  }
})
