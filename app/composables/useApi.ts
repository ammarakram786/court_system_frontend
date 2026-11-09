import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack'
import type { UseFetchOptions } from '#app'

/**
 * Enterprise Gateway to the Django REST Framework API.
 *
 * Architecture Highlights:
 *  - Dual-Base Strategy: Uses high-speed internal base (apiBaseInternal) during SSR
 *    and unified reverse proxy base (apiBase) in client browser.
 *  - Automatic SSR Header Forwarding: Forwards client IP, User-Agent, and Accept-Language
 *    to Django DRF for proper rate-limiting and audit trails.
 *  - Atomic JWT Auth: Injects Bearer token from SSR-compatible cookie storage.
 *  - Race-Condition-Proof 401 Silent Refresh: Deduplicates simultaneous refresh requests
 *    and retries the original request seamlessly upon token rotation.
 *  - Uniform Error Envelope: Transforms DRF error responses into structured `ApiError`.
 */
export function resolveApiPath(path: string, defaultBase: string): { url: string, baseURL?: string } {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return { url: path }
  }
  if (path === '/health/' || path === '/api/health/') {
    try {
      if (defaultBase.startsWith('http://') || defaultBase.startsWith('https://')) {
        const origin = new URL(defaultBase).origin
        return { url: path, baseURL: origin }
      }
      return { url: path }
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

  // Select base URL according to execution runtime
  const effectiveBaseUrl = (import.meta.server && config.apiBaseInternal)
    ? (config.apiBaseInternal as string)
    : config.public.apiBase

  async function api<T = any>(path: string, options: NitroFetchOptions<NitroFetchRequest> = {}): Promise<T> {
    const { url, baseURL } = resolveApiPath(path, effectiveBaseUrl)

    // Forward SSR client headers to backend (for IP auditing, rate limits, geolocation)
    let ssrHeaders: Record<string, string> = {}
    if (import.meta.server) {
      try {
        const forwarded = useRequestHeaders(['user-agent', 'x-forwarded-for', 'x-real-ip', 'accept-language'])
        if (forwarded) {
          ssrHeaders = forwarded as Record<string, string>
        }
      } catch {
        // Safe fallback in non-request SSR contexts (e.g. build prerendering)
      }
    }

    const run = () =>
      $fetch<T>(url as NitroFetchRequest, {
        ...options,
        baseURL: options.baseURL || baseURL,
        headers: {
          ...ssrHeaders,
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
