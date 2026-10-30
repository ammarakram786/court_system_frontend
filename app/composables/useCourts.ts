import type { Court, CourtPayload, CourtFilters } from '~/types/legal'
import type { Paginated } from '~/types/api'

export function useCourts() {
  const { api } = useApi()

  function useCourtsList(filters: MaybeRefOrGetter<CourtFilters> = {}) {
    return useApiFetch<Paginated<Court>>('/courts/', {
      query: filters,
      watch: [() => toValue(filters)]
    })
  }

  function useCourtDetail(id: MaybeRefOrGetter<string>) {
    return useApiFetch<Court>(() => `/courts/${toValue(id)}/`, {
      watch: [() => toValue(id)]
    })
  }

  function createCourt(payload: CourtPayload): Promise<Court> {
    return api<Court>('/courts/', {
      method: 'POST',
      body: payload
    })
  }

  function updateCourt(id: string, payload: Partial<CourtPayload>): Promise<Court> {
    return api<Court>(`/courts/${id}/`, {
      method: 'PUT',
      body: payload
    })
  }

  function patchCourt(id: string, payload: Partial<CourtPayload>): Promise<Court> {
    return api<Court>(`/courts/${id}/`, {
      method: 'PATCH',
      body: payload
    })
  }

  function deleteCourt(id: string): Promise<void> {
    return api<void>(`/courts/${id}/`, {
      method: 'DELETE'
    })
  }

  return {
    useCourtsList,
    useCourtDetail,
    createCourt,
    updateCourt,
    patchCourt,
    deleteCourt
  }
}
