export interface HealthStatus {
  status?: string
  database?: string
  [key: string]: unknown
}

export function useHealth() {
  function useHealthCheck() {
    return useApiFetch<HealthStatus>('/api/health/')
  }

  return {
    useHealthCheck
  }
}
