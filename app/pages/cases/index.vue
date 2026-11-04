<script setup lang="ts">
import type { Case, CaseFilters, StatusEnum } from '~/types/legal'
import type { DropdownMenuItem } from '@nuxt/ui'

useHead({ title: 'Cases Docket' })

const { useCasesList, deleteCase } = useCases()
const refData = useReferenceData()
const toast = useToast()

// Reactive filter parameters
const filters = reactive<CaseFilters>({
  search: '',
  status: undefined,
  court: undefined,
  category: undefined,
  page: 1,
  page_size: 10,
  ordering: '-created_at'
})

// SSR-safe query
const { data, status, refresh } = useCasesList(filters)

// Lookup options for filter dropdowns
const courtOptions = ref<{ label: string, value: string }[]>([])
const categoryOptions = ref<{ label: string, value: string }[]>([])

const statusOptions = [
  { label: 'All Statuses', value: '' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Decided', value: 'DECIDED' },
  { label: 'Disposed', value: 'DISPOSED' },
  { label: 'Transferred', value: 'TRANSFERRED' },
  { label: 'Consigned', value: 'CONSIGNED' }
]

onMounted(async () => {
  const [courts, cats] = await Promise.all([
    refData.loadCourtOptions(),
    refData.loadCategoryOptions()
  ])
  courtOptions.value = [{ label: 'All Courts', value: '' }, ...courts]
  categoryOptions.value = [{ label: 'All Categories', value: '' }, ...cats]
})

// Modal states
const isFormModalOpen = ref(false)
const selectedCaseForEdit = ref<Case | null>(null)

const isCloseModalOpen = ref(false)
const selectedCaseForClose = ref<Case | null>(null)

const isMarkModalOpen = ref(false)
const selectedCaseForMark = ref<Case | null>(null)

const isMarkBackModalOpen = ref(false)
const selectedCaseForMarkBack = ref<Case | null>(null)

const isDeleteModalOpen = ref(false)
const selectedCaseForDelete = ref<Case | null>(null)
const isDeleting = ref(false)

function openCreateModal() {
  selectedCaseForEdit.value = null
  isFormModalOpen.value = true
}

function openEditModal(c: Case) {
  selectedCaseForEdit.value = c
  isFormModalOpen.value = true
}

function openCloseModal(c: Case) {
  selectedCaseForClose.value = c
  isCloseModalOpen.value = true
}

function openMarkModal(c: Case) {
  selectedCaseForMark.value = c
  isMarkModalOpen.value = true
}

function openMarkBackModal(c: Case) {
  selectedCaseForMarkBack.value = c
  isMarkBackModalOpen.value = true
}

function openDeleteModal(c: Case) {
  selectedCaseForDelete.value = c
  isDeleteModalOpen.value = true
}

async function confirmDelete() {
  if (!selectedCaseForDelete.value) return
  isDeleting.value = true
  try {
    await deleteCase(selectedCaseForDelete.value.case_id)
    toast.add({ title: 'Case deleted', color: 'success' })
    isDeleteModalOpen.value = false
    refresh()
  } catch (err: any) {
    toast.add({ title: 'Failed to delete case', description: err?.message, color: 'error' })
  } finally {
    isDeleting.value = false
  }
}

function resetFilters() {
  filters.search = ''
  filters.status = undefined
  filters.court = undefined
  filters.category = undefined
  filters.page = 1
}

function onSearchInput(val: string) {
  filters.search = val
  filters.page = 1
}

function getCaseActions(c: Case): DropdownMenuItem[][] {
  const groups: DropdownMenuItem[][] = [
    [
      {
        label: 'View Docket Details',
        icon: 'i-lucide-external-link',
        to: `/cases/${c.case_id}`
      }
    ]
  ]

  const markingGroup: DropdownMenuItem[] = []
  if (c.can_mark) {
    markingGroup.push({
      label: 'Mark To Officer',
      icon: 'i-lucide-arrow-right-circle',
      onSelect: () => openMarkModal(c)
    })
  }
  if (c.can_mark_back) {
    markingGroup.push({
      label: `Mark Back to ${c.marked_by_details?.name || 'Sender'}`,
      icon: 'i-lucide-undo-2',
      color: 'warning' as const,
      onSelect: () => openMarkBackModal(c)
    })
  }
  if (markingGroup.length) groups.push(markingGroup)

  if (c.can_work) {
    const workGroup: DropdownMenuItem[] = [
      {
        label: 'Edit Case Details',
        icon: 'i-lucide-pencil',
        onSelect: () => openEditModal(c)
      }
    ]
    if (c.status !== 'DECIDED' && c.status !== 'DISPOSED') {
      workGroup.push({
        label: 'Close / Decide Case',
        icon: 'i-lucide-check-circle',
        color: 'warning' as const,
        onSelect: () => openCloseModal(c)
      })
    }
    groups.push(workGroup)

    groups.push([
      {
        label: 'Delete Case',
        icon: 'i-lucide-trash-2',
        color: 'error' as const,
        onSelect: () => openDeleteModal(c)
      }
    ])
  }

  return groups
}
</script>

<template>
  <UDashboardPanel id="cases-list">
    <template #header>
      <AppPageHeader title="Case Management">
        <template #actions>
          <UButton
            label="Register Case"
            icon="i-lucide-plus"
            color="primary"
            @click="openCreateModal"
          />
        </template>
      </AppPageHeader>
    </template>

    <template #body>
      <div class="p-4 sm:p-6 space-y-4 max-w-7xl mx-auto w-full">
        <!-- Search and Filters Bar -->
        <div class="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <UInput
              :model-value="filters.search"
              placeholder="Search case #, title..."
              icon="i-lucide-search"
              class="w-full"
              @update:model-value="onSearchInput"
            />

            <USelect
              v-model="filters.status"
              :items="statusOptions"
              value-key="value"
              label-key="label"
              placeholder="Filter by Status"
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
              v-model="filters.category"
              :items="categoryOptions"
              value-key="value"
              label-key="label"
              placeholder="Filter by Category"
              class="w-full"
              @update:model-value="filters.page = 1"
            />
          </div>

          <div class="flex items-center justify-between text-xs text-muted pt-1">
            <span>
              Total records: <strong class="text-highlighted">{{ data?.count ?? 0 }}</strong>
            </span>
            <button
              v-if="filters.search || filters.status || filters.court || filters.category"
              type="button"
              class="text-primary hover:underline flex items-center gap-1"
              @click="resetFilters"
            >
              <UIcon name="i-lucide-rotate-ccw" class="size-3" />
              Reset Filters
            </button>
          </div>
        </div>

        <!-- Cases Table -->
        <div class="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs sm:text-sm">
              <thead class="bg-neutral-50 dark:bg-neutral-800/50 text-muted uppercase tracking-wider font-semibold border-b border-neutral-200 dark:border-neutral-800">
                <tr>
                  <th class="px-4 py-3">Case Number</th>
                  <th class="px-4 py-3">Case Title</th>
                  <th class="px-4 py-3">Court & District</th>
                  <th class="px-4 py-3">Category</th>
                  <th class="px-4 py-3">Managing Unit</th>
                  <th class="px-4 py-3">Status</th>
                  <th class="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
                <tr
                  v-for="c in data?.results || []"
                  :key="c.case_id"
                  class="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40 transition"
                >
                  <td class="px-4 py-3.5">
                    <NuxtLink :to="`/cases/${c.case_id}`" class="font-bold text-primary hover:underline block">
                      {{ c.case_number }}
                    </NuxtLink>
                    <span class="text-[11px] text-muted block mt-0.5">
                      Inst: {{ c.institution_date }}
                    </span>
                  </td>

                  <td class="px-4 py-3.5 max-w-xs sm:max-w-sm">
                    <p class="font-medium text-highlighted line-clamp-2">
                      {{ c.case_title }}
                    </p>
                    <span v-if="c.fir_number" class="text-[11px] text-muted block mt-0.5">
                      FIR: {{ c.fir_number }}/{{ c.fir_year }}
                    </span>
                  </td>

                  <td class="px-4 py-3.5">
                    <span class="font-medium text-highlighted block">
                      {{ c.court_details?.court_name || '—' }}
                    </span>
                    <span class="text-[11px] text-muted block">
                      {{ c.court_details?.district }} (Room: {{ c.court_details?.court_room_no || 'N/A' }})
                    </span>
                  </td>

                  <td class="px-4 py-3.5">
                    <span class="font-medium text-highlighted block">
                      {{ c.category_details?.name }}
                    </span>
                    <CommonStatusBadge :value="c.category_details?.nature" size="xs" />
                  </td>

                  <td class="px-4 py-3.5">
                    <span class="font-medium text-highlighted block">
                      {{ c.managing_organization_details?.name || '—' }}
                    </span>
                    <span v-if="c.assigned_case_officer_details" class="text-[11px] text-muted block">
                      Officer: {{ c.assigned_case_officer_details.name }}
                    </span>
                    <div class="mt-1 flex flex-wrap items-center gap-1">
                      <CasesCaseAccessBadge :value="c.work_access_type" size="xs" />
                      <span
                        v-if="c.marked_by_details"
                        class="text-[10px] text-muted"
                        :title="`Marked by ${c.marked_by_details.name}`"
                      >
                        (from {{ c.marked_by_details.name }})
                      </span>
                    </div>
                  </td>

                  <td class="px-4 py-3.5">
                    <CommonStatusBadge :value="c.status" />
                  </td>

                  <td class="px-4 py-3.5 text-right">
                    <div class="flex items-center justify-end gap-1">
                      <UButton
                        :to="`/cases/${c.case_id}`"
                        label="View"
                        size="xs"
                        variant="ghost"
                      />

                      <UDropdownMenu :items="getCaseActions(c)">
                        <UButton
                          icon="i-lucide-more-vertical"
                          size="xs"
                          color="neutral"
                          variant="ghost"
                        />
                      </UDropdownMenu>
                    </div>
                  </td>
                </tr>

                <!-- Empty state row -->
                <tr v-if="!data?.results?.length && status !== 'pending'">
                  <td colspan="7" class="p-8">
                    <CommonEmptyState
                      title="No cases match your criteria"
                      description="Try adjusting your search query, status, or court filters."
                      action-label="Register New Case"
                      @action="openCreateModal"
                    />
                  </td>
                </tr>

                <!-- Loading skeleton rows -->
                <tr v-if="status === 'pending'" v-for="n in 5" :key="`skel-${n}`">
                  <td colspan="7" class="px-4 py-4">
                    <div class="h-4 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse w-full" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
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
      <CasesCaseFormModal
        v-model:open="isFormModalOpen"
        :case-item="selectedCaseForEdit"
        @saved="() => refresh()"
      />

      <CasesCaseCloseModal
        v-model:open="isCloseModalOpen"
        :case-item="selectedCaseForClose"
        @closed="() => refresh()"
      />

      <CasesCaseMarkModal
        v-model:open="isMarkModalOpen"
        :case-item="selectedCaseForMark"
        @marked="() => refresh()"
      />

      <CasesCaseMarkBackModal
        v-model:open="isMarkBackModalOpen"
        :case-item="selectedCaseForMarkBack"
        @marked-back="() => refresh()"
      />

      <CommonConfirmModal
        v-model:open="isDeleteModalOpen"
        title="Delete Case"
        :description="selectedCaseForDelete ? `Are you sure you want to delete case ${selectedCaseForDelete.case_number}? All proceedings and parties will also be removed.` : ''"
        confirm-label="Delete Case"
        :loading="isDeleting"
        @confirm="confirmDelete"
      />
    </template>
  </UDashboardPanel>
</template>
