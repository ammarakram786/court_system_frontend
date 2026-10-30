import type { User, UserPayload, UserChangePasswordPayload, UserFilters } from '~/types/legal'
import type { Paginated } from '~/types/api'

export function useUsers() {
  const { api } = useApi()

  function useUsersList(filters: MaybeRefOrGetter<UserFilters> = {}) {
    return useApiFetch<Paginated<User>>('/users/', {
      query: filters,
      watch: [() => toValue(filters)]
    })
  }

  function useCurrentUser() {
    return useApiFetch<User>('/users/me/')
  }

  function useUserDetail(id: MaybeRefOrGetter<string>) {
    return useApiFetch<User>(() => `/users/${toValue(id)}/`, {
      watch: [() => toValue(id)]
    })
  }

  function createUser(payload: UserPayload): Promise<User> {
    return api<User>('/users/', {
      method: 'POST',
      body: payload
    })
  }

  function updateUser(id: string, payload: Partial<UserPayload>): Promise<User> {
    return api<User>(`/users/${id}/`, {
      method: 'PUT',
      body: payload
    })
  }

  function patchUser(id: string, payload: Partial<UserPayload>): Promise<User> {
    return api<User>(`/users/${id}/`, {
      method: 'PATCH',
      body: payload
    })
  }

  function deleteUser(id: string): Promise<void> {
    return api<void>(`/users/${id}/`, {
      method: 'DELETE'
    })
  }

  function changePassword(payload: UserChangePasswordPayload): Promise<User> {
    return api<User>('/users/change-password/', {
      method: 'POST',
      body: payload
    })
  }

  return {
    useUsersList,
    useCurrentUser,
    useUserDetail,
    createUser,
    updateUser,
    patchUser,
    deleteUser,
    changePassword
  }
}
