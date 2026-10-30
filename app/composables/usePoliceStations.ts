import type { PoliceStation, PoliceStationPayload } from '~/types/legal'
import type { Paginated } from '~/types/api'

export function usePoliceStations() {
  const { api } = useApi()

  function usePoliceStationsList(filters: MaybeRefOrGetter<Record<string, unknown>> = {}) {
    return useApiFetch<Paginated<PoliceStation>>('/police-stations/', {
      query: filters,
      watch: [() => toValue(filters)]
    })
  }

  function usePoliceStationDetail(id: MaybeRefOrGetter<string>) {
    return useApiFetch<PoliceStation>(() => `/police-stations/${toValue(id)}/`, {
      watch: [() => toValue(id)]
    })
  }

  function createPoliceStation(payload: PoliceStationPayload): Promise<PoliceStation> {
    return api<PoliceStation>('/police-stations/', {
      method: 'POST',
      body: payload
    })
  }

  function updatePoliceStation(id: string, payload: Partial<PoliceStationPayload>): Promise<PoliceStation> {
    return api<PoliceStation>(`/police-stations/${id}/`, {
      method: 'PUT',
      body: payload
    })
  }

  function patchPoliceStation(id: string, payload: Partial<PoliceStationPayload>): Promise<PoliceStation> {
    return api<PoliceStation>(`/police-stations/${id}/`, {
      method: 'PATCH',
      body: payload
    })
  }

  function deletePoliceStation(id: string): Promise<void> {
    return api<void>(`/police-stations/${id}/`, {
      method: 'DELETE'
    })
  }

  return {
    usePoliceStationsList,
    usePoliceStationDetail,
    createPoliceStation,
    updatePoliceStation,
    patchPoliceStation,
    deletePoliceStation
  }
}
