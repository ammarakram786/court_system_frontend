import type { CaseCategory, CaseCategoryPayload } from '~/types/legal'
import type { Paginated } from '~/types/api'

export function useCaseCategories() {
  const { api } = useApi()

  function useCategoriesList(filters: MaybeRefOrGetter<Record<string, unknown>> = {}) {
    return useApiFetch<Paginated<CaseCategory>>('/case-categories/', {
      query: filters,
      watch: [() => toValue(filters)]
    })
  }

  function useCategoryDetail(id: MaybeRefOrGetter<string>) {
    return useApiFetch<CaseCategory>(() => `/case-categories/${toValue(id)}/`, {
      watch: [() => toValue(id)]
    })
  }

  function createCategory(payload: CaseCategoryPayload): Promise<CaseCategory> {
    return api<CaseCategory>('/case-categories/', {
      method: 'POST',
      body: payload
    })
  }

  function updateCategory(id: string, payload: Partial<CaseCategoryPayload>): Promise<CaseCategory> {
    return api<CaseCategory>(`/case-categories/${id}/`, {
      method: 'PUT',
      body: payload
    })
  }

  function patchCategory(id: string, payload: Partial<CaseCategoryPayload>): Promise<CaseCategory> {
    return api<CaseCategory>(`/case-categories/${id}/`, {
      method: 'PATCH',
      body: payload
    })
  }

  function deleteCategory(id: string): Promise<void> {
    return api<void>(`/case-categories/${id}/`, {
      method: 'DELETE'
    })
  }

  return {
    useCategoriesList,
    useCategoryDetail,
    createCategory,
    updateCategory,
    patchCategory,
    deleteCategory
  }
}
