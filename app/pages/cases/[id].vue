<script setup lang="ts">
import type { Case, CaseParty, CaseProceeding } from '~/types/legal'

const route = useRoute()
const router = useRouter()
const caseId = computed(() => route.params.id as string)

const { useCaseDetail, deleteCase, deleteParty, deleteProceeding } = useCases()
const toast = useToast()

const { data: caseItem, status, refresh } = useCaseDetail(caseId)

useHead({
  title: computed(() => caseItem.value ? `${caseItem.value.case_number} · Case Detail` : 'Case Docket')
})

// Active tab
const activeTab = ref<'timeline' | 'proceedings' | 'parties' | 'history'>('timeline')

// Modals
const isEditModalOpen = ref(false)
const isCloseModalOpen = ref(false)
const isMarkModalOpen = ref(false)
const isMarkBackModalOpen = ref(false)

const historyRef = ref<{ refresh: () => Promise<void> | void } | null>(null)
const timelineRef = ref<{ refresh: () => Promise<void> | void } | null>(null)

// Case is open for work (close/mark only make sense while undecided)
const isOpenCase = computed(() => !!caseItem.value && caseItem.value.status !== 'DECIDED' && caseItem.value.status !== 'DISPOSED')

async function onMarkingChanged() {
  // Marking changes access flags, so re-read the case, the audit trail, and the timeline.
  await refresh()
  await Promise.all([
    historyRef.value?.refresh(),
    timelineRef.value?.refresh()
  ])
}

async function onProceedingSaved() {
  await refresh()
  await timelineRef.value?.refresh()
}

async function onPartySaved() {
  await refresh()
  await timelineRef.value?.refresh()
}

async function onCaseSaved() {
  await refresh()
  await timelineRef.value?.refresh()
}

async function onCaseClosed() {
  await refresh()
  await timelineRef.value?.refresh()
}

function onTimelineEditProceeding(proceedingId: string) {
  const p = caseItem.value?.proceedings?.find(item => item.proceeding_id === proceedingId)
  if (p) {
    openEditProceeding(p)
  }
}

const isPartyModalOpen = ref(false)
const selectedParty = ref<CaseParty | null>(null)

const isProceedingModalOpen = ref(false)
const selectedProceeding = ref<CaseProceeding | null>(null)

// Delete Confirmations
const isDeleteCaseModalOpen = ref(false)
const isDeletingCase = ref(false)

const isDeletePartyModalOpen = ref(false)
const partyToDelete = ref<CaseParty | null>(null)
const isDeletingParty = ref(false)

const isDeleteProceedingModalOpen = ref(false)
const proceedingToDelete = ref<CaseProceeding | null>(null)
const isDeletingProceeding = ref(false)

function openAddParty() {
  selectedParty.value = null
  isPartyModalOpen.value = true
}

function openEditParty(party: CaseParty) {
  selectedParty.value = party
  isPartyModalOpen.value = true
}

function openDeleteParty(party: CaseParty) {
  partyToDelete.value = party
  isDeletePartyModalOpen.value = true
}

async function confirmDeleteParty() {
  if (!partyToDelete.value) return
  isDeletingParty.value = true
  try {
    await deleteParty(partyToDelete.value.party_id)
    toast.add({ title: 'Party removed from case', color: 'success' })
    isDeletePartyModalOpen.value = false
    await refresh()
    await timelineRef.value?.refresh()
  } catch (err: any) {
    toast.add({ title: 'Failed to remove party', description: err?.message, color: 'error' })
  } finally {
    isDeletingParty.value = false
  }
}

function openAddProceeding() {
  selectedProceeding.value = null
  isProceedingModalOpen.value = true
}

function openEditProceeding(p: CaseProceeding) {
  selectedProceeding.value = p
  isProceedingModalOpen.value = true
}

function openDeleteProceeding(p: CaseProceeding) {
  proceedingToDelete.value = p
  isDeleteProceedingModalOpen.value = true
}

