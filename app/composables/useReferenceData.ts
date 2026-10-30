import type { Court, CaseCategory, Organization, User, PoliceStation, Role, Rank, Appointment } from '~/types/legal'
import type { Paginated } from '~/types/api'

export function useReferenceData() {
  const { api } = useApi()

  async function loadCourtOptions() {
    try {
      const res = await api<Paginated<Court>>('/courts/', { query: { page_size: 100 } })
      return (res.results || []).map(c => ({
        label: `${c.court_name} (${c.district})`,
        value: c.court_id
      }))
    } catch {
      return []
    }
  }

  async function loadCategoryOptions() {
    try {
      const res = await api<Paginated<CaseCategory>>('/case-categories/', { query: { page_size: 100 } })
      return (res.results || []).map(c => ({
        label: `${c.name} [${c.nature}]`,
        value: c.category_id
      }))
    } catch {
      return []
    }
  }

  async function loadOrganizationOptions() {
    try {
      const res = await api<Paginated<Organization>>('/organizations/', { query: { page_size: 100 } })
      return (res.results || []).map(o => ({
        label: `${o.name} (${o.code})`,
        value: o.organization_id
      }))
    } catch {
      return []
    }
  }

  async function loadOfficerOptions() {
    try {
      const res = await api<Paginated<User>>('/users/', { query: { page_size: 100 } })
      return (res.results || []).map(u => ({
        label: `${u.name} (${u.svc_number || u.username})`,
        value: u.user_id
      }))
    } catch {
      return []
    }
  }

  async function loadPoliceStationOptions() {
    try {
      const res = await api<Paginated<PoliceStation>>('/police-stations/', { query: { page_size: 100 } })
      return (res.results || []).map(p => ({
        label: `${p.name} (${p.district})`,
        value: p.police_station_id
      }))
    } catch {
      return []
    }
  }

  async function loadRoleOptions() {
    try {
      const res = await api<Paginated<Role>>('/roles/', { query: { page_size: 100 } })
      return (res.results || []).map(r => ({
        label: r.name,
        value: r.role_id
      }))
    } catch {
      return []
    }
  }

  async function loadRankOptions() {
    try {
      const res = await api<Paginated<Rank>>('/ranks/', { query: { page_size: 100 } })
      return (res.results || []).map(r => ({
        label: `${r.title}${r.abbreviation ? ` (${r.abbreviation})` : ''}`,
        value: r.rank_id
      }))
    } catch {
      return []
    }
  }

  async function loadAppointmentOptions() {
    try {
      const res = await api<Paginated<Appointment>>('/appointments/', { query: { page_size: 100 } })
      return (res.results || []).map(a => ({
        label: a.title,
        value: a.appointment_id
      }))
    } catch {
      return []
    }
  }

  return {
    loadCourtOptions,
    loadCategoryOptions,
    loadOrganizationOptions,
    loadOfficerOptions,
    loadPoliceStationOptions,
    loadRoleOptions,
    loadRankOptions,
    loadAppointmentOptions
  }
}
