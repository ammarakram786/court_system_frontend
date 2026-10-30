import type { FetchOptions } from 'ofetch'
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
export function useApi() {
  const config = useRuntimeConfig()
  const auth = useAuthStore()

  async function api<T>(path: string, options: FetchOptions<'json'> = {}): Promise<T> {
    const run = () =>
      $fetch<T>(path, {
        ...options,
        baseURL: config.public.apiBase,
        headers: {
          ...(options.headers as Record<string, string> | undefined),
          ...(auth.accessToken ? { Authorization: `Bearer ${auth.accessToken}` } : {})
        }
      } as FetchOptions<'json'>)

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
export function useApiFetch<T>(path: MaybeRefOrGetter<string>, options: UseFetchOptions<T> = {}) {
  const { api } = useApi()
  return useFetch<T, ApiError>(path, {
    ...options,
    $fetch: api as typeof $fetch
  } as UseFetchOptions<T>)
}
