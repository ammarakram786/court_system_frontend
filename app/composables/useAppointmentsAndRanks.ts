import type {
  Appointment,
  AppointmentPayload,
  Rank,
  RankPayload
} from '~/types/legal'
import type { Paginated } from '~/types/api'

export function useAppointmentsAndRanks() {
  const { api } = useApi()

  // Appointments
  function useAppointmentsList(filters: MaybeRefOrGetter<Record<string, unknown>> = {}) {
    return useApiFetch<Paginated<Appointment>>('/appointments/', {
      query: filters,
      watch: [() => toValue(filters)]
    })
  }

  function useAppointmentDetail(id: MaybeRefOrGetter<string>) {
    return useApiFetch<Appointment>(() => `/appointments/${toValue(id)}/`, {
      watch: [() => toValue(id)]
    })
  }

  function createAppointment(payload: AppointmentPayload): Promise<Appointment> {
    return api<Appointment>('/appointments/', {
      method: 'POST',
      body: payload
    })
  }

  function updateAppointment(id: string, payload: Partial<AppointmentPayload>): Promise<Appointment> {
    return api<Appointment>(`/appointments/${id}/`, {
      method: 'PUT',
      body: payload
    })
  }

  function patchAppointment(id: string, payload: Partial<AppointmentPayload>): Promise<Appointment> {
    return api<Appointment>(`/appointments/${id}/`, {
      method: 'PATCH',
      body: payload
    })
  }

  function deleteAppointment(id: string): Promise<void> {
    return api<void>(`/appointments/${id}/`, {
      method: 'DELETE'
    })
  }

  // Ranks
  function useRanksList(filters: MaybeRefOrGetter<Record<string, unknown>> = {}) {
    return useApiFetch<Paginated<Rank>>('/ranks/', {
      query: filters,
      watch: [() => toValue(filters)]
    })
  }

  function useRankDetail(id: MaybeRefOrGetter<string>) {
    return useApiFetch<Rank>(() => `/ranks/${toValue(id)}/`, {
      watch: [() => toValue(id)]
    })
  }

  function createRank(payload: RankPayload): Promise<Rank> {
    return api<Rank>('/ranks/', {
      method: 'POST',
      body: payload
    })
  }

  function updateRank(id: string, payload: Partial<RankPayload>): Promise<Rank> {
    return api<Rank>(`/ranks/${id}/`, {
      method: 'PUT',
      body: payload
    })
  }

  function patchRank(id: string, payload: Partial<RankPayload>): Promise<Rank> {
    return api<Rank>(`/ranks/${id}/`, {
      method: 'PATCH',
      body: payload
    })
  }

  function deleteRank(id: string): Promise<void> {
    return api<void>(`/ranks/${id}/`, {
      method: 'DELETE'
    })
  }

  return {
    useAppointmentsList,
    useAppointmentDetail,
    createAppointment,
    updateAppointment,
    patchAppointment,
    deleteAppointment,
    useRanksList,
    useRankDetail,
    createRank,
    updateRank,
    patchRank,
    deleteRank
  }
}