async function confirmDeleteProceeding() {
  if (!proceedingToDelete.value) return
  isDeletingProceeding.value = true
  try {
    await deleteProceeding(proceedingToDelete.value.proceeding_id)
    toast.add({ title: 'Proceeding deleted', color: 'success' })
    isDeleteProceedingModalOpen.value = false
    await refresh()
    await timelineRef.value?.refresh()
  } catch (err: any) {
    toast.add({ title: 'Failed to delete proceeding', description: err?.message, color: 'error' })
  } finally {
    isDeletingProceeding.value = false
  }
}

async function confirmDeleteCase() {
  if (!caseItem.value) return
  isDeletingCase.value = true
  try {
    await deleteCase(caseItem.value.case_id)
    toast.add({ title: 'Case deleted successfully', color: 'success' })
    await navigateTo('/cases')
  } catch (err: any) {
    toast.add({ title: 'Failed to delete case', description: err?.message, color: 'error' })
  } finally {
    isDeletingCase.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="case-detail">
    <template #header>
      <AppPageHeader :title="caseItem?.case_number || 'Case Details'">
        <template #actions>
          <div class="flex items-center gap-2">
            <UButton
              to="/cases"
              label="Back to Cases"
              icon="i-lucide-arrow-left"
              variant="outline"
              color="neutral"
              size="sm"
            />

            <UButton
              v-if="caseItem?.can_mark"
              label="Mark To Officer"
              icon="i-lucide-arrow-right-circle"
              variant="outline"
              color="primary"
              size="sm"
              @click="isMarkModalOpen = true"
            />

            <UButton
              v-if="caseItem?.can_mark_back"
              :label="`Mark Back to ${caseItem.marked_by_details?.name || 'Sender'}`"
              icon="i-lucide-undo-2"
              color="warning"
              size="sm"
              @click="isMarkBackModalOpen = true"
            />

            <UButton
              v-if="caseItem?.can_work && isOpenCase"
              label="Close Case"
              icon="i-lucide-check-circle"
              color="warning"
              size="sm"
              @click="isCloseModalOpen = true"
            />

            <UButton
              v-if="caseItem?.can_work"
              label="Edit Case"
              icon="i-lucide-pencil"
              variant="outline"
              color="neutral"
              size="sm"
              @click="isEditModalOpen = true"
            />

            <UButton
              v-if="caseItem?.can_work"
              icon="i-lucide-trash-2"
              color="error"
              variant="ghost"
              size="sm"
              @click="isDeleteCaseModalOpen = true"
            />
          </div>
        </template>
      </AppPageHeader>
    </template>

    <template #body>
      <div v-if="caseItem" class="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
        <!-- View-only notice -->
        <UAlert
          v-if="!caseItem.can_work"
          icon="i-lucide-info"
          color="neutral"
          variant="soft"
          title="View-Only Mode"
          description="This case is marked to another officer. You have read-only permissions."
        />

        <!-- Active marking instructions -->
        <CasesCaseMarkingBanner :case-item="caseItem" />

        <!-- Top Docket Banner Card -->
        <div class="p-5 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="text-xs font-mono font-semibold uppercase tracking-wider text-muted">
                  Case Docket #
                </span>
                <CommonStatusBadge :value="caseItem.status" />
                <CasesCaseAccessBadge :value="caseItem.work_access_type" />
              </div>
              <h1 class="text-xl sm:text-2xl font-bold text-highlighted">
                {{ caseItem.case_number }}
              </h1>
              <p class="text-sm sm:text-base font-medium text-muted mt-1">
                {{ caseItem.case_title }}
              </p>
            </div>

            <!-- Quick Action Buttons -->
            <div v-if="caseItem.can_work" class="flex flex-wrap items-center gap-2">
              <UButton
                label="Record Proceeding"
                icon="i-lucide-gavel"
                color="primary"
                size="sm"
                @click="openAddProceeding"
              />
              <UButton
                label="Add Litigant / Party"
                icon="i-lucide-user-plus"
                variant="outline"
                color="primary"
                size="sm"
                @click="openAddParty"
              />
            </div>
          </div>

          <!-- Metadata Grid -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 text-xs">
            <div>
              <span class="text-muted block">Court & District</span>
              <strong class="font-semibold text-highlighted block mt-0.5">
                {{ caseItem.court_details?.court_name || '—' }}
              </strong>
              <span class="text-muted text-[11px]">{{ caseItem.court_details?.district }}</span>
            </div>

            <div>
              <span class="text-muted block">Category & Nature</span>
              <strong class="font-semibold text-highlighted block mt-0.5">
                {{ caseItem.category_details?.name }}
              </strong>
              <CommonStatusBadge :value="caseItem.category_details?.nature" size="xs" />
            </div>

            <div>
              <span class="text-muted block">Managing Unit</span>
              <strong class="font-semibold text-highlighted block mt-0.5">
                {{ caseItem.managing_organization_details?.name || '—' }}
              </strong>
              <span v-if="caseItem.assigned_case_officer_details" class="text-muted text-[11px] block">
                Offr: {{ caseItem.assigned_case_officer_details.name }}
              </span>
            </div>

            <div>
              <span class="text-muted block">Institution Date</span>
              <strong class="font-semibold text-highlighted block mt-0.5">
                {{ caseItem.institution_date }}
              </strong>
              <span v-if="caseItem.decision_date" class="text-emerald-600 dark:text-emerald-400 text-[11px] block">
                Decided: {{ caseItem.decision_date }}
              </span>
            </div>
          </div>

          <!-- Police / FIR Info (if recorded) -->
          <div
            v-if="caseItem.police_station_details || caseItem.fir_number || caseItem.offence_sections"
            class="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-800 text-xs flex flex-wrap items-center gap-6"
          >
            <div v-if="caseItem.police_station_details">
              <span class="text-muted">Police Station: </span>
              <strong class="text-highlighted">{{ caseItem.police_station_details.name }} ({{ caseItem.police_station_details.district }})</strong>
            </div>

            <div v-if="caseItem.fir_number">
              <span class="text-muted">FIR Details: </span>
              <strong class="text-highlighted">FIR #{{ caseItem.fir_number }}/{{ caseItem.fir_year }}</strong>
            </div>

            <div v-if="caseItem.offence_sections">
              <span class="text-muted">Offence Sections: </span>
              <strong class="text-highlighted">{{ caseItem.offence_sections }}</strong>
            </div>
          </div>
        </div>

        <!-- Navigation Tabs: Timeline, Proceedings, Litigants, Movement -->
        <div class="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-2 overflow-x-auto">
          <button
            type="button"
            class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition whitespace-nowrap"
            :class="activeTab === 'timeline'
              ? 'bg-primary text-inverted shadow-sm'
              : 'text-muted hover:bg-neutral-100 dark:hover:bg-neutral-800'"
            @click="activeTab = 'timeline'"
          >
            <UIcon name="i-lucide-activity" class="size-4" />
            <span>Case Timeline</span>
          </button>

          <button
            type="button"
            class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition whitespace-nowrap"
            :class="activeTab === 'proceedings'
              ? 'bg-primary text-inverted shadow-sm'
              : 'text-muted hover:bg-neutral-100 dark:hover:bg-neutral-800'"
            @click="activeTab = 'proceedings'"
          >
            <UIcon name="i-lucide-gavel" class="size-4" />
            <span>Hearings & Proceedings</span>
            <span class="px-1.5 py-0.2 rounded-full text-xs font-bold" :class="activeTab === 'proceedings' ? 'bg-white/20' : 'bg-neutral-200 dark:bg-neutral-800'">
              {{ caseItem.proceedings?.length ?? 0 }}
            </span>
          </button>

          <button
            type="button"
            class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition whitespace-nowrap"
            :class="activeTab === 'parties'
              ? 'bg-primary text-inverted shadow-sm'
              : 'text-muted hover:bg-neutral-100 dark:hover:bg-neutral-800'"
            @click="activeTab = 'parties'"
          >
            <UIcon name="i-lucide-users" class="size-4" />
            <span>Parties & Litigants</span>
            <span class="px-1.5 py-0.2 rounded-full text-xs font-bold" :class="activeTab === 'parties' ? 'bg-white/20' : 'bg-neutral-200 dark:bg-neutral-800'">
              {{ caseItem.parties?.length ?? 0 }}
            </span>
          </button>

          <button
            type="button"
            class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition whitespace-nowrap"
            :class="activeTab === 'history'
              ? 'bg-primary text-inverted shadow-sm'
              : 'text-muted hover:bg-neutral-100 dark:hover:bg-neutral-800'"
            @click="activeTab = 'history'"
          >
            <UIcon name="i-lucide-history" class="size-4" />
            <span>Movement History</span>
          </button>
        </div>

        <!-- TAB 0: TIMELINE -->
        <div v-if="activeTab === 'timeline'" class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-base font-semibold text-highlighted">Case Docket Timeline</h3>
              <p class="text-xs text-muted">Complete chronological record of filings, hearings, orders, and officer transfers</p>
            </div>
            <UButton
              v-if="caseItem.can_work"
              label="Record Proceeding"
              icon="i-lucide-plus"
              size="xs"
              color="primary"
              @click="openAddProceeding"
            />
          </div>

          <CasesCaseTimeline
            ref="timelineRef"
            :case-id="caseItem.case_id"
            :can-work="caseItem.can_work"
            @add-proceeding="openAddProceeding"
            @edit-proceeding="onTimelineEditProceeding"
          />
        </div>

        <!-- TAB 1: PROCEEDINGS -->
        <div v-if="activeTab === 'proceedings'" class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-base font-semibold text-highlighted">Hearing History & Orders</h3>
              <p class="text-xs text-muted">Chronological proceedings recorded by the court</p>
            </div>
            <UButton
              v-if="caseItem.can_work"
              label="Record Proceeding"
              icon="i-lucide-plus"
              size="xs"
              color="primary"
              @click="openAddProceeding"
            />
          </div>

          <div class="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs sm:text-sm">
                <thead class="bg-neutral-50 dark:bg-neutral-800/50 text-muted uppercase tracking-wider font-semibold border-b border-neutral-200 dark:border-neutral-800">
                  <tr>
                    <th class="px-4 py-3">Date</th>
                    <th class="px-4 py-3">Stage of Hearing</th>
                    <th class="px-4 py-3">Action / Summary</th>
                    <th class="px-4 py-3">Short Order</th>
                    <th class="px-4 py-3">Next Proceeding</th>
                    <th class="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
                  <tr
                    v-for="p in caseItem.proceedings || []"
                    :key="p.proceeding_id"
                    class="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40 transition"
                  >
                    <td class="px-4 py-3 font-semibold text-highlighted whitespace-nowrap">
                      {{ p.proceeding_date }}
                      <span v-if="p.is_case_decided" class="block">
                        <UBadge label="Decided" size="xs" color="success" variant="solid" />
                      </span>
                    </td>

                    <td class="px-4 py-3 font-medium text-highlighted">
                      {{ p.stage }}
                    </td>

                    <td class="px-4 py-3 text-muted max-w-xs">
                      {{ p.today_action || '—' }}
                    </td>

                    <td class="px-4 py-3 text-muted max-w-xs font-mono text-xs">
                      {{ p.short_order || '—' }}
                    </td>

                    <td class="px-4 py-3 whitespace-nowrap">
                      <div v-if="p.next_proceeding_date">
                        <span class="font-bold text-primary block">{{ p.next_proceeding_date }}</span>
                        <span class="text-muted text-[11px] block">{{ p.next_stage_purpose || 'Scheduled' }}</span>
                      </div>
                      <span v-else class="text-muted text-xs">—</span>
                    </td>

                    <td class="px-4 py-3 text-right whitespace-nowrap">
                      <div v-if="caseItem.can_work" class="flex items-center justify-end gap-1">
                        <UButton
                          icon="i-lucide-pencil"
                          size="xs"
                          variant="ghost"
                          color="neutral"
                          @click="openEditProceeding(p)"
                        />
                        <UButton
                          icon="i-lucide-trash-2"
                          size="xs"
                          variant="ghost"
                          color="error"
                          @click="openDeleteProceeding(p)"
                        />
                      </div>
                    </td>
                  </tr>

                  <tr v-if="!caseItem.proceedings?.length">
                    <td colspan="6" class="p-8">
                      <CommonEmptyState
                        icon="i-lucide-gavel"
                        title="No court proceedings recorded"
                        :description="caseItem.can_work ? 'Record hearings, orders, and adjournment notices for this case.' : 'No hearings or orders have been recorded for this case.'"
                        :action-label="caseItem.can_work ? 'Record First Proceeding' : undefined"
                        @action="openAddProceeding"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- TAB 2: PARTIES -->
        <div v-if="activeTab === 'parties'" class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-base font-semibold text-highlighted">Litigants & Counsel Directory</h3>
              <p class="text-xs text-muted">Petitioners, respondents, advocates, and state representatives</p>
            </div>
            <UButton
              v-if="caseItem.can_work"
              label="Add Litigant / Party"
              icon="i-lucide-plus"
              size="xs"
              color="primary"
              @click="openAddParty"
            />
          </div>

          <div class="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs sm:text-sm">
                <thead class="bg-neutral-50 dark:bg-neutral-800/50 text-muted uppercase tracking-wider font-semibold border-b border-neutral-200 dark:border-neutral-800">
                  <tr>
                    <th class="px-4 py-3">Side</th>
                    <th class="px-4 py-3">Party Name</th>
                    <th class="px-4 py-3">Counsel / Advocate</th>
                    <th class="px-4 py-3">CNIC</th>
                    <th class="px-4 py-3">Contact</th>
                    <th class="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
                  <tr
                    v-for="party in caseItem.parties || []"
                    :key="party.party_id"
                    class="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40 transition"
                  >
                    <td class="px-4 py-3">
                      <CommonStatusBadge :value="party.party_side" />
                    </td>

                    <td class="px-4 py-3 font-semibold text-highlighted">
                      <div class="flex items-center gap-1.5">
                        <span>{{ party.party_name }}</span>
                        <UBadge
                          v-if="party.is_primary_party"
                          label="Primary"
                          size="xs"
                          color="primary"
                          variant="solid"
                        />
                      </div>
                    </td>

                    <td class="px-4 py-3 text-muted">
                      {{ party.counsel_name || '—' }}
                    </td>

                    <td class="px-4 py-3 text-muted font-mono text-xs">
                      {{ party.cnic || '—' }}
                    </td>

                    <td class="px-4 py-3 text-muted">
                      {{ party.contact_number || '—' }}
                    </td>

                    <td class="px-4 py-3 text-right">
                      <div v-if="caseItem.can_work" class="flex items-center justify-end gap-1">
                        <UButton
                          icon="i-lucide-pencil"
                          size="xs"
                          variant="ghost"
                          color="neutral"
                          @click="openEditParty(party)"
                        />
                        <UButton
                          icon="i-lucide-trash-2"
                          size="xs"
                          variant="ghost"
                          color="error"
                          @click="openDeleteParty(party)"
                        />
                      </div>
                    </td>
                  </tr>

                  <tr v-if="!caseItem.parties?.length">
                    <td colspan="6" class="p-8">
                      <CommonEmptyState
                        icon="i-lucide-users"
                        title="No parties associated yet"
                        description="Add petitioner, appellant, respondent, or prosecutor details."
                        :action-label="caseItem.can_work ? 'Add First Litigant' : undefined"
                        @action="openAddParty"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- TAB 3: MOVEMENT HISTORY -->
        <div v-if="activeTab === 'history'" class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-highlighted">Movement History</h3>
            <p class="text-xs text-muted">Chain of custody: every time this case was marked or marked back</p>
          </div>
          <CasesCaseMarkingHistory ref="historyRef" :case-id="caseItem.case_id" />
        </div>
      </div>

      <!-- Loading skeleton -->
      <div v-else-if="status === 'pending'" class="p-6 space-y-4 max-w-7xl mx-auto">
        <div class="h-40 bg-neutral-200 dark:bg-neutral-800 rounded-2xl animate-pulse" />
        <div class="h-60 bg-neutral-200 dark:bg-neutral-800 rounded-xl animate-pulse" />
      </div>

      <!-- Not Found -->
      <div v-else class="p-12 text-center">
        <UIcon name="i-lucide-alert-circle" class="size-12 text-muted mx-auto mb-3" />
        <h3 class="text-lg font-bold text-highlighted">Case Not Found</h3>
        <p class="text-sm text-muted mt-1">The requested case could not be located on the server.</p>
        <UButton to="/cases" label="Back to Cases Docket" class="mt-4" />
      </div>

      <!-- Modals -->
      <CasesCaseFormModal
        v-if="caseItem"
        v-model:open="isEditModalOpen"
        :case-item="caseItem"
        @saved="onCaseSaved"
      />

      <CasesCaseCloseModal
        v-if="caseItem"
        v-model:open="isCloseModalOpen"
        :case-item="caseItem"
        @closed="onCaseClosed"
      />

      <CasesCaseMarkModal
        v-if="caseItem"
        v-model:open="isMarkModalOpen"
        :case-item="caseItem"
        @marked="onMarkingChanged"
      />

      <CasesCaseMarkBackModal
        v-if="caseItem"
        v-model:open="isMarkBackModalOpen"
        :case-item="caseItem"
        @marked-back="onMarkingChanged"
      />

      <CasesPartyFormModal
        v-if="caseItem"
        v-model:open="isPartyModalOpen"
        :case-id="caseItem.case_id"
        :party-item="selectedParty"
        @saved="onPartySaved"
      />

      <CasesProceedingFormModal
        v-if="caseItem"
        v-model:open="isProceedingModalOpen"
        :case-id="caseItem.case_id"
        :default-court-id="caseItem.court"
        :proceeding-item="selectedProceeding"
        @saved="onProceedingSaved"
      />

      <CommonConfirmModal
        v-model:open="isDeleteCaseModalOpen"
        title="Delete Case Permanently"
        :description="caseItem ? `Are you sure you want to delete case ${caseItem.case_number}? All parties and hearing history will be erased.` : ''"
        confirm-label="Delete Case"
        :loading="isDeletingCase"
        @confirm="confirmDeleteCase"
      />

      <CommonConfirmModal
        v-model:open="isDeletePartyModalOpen"
        title="Remove Party"
        :description="partyToDelete ? `Remove ${partyToDelete.party_name} from this case?` : ''"
        confirm-label="Remove Party"
        :loading="isDeletingParty"
        @confirm="confirmDeleteParty"
      />

      <CommonConfirmModal
        v-model:open="isDeleteProceedingModalOpen"
        title="Delete Proceeding"
        :description="proceedingToDelete ? `Delete proceeding of ${proceedingToDelete.proceeding_date} (${proceedingToDelete.stage})?` : ''"
        confirm-label="Delete Proceeding"
        :loading="isDeletingProceeding"
        @confirm="confirmDeleteProceeding"
      />
    </template>
  </UDashboardPanel>
</template>
