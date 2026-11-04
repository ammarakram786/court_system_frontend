import type {
  Case,
  CasePayload,
  CaseClosePayload,
  CaseMarkingHistory,
  CaseMarkPayload,
  CaseMarkBackPayload,
  CaseTimelineEvent,
  CaseParty,
  CasePartyPayload,
  CaseProceeding,
  CaseProceedingPayload,
  CaseFilters,
  ProceedingFilters
} from '~/types/legal'
import type { Paginated } from '~/types/api'

export function useCases() {
  const { api } = useApi()

  /**
   * SSR-safe reactive case listing with filter & pagination reactivity
   */
  function useCasesList(filters: MaybeRefOrGetter<CaseFilters> = {}) {
    return useApiFetch<Paginated<Case>>('/cases/', {
      query: filters,
      watch: [() => toValue(filters)]
    })
  }

  /**
   * SSR-safe reactive case detail by ID
   */
  function useCaseDetail(caseId: MaybeRefOrGetter<string>) {
    return useApiFetch<Case>(() => `/cases/${toValue(caseId)}/`, {
      watch: [() => toValue(caseId)]
    })
  }

  // Imperative mutations
  function createCase(payload: CasePayload): Promise<Case> {
    return api<Case>('/cases/', {
      method: 'POST',
      body: payload
    })
  }

  function updateCase(caseId: string, payload: Partial<CasePayload>): Promise<Case> {
    return api<Case>(`/cases/${caseId}/`, {
      method: 'PUT',
      body: payload
    })
  }

  function patchCase(caseId: string, payload: Partial<CasePayload>): Promise<Case> {
    return api<Case>(`/cases/${caseId}/`, {
      method: 'PATCH',
      body: payload
    })
  }

  function deleteCase(caseId: string): Promise<void> {
    return api<void>(`/cases/${caseId}/`, {
      method: 'DELETE'
    })
  }

  /** Close case action endpoint: /cases/{id}/close/ */
  function closeCase(caseId: string, payload: CaseClosePayload): Promise<Case> {
    return api<Case>(`/cases/${caseId}/close/`, {
      method: 'POST',
      body: payload
    })
  }

  /** Mark / reassign a case to another officer: POST /cases/{id}/mark/ */
  function markCase(caseId: string, payload: CaseMarkPayload): Promise<Case> {
    return api<Case>(`/cases/${caseId}/mark/`, {
      method: 'POST',
      body: payload
    })
  }

  /** Return a case to the officer who marked it: POST /cases/{id}/mark-back/ */
  function markBackCase(caseId: string, payload: CaseMarkBackPayload = {}): Promise<Case> {
    return api<Case>(`/cases/${caseId}/mark-back/`, {
      method: 'POST',
      body: payload
    })
  }

  /** Chronological marking audit trail: GET /cases/{id}/marking-history/ */
  function useCaseMarkingHistory(caseId: MaybeRefOrGetter<string>) {
    return useApiFetch<CaseMarkingHistory[]>(() => `/cases/${toValue(caseId)}/marking-history/`, {
      watch: [() => toValue(caseId)]
    })
  }

  /**
   * SSR-safe reactive comprehensive case timeline: GET /cases/{id}/timeline/?order=desc|asc
   */
  function useCaseTimeline(
    caseId: MaybeRefOrGetter<string>,
    order: MaybeRefOrGetter<'asc' | 'desc'> = 'desc'
  ) {
    return useApiFetch<CaseTimelineEvent[]>(
      () => `/cases/${toValue(caseId)}/timeline/`,
      {
        query: {
          order: computed(() => toValue(order))
        },
        watch: [() => toValue(caseId), () => toValue(order)]
      }
    )
  }

  /** Nested parties endpoints: /cases/{case_id}/parties/ */
  function useCaseParties(caseId: MaybeRefOrGetter<string>) {
    return useApiFetch<Case>(() => `/cases/${toValue(caseId)}/parties/`, {
      watch: [() => toValue(caseId)]
    })
  }

  function addCaseParty(caseId: string, payload: CasePartyPayload): Promise<Case> {
    return api<Case>(`/cases/${caseId}/parties/`, {
      method: 'POST',
      body: payload
    })
  }

  /** Standalone party CRUD: /case-parties/ */
  function usePartiesList(filters: MaybeRefOrGetter<Record<string, unknown>> = {}) {
    return useApiFetch<Paginated<CaseParty>>('/case-parties/', {
      query: filters,
      watch: [() => toValue(filters)]
    })
  }

  function createParty(payload: CasePartyPayload): Promise<CaseParty> {
    return api<CaseParty>('/case-parties/', {
      method: 'POST',
      body: payload
    })
  }

  function updateParty(partyId: string, payload: Partial<CasePartyPayload>): Promise<CaseParty> {
    return api<CaseParty>(`/case-parties/${partyId}/`, {
      method: 'PUT',
      body: payload
    })
  }

  function deleteParty(partyId: string): Promise<void> {
    return api<void>(`/case-parties/${partyId}/`, {
      method: 'DELETE'
    })
  }

  /** Nested proceedings endpoints: /cases/{case_id}/proceedings/ */
  function useCaseProceedings(caseId: MaybeRefOrGetter<string>) {
    return useApiFetch<Case>(() => `/cases/${toValue(caseId)}/proceedings/`, {
      watch: [() => toValue(caseId)]
    })
  }

  function addCaseProceeding(caseId: string, payload: CaseProceedingPayload): Promise<Case> {
    return api<Case>(`/cases/${caseId}/proceedings/`, {
      method: 'POST',
      body: payload
    })
  }

  /** Standalone proceeding CRUD: /case-proceedings/ */
  function useProceedingsList(filters: MaybeRefOrGetter<ProceedingFilters> = {}) {
    return useApiFetch<Paginated<CaseProceeding>>('/case-proceedings/', {
      query: filters,
      watch: [() => toValue(filters)]
    })
  }

  function createProceeding(payload: CaseProceedingPayload): Promise<CaseProceeding> {
    return api<CaseProceeding>('/case-proceedings/', {
      method: 'POST',
      body: payload
    })
  }

  function updateProceeding(proceedingId: string, payload: Partial<CaseProceedingPayload>): Promise<CaseProceeding> {
    return api<CaseProceeding>(`/case-proceedings/${proceedingId}/`, {
      method: 'PUT',
      body: payload
    })
  }

  function deleteProceeding(proceedingId: string): Promise<void> {
    return api<void>(`/case-proceedings/${proceedingId}/`, {
      method: 'DELETE'
    })
  }

  return {
    useCasesList,
    useCaseDetail,
    createCase,
    updateCase,
    patchCase,
    deleteCase,
    closeCase,
    markCase,
    markBackCase,
    useCaseMarkingHistory,
    useCaseTimeline,
    useCaseParties,
    addCaseParty,
    usePartiesList,
    createParty,
    updateParty,
    deleteParty,
    useCaseProceedings,
    addCaseProceeding,
    useProceedingsList,
    createProceeding,
    updateProceeding,
    deleteProceeding
  }
}
