import type {
  CauseList,
  CauseListPayload,
  CauseListItem,
  CauseListItemPayload,
  CauseListFilters
} from '~/types/legal'
import type { Paginated } from '~/types/api'

export function useCauseLists() {
  const { api } = useApi()

  function useCauseListsList(filters: MaybeRefOrGetter<CauseListFilters> = {}) {
    return useApiFetch<Paginated<CauseList>>('/cause-lists/', {
      query: filters,
      watch: [() => toValue(filters)]
    })
  }

  function useTodayCauseList() {
    return useApiFetch<CauseList>('/cause-lists/today/')
  }

  function useCauseListDetail(id: MaybeRefOrGetter<string>) {
    return useApiFetch<CauseList>(() => `/cause-lists/${toValue(id)}/`, {
      watch: [() => toValue(id)]
    })
  }

  function createCauseList(payload: CauseListPayload): Promise<CauseList> {
    return api<CauseList>('/cause-lists/', {
      method: 'POST',
      body: payload
    })
  }

  function updateCauseList(id: string, payload: Partial<CauseListPayload>): Promise<CauseList> {
    return api<CauseList>(`/cause-lists/${id}/`, {
      method: 'PUT',
      body: payload
    })
  }

  function patchCauseList(id: string, payload: Partial<CauseListPayload>): Promise<CauseList> {
    return api<CauseList>(`/cause-lists/${id}/`, {
      method: 'PATCH',
      body: payload
    })
  }

  function deleteCauseList(id: string): Promise<void> {
    return api<void>(`/cause-lists/${id}/`, {
      method: 'DELETE'
    })
  }

  // Items CRUD
  function useCauseListItems(filters: MaybeRefOrGetter<Record<string, unknown>> = {}) {
    return useApiFetch<Paginated<CauseListItem>>('/cause-list-items/', {
      query: filters,
      watch: [() => toValue(filters)]
    })
  }

  function createCauseListItem(payload: CauseListItemPayload): Promise<CauseListItem> {
    return api<CauseListItem>('/cause-list-items/', {
      method: 'POST',
      body: payload
    })
  }

  function updateCauseListItem(id: string, payload: Partial<CauseListItemPayload>): Promise<CauseListItem> {
    return api<CauseListItem>(`/cause-list-items/${id}/`, {
      method: 'PUT',
      body: payload
    })
  }

  function deleteCauseListItem(id: string): Promise<void> {
    return api<void>(`/cause-list-items/${id}/`, {
      method: 'DELETE'
    })
  }

  return {
    useCauseListsList,
    useTodayCauseList,
    useCauseListDetail,
    createCauseList,
    updateCauseList,
    patchCauseList,
    deleteCauseList,
    useCauseListItems,
    createCauseListItem,
    updateCauseListItem,
    deleteCauseListItem
  }
}
