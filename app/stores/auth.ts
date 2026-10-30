import { defineStore } from 'pinia'
import type { AuthUser, Credentials, TokenPair } from '~/types/auth'

const COOKIE_OPTS = { sameSite: 'lax', secure: !import.meta.dev, path: '/' } as const

export const useAuthStore = defineStore('auth', () => {
  const config = useRuntimeConfig()

  // Cookies (not localStorage) so tokens are available during SSR – no hydration flash.
  const accessToken = useCookie<string | null>('access_token', { ...COOKIE_OPTS, maxAge: 60 * 60 * 24 * 7, default: () => null })
  const refreshToken = useCookie<string | null>('refresh_token', { ...COOKIE_OPTS, maxAge: 60 * 60 * 24 * 7, default: () => null })

  const user = useState<AuthUser | null>('auth:user', () => null)

  const isAuthenticated = computed(() => !!accessToken.value)
  const permissionCodes = computed(() => new Set(user.value?.role_details?.permissions.map(p => p.code) ?? []))

  function can(code: string) {
    return !!user.value?.is_staff || permissionCodes.value.has(code)
  }

  function setTokens(tokens: Partial<TokenPair>) {
    if (tokens.access) accessToken.value = tokens.access
    if (tokens.refresh) refreshToken.value = tokens.refresh
  }

  function clear() {
    accessToken.value = null
    refreshToken.value = null
    user.value = null
  }

  // Concurrent 401s share a single refresh request.
  let refreshing: Promise<boolean> | null = null
  function refresh(): Promise<boolean> {
    if (!refreshToken.value) return Promise.resolve(false)
    refreshing ??= $fetch<TokenPair>('/auth/token/refresh/', {
      baseURL: config.public.apiBase,
      method: 'POST',
      body: { refresh: refreshToken.value }
    })
      .then((t) => {
        setTokens(t)
        return true
      })
      .catch(() => {
        clear()
        return false
      })
      .finally(() => {
        refreshing = null
      })
    return refreshing
  }

  async function login(credentials: Credentials) {
    const tokens = await $fetch<TokenPair>('/auth/token/', {
      baseURL: config.public.apiBase,
      method: 'POST',
      body: credentials
    }).catch((e) => {
      throw toApiError(e?.response?.status, e?.data, 'Invalid username or password')
    })
    setTokens(tokens)
    await fetchUser()
  }

  async function fetchUser() {
    const { api } = useApi()
    user.value = await api<AuthUser>('/users/me/')
    return user.value
  }

  async function logout() {
    clear()
    await navigateTo('/login')
  }

  return { accessToken, refreshToken, user, isAuthenticated, can, setTokens, refresh, login, fetchUser, logout, clear }
})
