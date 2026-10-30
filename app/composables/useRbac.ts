import type {
  Role,
  RolePayload,
  Permission,
  PermissionPayload,
  PermissionOverride,
  PermissionOverridePayload
} from '~/types/legal'
import type { Paginated } from '~/types/api'

export function useRbac() {
  const { api } = useApi()

  // Roles
  function useRolesList(filters: MaybeRefOrGetter<Record<string, unknown>> = {}) {
    return useApiFetch<Paginated<Role>>('/roles/', {
      query: filters,
      watch: [() => toValue(filters)]
    })
  }

  function useRoleDetail(id: MaybeRefOrGetter<string>) {
    return useApiFetch<Role>(() => `/roles/${toValue(id)}/`, {
      watch: [() => toValue(id)]
    })
  }

  function createRole(payload: RolePayload): Promise<Role> {
    return api<Role>('/roles/', {
      method: 'POST',
      body: payload
    })
  }

  function updateRole(id: string, payload: Partial<RolePayload>): Promise<Role> {
    return api<Role>(`/roles/${id}/`, {
      method: 'PUT',
      body: payload
    })
  }

  function deleteRole(id: string): Promise<void> {
    return api<void>(`/roles/${id}/`, {
      method: 'DELETE'
    })
  }

  // Permissions
  function usePermissionsList(filters: MaybeRefOrGetter<Record<string, unknown>> = {}) {
    return useApiFetch<Paginated<Permission>>('/permissions/', {
      query: filters,
      watch: [() => toValue(filters)]
    })
  }

  function usePermissionDetail(id: MaybeRefOrGetter<string>) {
    return useApiFetch<Permission>(() => `/permissions/${toValue(id)}/`, {
      watch: [() => toValue(id)]
    })
  }

  function createPermission(payload: PermissionPayload): Promise<Permission> {
    return api<Permission>('/permissions/', {
      method: 'POST',
      body: payload
    })
  }

  function updatePermission(id: string, payload: Partial<PermissionPayload>): Promise<Permission> {
    return api<Permission>(`/permissions/${id}/`, {
      method: 'PUT',
      body: payload
    })
  }

  function deletePermission(id: string): Promise<void> {
    return api<void>(`/permissions/${id}/`, {
      method: 'DELETE'
    })
  }

  // Overrides
  function useOverridesList(filters: MaybeRefOrGetter<Record<string, unknown>> = {}) {
    return useApiFetch<Paginated<PermissionOverride>>('/overrides/', {
      query: filters,
      watch: [() => toValue(filters)]
    })
  }

  function useOverrideDetail(id: MaybeRefOrGetter<string>) {
    return useApiFetch<PermissionOverride>(() => `/overrides/${toValue(id)}/`, {
      watch: [() => toValue(id)]
    })
  }

  function createOverride(payload: PermissionOverridePayload): Promise<PermissionOverride> {
    return api<PermissionOverride>('/overrides/', {
      method: 'POST',
      body: payload
    })
  }

  function updateOverride(id: string, payload: Partial<PermissionOverridePayload>): Promise<PermissionOverride> {
    return api<PermissionOverride>(`/overrides/${id}/`, {
      method: 'PUT',
      body: payload
    })
  }

  function deleteOverride(id: string): Promise<void> {
    return api<void>(`/overrides/${id}/`, {
      method: 'DELETE'
    })
  }

  return {
    useRolesList,
    useRoleDetail,
    createRole,
    updateRole,
    deleteRole,
    usePermissionsList,
    usePermissionDetail,
    createPermission,
    updatePermission,
    deletePermission,
    useOverridesList,
    useOverrideDetail,
    createOverride,
    updateOverride,
    deleteOverride
  }
}
