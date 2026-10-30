<script setup lang="ts">
import type { CaseProceeding, ProceedingFilters } from '~/types/legal'

useHead({ title: 'Court Proceedings & Hearings' })

const { useProceedingsList, deleteProceeding } = useCases()
const refData = useReferenceData()
const toast = useToast()

const filters = reactive<ProceedingFilters>({
  search: '',
  court: undefined,
  is_case_decided: undefined,
  proceeding_date_after: undefined,
  proceeding_date_before: undefined,
  page: 1,
  page_size: 15,
  ordering: '-proceeding_date'
})

const { data, status, refresh } = useProceedingsList(filters)
const courtOptions = ref<{ label: string, value: string }[]>([])

const decidedOptions = [
  { label: 'All Hearings', value: '' },
  { label: 'Pending Only', value: 'false' },
  { label: 'Decided Cases Only', value: 'true' }
]

const selectedDecided = ref('')

watch(selectedDecided, (val) => {
  if (val === 'true') filters.is_case_decided = true
  else if (val === 'false') filters.is_case_decided = false
  else filters.is_case_decided = undefined
  filters.page = 1
})

onMounted(async () => {
  const courts = await refData.loadCourtOptions()
  courtOptions.value = [{ label: 'All Courts', value: '' }, ...courts]
})

// Modals
const isEditModalOpen = ref(false)
const selectedProceeding = ref<CaseProceeding | null>(null)

const isDeleteModalOpen = ref(false)
const proceedingToDelete = ref<CaseProceeding | null>(null)
const isDeleting = ref(false)

function openEdit(p: CaseProceeding) {
  selectedProceeding.value = p
  isEditModalOpen.value = true
}

function openDelete(p: CaseProceeding) {
  proceedingToDelete.value = p
  isDeleteModalOpen.value = true
}

async function confirmDelete() {
  if (!proceedingToDelete.value) return
  isDeleting.value = true
  try {
    await deleteProceeding(proceedingToDelete.value.proceeding_id)
    toast.add({ title: 'Proceeding removed', color: 'success' })
    isDeleteModalOpen.value = false
    refresh()
  } catch (err: any) {
    toast.add({ title: 'Failed to delete proceeding', description: err?.message, color: 'error' })
  } finally {
    isDeleting.value = false
  }
}

function resetFilters() {
  filters.search = ''
  filters.court = undefined
  selectedDecided.value = ''
  filters.proceeding_date_after = undefined
  filters.proceeding_date_before = undefined
  filters.page = 1
}
</script>

