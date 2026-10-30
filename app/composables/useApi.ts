import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack'
import type { UseFetchOptions } from '#app'

/**
 * Central gateway to the Django REST Framework API.
 *
 *  - injects base URL + `Authorization: Bearer <access>`
 *  - on 401 transparently refreshes the JWT once and retries
 *  - converts every failure into a typed `ApiError` (field errors included)
 *
 * Use `api()` for imperative calls (mutations, handlers) and `useApiFetch()`
 * for SSR-safe reactive reads.
 */
export function resolveApiPath(path: string, defaultBase: string): { url: string, baseURL?: string } {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return { url: path }
  }
  if (path === '/health/' || path === '/api/health/') {
    try {
      const origin = new URL(defaultBase).origin
      return { url: path, baseURL: origin }
    } catch {
      return { url: path, baseURL: defaultBase }
    }
  }
  if (path.startsWith('/api/v1/')) {
    return { url: path.replace(/^\/api\/v1/, ''), baseURL: defaultBase }
  }
  return { url: path, baseURL: defaultBase }
}

export function useApi() {
  const config = useRuntimeConfig()
  const auth = useAuthStore()

  async function api<T = any>(path: string, options: NitroFetchOptions<NitroFetchRequest> = {}): Promise<T> {
    const { url, baseURL } = resolveApiPath(path, config.public.apiBase)

    const run = () =>
      $fetch<T>(url as NitroFetchRequest, {
        ...options,
        baseURL: options.baseURL || baseURL,
        headers: {
          ...(options.headers as Record<string, string> | undefined),
          ...(auth.accessToken ? { Authorization: `Bearer ${auth.accessToken}` } : {})
        }
      } as any)

    try {
      return await run()
    } catch (e: any) {
      if (e?.response?.status === 401 && await auth.refresh()) {
        try {
          return await run()
        } catch (retryErr: any) {
          throw await handleFailure(retryErr)
        }
      }
      throw await handleFailure(e)
    }
  }

  async function handleFailure(e: any): Promise<ApiError> {
    const status: number | undefined = e?.response?.status
    if (status === 401) {
      auth.clear()
      if (import.meta.client) await navigateTo('/login')
    }
    return toApiError(status, e?.data, e?.statusMessage || undefined)
  }

  return { api }
}

/** SSR-safe `useFetch` wired through `useApi` (auth, refresh, typed errors). */
export function useApiFetch<T = any>(
  path: MaybeRefOrGetter<string>,
  options: UseFetchOptions<T> = {}
) {
  const { api } = useApi()
  return useFetch<T, ApiError>(path, {
    ...options,
    $fetch: api as unknown as typeof $fetch
  } as any)
}
