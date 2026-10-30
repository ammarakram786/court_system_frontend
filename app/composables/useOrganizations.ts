import type { Organization, OrganizationPayload, OrganizationFilters } from '~/types/legal'
import type { Paginated } from '~/types/api'

export function useOrganizations() {
  const { api } = useApi()

  function useOrganizationsList(filters: MaybeRefOrGetter<OrganizationFilters> = {}) {
    return useApiFetch<Paginated<Organization>>('/organizations/', {
      query: filters,
      watch: [() => toValue(filters)]
    })
  }

  function useRootOrganization() {
    return useApiFetch<Organization>('/organizations/root/')
  }

  function useSubOrganizations(id: MaybeRefOrGetter<string>) {
    return useApiFetch<Organization>(() => `/organizations/${toValue(id)}/sub-organizations/`, {
      watch: [() => toValue(id)]
    })
  }

  function useOrganizationDetail(id: MaybeRefOrGetter<string>) {
    return useApiFetch<Organization>(() => `/organizations/${toValue(id)}/`, {
      watch: [() => toValue(id)]
    })
  }

  function createOrganization(payload: OrganizationPayload): Promise<Organization> {
    return api<Organization>('/organizations/', {
      method: 'POST',
      body: payload
    })
  }

  function updateOrganization(id: string, payload: Partial<OrganizationPayload>): Promise<Organization> {
    return api<Organization>(`/organizations/${id}/`, {
      method: 'PUT',
      body: payload
    })
  }

  function patchOrganization(id: string, payload: Partial<OrganizationPayload>): Promise<Organization> {
    return api<Organization>(`/organizations/${id}/`, {
      method: 'PATCH',
      body: payload
    })
  }

  function deleteOrganization(id: string): Promise<void> {
    return api<void>(`/organizations/${id}/`, {
      method: 'DELETE'
    })
  }

  return {
    useOrganizationsList,
    useRootOrganization,
    useSubOrganizations,
    useOrganizationDetail,
    createOrganization,
    updateOrganization,
    patchOrganization,
    deleteOrganization
  }
}