<template>
  <UDashboardPanel id="proceedings-list">
    <template #header>
      <AppPageHeader title="Hearings & Proceedings Docket">
        <template #actions>
          <UButton
            to="/cases"
            label="Go to Cases Docket"
            icon="i-lucide-folder-git-2"
            variant="outline"
            color="neutral"
            size="sm"
          />
        </template>
      </AppPageHeader>
    </template>

    <template #body>
      <div class="p-4 sm:p-6 space-y-4 max-w-7xl mx-auto w-full">
        <!-- Filters Card -->
        <div class="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <UInput
              v-model="filters.search"
              placeholder="Search stage, order..."
              icon="i-lucide-search"
              class="w-full"
              @update:model-value="filters.page = 1"
            />

            <USelect
              v-model="filters.court"
              :items="courtOptions"
              value-key="value"
              label-key="label"
              placeholder="Filter by Court"
              class="w-full"
              @update:model-value="filters.page = 1"
            />

            <USelect
              v-model="selectedDecided"
              :items="decidedOptions"
              value-key="value"
              label-key="label"
              placeholder="Disposal Status"
              class="w-full"
            />

            <UInput
              v-model="filters.proceeding_date_after"
              type="date"
              placeholder="From Date"
              class="w-full"
              @update:model-value="filters.page = 1"
            />

            <UInput
              v-model="filters.proceeding_date_before"
              type="date"
              placeholder="To Date"
              class="w-full"
              @update:model-value="filters.page = 1"
            />
          </div>

          <div class="flex items-center justify-between text-xs text-muted pt-1">
            <span>
              Total hearings recorded: <strong class="text-highlighted">{{ data?.count ?? 0 }}</strong>
            </span>
            <button
              v-if="filters.search || filters.court || selectedDecided || filters.proceeding_date_after || filters.proceeding_date_before"
              type="button"
              class="text-primary hover:underline flex items-center gap-1"
              @click="resetFilters"
            >
              <UIcon name="i-lucide-rotate-ccw" class="size-3" />
              Reset Filters
            </button>
          </div>
        </div>

        <!-- Proceedings Table -->
        <div class="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs sm:text-sm">
              <thead class="bg-neutral-50 dark:bg-neutral-800/50 text-muted uppercase tracking-wider font-semibold border-b border-neutral-200 dark:border-neutral-800">
                <tr>
                  <th class="px-4 py-3">Hearing Date</th>
                  <th class="px-4 py-3">Court Bench</th>
                  <th class="px-4 py-3">Stage</th>
                  <th class="px-4 py-3">Action / Summary</th>
                  <th class="px-4 py-3">Short Order</th>
                  <th class="px-4 py-3">Next Date</th>
                  <th class="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
                <tr
                  v-for="p in data?.results || []"
                  :key="p.proceeding_id"
                  class="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40 transition"
                >
                  <td class="px-4 py-3.5 font-bold text-highlighted whitespace-nowrap">
                    {{ p.proceeding_date }}
                    <span v-if="p.is_case_decided" class="block mt-0.5">
                      <UBadge label="Decided" size="xs" color="success" variant="solid" />
                    </span>
                  </td>

                  <td class="px-4 py-3.5">
                    <span class="font-medium text-highlighted block">
                      {{ p.court_details?.court_name }}
                    </span>
                    <span class="text-[11px] text-muted block">
                      {{ p.court_details?.district }} (Room {{ p.court_details?.court_room_no || 'N/A' }})
                    </span>
                  </td>

                  <td class="px-4 py-3.5 font-semibold text-primary">
                    {{ p.stage }}
                  </td>

                  <td class="px-4 py-3.5 max-w-xs text-muted">
                    {{ p.today_action || '—' }}
                  </td>

                  <td class="px-4 py-3.5 max-w-xs text-muted font-mono text-xs truncate">
                    {{ p.short_order || '—' }}
                  </td>

                  <td class="px-4 py-3.5 whitespace-nowrap">
                    <div v-if="p.next_proceeding_date">
                      <span class="font-bold text-primary block">{{ p.next_proceeding_date }}</span>
                      <span class="text-muted text-[11px] block">{{ p.next_stage_purpose || 'Adjourned' }}</span>
                    </div>
                    <span v-else class="text-muted text-xs">—</span>
                  </td>

                  <td class="px-4 py-3.5 text-right whitespace-nowrap">
                    <div class="flex items-center justify-end gap-1">
                      <UButton
                        :to="`/cases/${p.case}`"
                        label="View Case"
                        size="xs"
                        variant="ghost"
                        trailing-icon="i-lucide-arrow-right"
                      />
                      <UButton
                        icon="i-lucide-pencil"
                        size="xs"
                        variant="ghost"
                        color="neutral"
                        @click="openEdit(p)"
                      />
                      <UButton
                        icon="i-lucide-trash-2"
                        size="xs"
                        variant="ghost"
                        color="error"
                        @click="openDelete(p)"
                      />
                    </div>
                  </td>
                </tr>

                <tr v-if="!data?.results?.length && status !== 'pending'">
                  <td colspan="7" class="p-8">
                    <CommonEmptyState
                      icon="i-lucide-gavel"
                      title="No proceedings found"
                      description="No hearings match your current filter parameters."
                    />
                  </td>
                </tr>

                <tr v-if="status === 'pending'" v-for="n in 5" :key="`skel-${n}`">
                  <td colspan="7" class="px-4 py-4">
                    <div class="h-4 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse w-full" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <CommonPaginationBar
            v-if="data && data.total_pages > 1"
            v-model:page="filters.page"
            v-model:page-size="filters.page_size"
            :total-count="data.count"
            :total-pages="data.total_pages"
          />
        </div>
      </div>

      <!-- Modals -->
      <CasesProceedingFormModal
        v-if="selectedProceeding"
        v-model:open="isEditModalOpen"
        :case-id="selectedProceeding.case"
        :default-court-id="selectedProceeding.court"
        :proceeding-item="selectedProceeding"
        @saved="() => refresh()"
      />

      <CommonConfirmModal
        v-model:open="isDeleteModalOpen"
        title="Delete Proceeding"
        :description="proceedingToDelete ? `Delete court proceeding record for ${proceedingToDelete.proceeding_date}?` : ''"
        confirm-label="Delete Record"
        :loading="isDeleting"
        @confirm="confirmDelete"
      />
    </template>
  </UDashboardPanel>
</template>
