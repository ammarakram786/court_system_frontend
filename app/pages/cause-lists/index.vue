<script setup lang="ts">
import type { CauseList, CauseListFilters } from '~/types/legal'

useHead({ title: 'Daily Cause Lists' })

const { useCauseListsList, useTodayCauseList, deleteCauseList } = useCauseLists()
const refData = useReferenceData()
const toast = useToast()

const filters = reactive<CauseListFilters>({
  search: '',
  court: undefined,
  cause_list_date: undefined,
  day_of_week: undefined,
  page: 1,
  page_size: 10,
  ordering: '-cause_list_date'
})

const { data, status, refresh } = useCauseListsList(filters)
const { data: todayList, refresh: refreshToday } = useTodayCauseList()
const courtOptions = ref<{ label: string, value: string }[]>([])

const dayOptions = [
  { label: 'All Days', value: '' },
  { label: 'Monday', value: 'Monday' },
  { label: 'Tuesday', value: 'Tuesday' },
  { label: 'Wednesday', value: 'Wednesday' },
  { label: 'Thursday', value: 'Thursday' },
  { label: 'Friday', value: 'Friday' },
  { label: 'Saturday', value: 'Saturday' },
  { label: 'Sunday', value: 'Sunday' }
]

onMounted(async () => {
  const courts = await refData.loadCourtOptions()
  courtOptions.value = [{ label: 'All Courts', value: '' }, ...courts]
})

// Modals
const isFormModalOpen = ref(false)
const selectedListForEdit = ref<CauseList | null>(null)

const isDeleteModalOpen = ref(false)
const listToDelete = ref<CauseList | null>(null)
const isDeleting = ref(false)

function openCreate() {
  selectedListForEdit.value = null
  isFormModalOpen.value = true
}

function openEdit(cl: CauseList) {
  selectedListForEdit.value = cl
  isFormModalOpen.value = true
}

function openDelete(cl: CauseList) {
  listToDelete.value = cl
  isDeleteModalOpen.value = true
}

async function confirmDelete() {
  if (!listToDelete.value) return
  isDeleting.value = true
  try {
    await deleteCauseList(listToDelete.value.cause_list_id)
    toast.add({ title: 'Cause List removed', color: 'success' })
    isDeleteModalOpen.value = false
    refresh()
    refreshToday()
  } catch (err: any) {
    toast.add({ title: 'Failed to delete cause list', description: err?.message, color: 'error' })
  } finally {
    isDeleting.value = false
  }
}

function resetFilters() {
  filters.search = ''
  filters.court = undefined
  filters.cause_list_date = undefined
  filters.day_of_week = undefined
  filters.page = 1
}
</script>

<template>
  <UDashboardPanel id="cause-lists">
    <template #header>
      <AppPageHeader title="Daily Court Cause Lists">
        <template #actions>
          <UButton
            label="Create Cause List"
            icon="i-lucide-plus"
            color="primary"
            @click="openCreate"
          />
        </template>
      </AppPageHeader>
    </template>

    <template #body>
      <div class="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
        <!-- Today's Cause List Spotlight Banner -->
        <div v-if="todayList" class="p-5 rounded-2xl border border-primary-200 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="size-12 rounded-xl bg-primary text-inverted flex items-center justify-center shrink-0">
              <UIcon name="i-lucide-calendar-check" class="size-6" />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold uppercase tracking-wider text-primary">Today's Active Roster</span>
                <UBadge :label="todayList.day_of_week" size="xs" color="primary" />
              </div>
              <h3 class="text-base sm:text-lg font-bold text-highlighted mt-0.5">
                {{ todayList.court_details?.court_name }}
              </h3>
              <p class="text-xs text-muted">
                {{ todayList.cause_list_date }} · {{ todayList.court_details?.presiding_officer }} ({{ todayList.items?.length || 0 }} cases on roster)
              </p>
            </div>
          </div>

          <UButton
            :to="`/cause-lists/${todayList.cause_list_id}`"
            label="Open Today's Roster"
            icon="i-lucide-list-ordered"
            color="primary"
          />
        </div>

        <!-- Filter controls -->
        <div class="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <UInput
              v-model="filters.search"
              placeholder="Search court, date..."
              icon="i-lucide-search"
              class="w-full"
              @update:model-value="filters.page = 1"
            />

            <AppSelect
              v-model="filters.court"
              :items="courtOptions"
              value-key="value"
              label-key="label"
              placeholder="Filter by Court"
              class="w-full"
              @update:model-value="filters.page = 1"
            />

            <UInput
              v-model="filters.cause_list_date"
              type="date"
              placeholder="Filter Date"
              class="w-full"
              @update:model-value="filters.page = 1"
            />

            <AppSelect
              v-model="filters.day_of_week"
              :items="dayOptions"
              value-key="value"
              label-key="label"
              placeholder="Filter by Day"
              class="w-full"
              @update:model-value="filters.page = 1"
            />
          </div>

          <div class="flex items-center justify-between text-xs text-muted pt-1">
            <span>
              Total Cause Lists: <strong class="text-highlighted">{{ data?.count ?? 0 }}</strong>
            </span>
            <button
              v-if="filters.search || filters.court || filters.cause_list_date || filters.day_of_week"
              type="button"
              class="text-primary hover:underline flex items-center gap-1"
              @click="resetFilters"
            >
              <UIcon name="i-lucide-rotate-ccw" class="size-3" />
              Reset Filters
            </button>
          </div>
        </div>

        <!-- Cause Lists Table -->
        <div class="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs sm:text-sm">
              <thead class="bg-neutral-50 dark:bg-neutral-800/50 text-muted uppercase tracking-wider font-semibold border-b border-neutral-200 dark:border-neutral-800">
                <tr>
                  <th class="px-4 py-3">Roster Date</th>
                  <th class="px-4 py-3">Day</th>
                  <th class="px-4 py-3">Court Bench</th>
                  <th class="px-4 py-3">Presiding Judge</th>
                  <th class="px-4 py-3">Scheduled Cases</th>
                  <th class="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
                <tr
                  v-for="cl in data?.results || []"
                  :key="cl.cause_list_id"
                  class="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40 transition"
                >
                  <td class="px-4 py-3.5 font-bold text-primary">
                    <NuxtLink :to="`/cause-lists/${cl.cause_list_id}`" class="hover:underline">
                      {{ cl.cause_list_date }}
                    </NuxtLink>
                  </td>

                  <td class="px-4 py-3.5 font-medium text-highlighted">
                    {{ cl.day_of_week }}
                  </td>

                  <td class="px-4 py-3.5">
                    <span class="font-medium text-highlighted block">
                      {{ cl.court_details?.court_name }}
                    </span>
                    <span class="text-[11px] text-muted block">
                      {{ cl.court_details?.district }} (Room {{ cl.court_details?.court_room_no || 'N/A' }})
                    </span>
                  </td>

                  <td class="px-4 py-3.5 text-muted">
                    {{ cl.court_details?.presiding_officer }}
                  </td>

                  <td class="px-4 py-3.5">
                    <UBadge
                      :label="`${cl.items?.length || 0} cases`"
                      size="xs"
                      :color="(cl.items?.length || 0) > 0 ? 'primary' : 'neutral'"
                      variant="subtle"
                    />
                  </td>

                  <td class="px-4 py-3.5 text-right whitespace-nowrap">
                    <div class="flex items-center justify-end gap-1">
                      <UButton
                        :to="`/cause-lists/${cl.cause_list_id}`"
                        label="View Roster"
                        size="xs"
                        variant="ghost"
                        trailing-icon="i-lucide-chevron-right"
                      />
                      <UButton
                        icon="i-lucide-pencil"
                        size="xs"
                        variant="ghost"
                        color="neutral"
                        @click="openEdit(cl)"
                      />
                      <UButton
                        icon="i-lucide-trash-2"
                        size="xs"
                        variant="ghost"
                        color="error"
                        @click="openDelete(cl)"
                      />
                    </div>
                  </td>
                </tr>

                <tr v-if="!data?.results?.length && status !== 'pending'">
                  <td colspan="6" class="p-8">
                    <CommonEmptyState
                      icon="i-lucide-calendar-days"
                      title="No cause lists found"
                      description="Create daily court cause lists to schedule hearings."
                      action-label="Create Cause List"
                      @action="openCreate"
                    />
                  </td>
                </tr>

                <tr v-if="status === 'pending'" v-for="n in 4" :key="`skel-${n}`">
                  <td colspan="6" class="px-4 py-4">
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
      <CauselistCauseListFormModal
        v-model:open="isFormModalOpen"
        :cause-list-item="selectedListForEdit"
        @saved="() => refresh()"
      />

      <CommonConfirmModal
        v-model:open="isDeleteModalOpen"
        title="Delete Cause List"
        :description="listToDelete ? `Are you sure you want to delete the cause list for ${listToDelete.cause_list_date}?` : ''"
        confirm-label="Delete List"
        :loading="isDeleting"
        @confirm="confirmDelete"
      />
    </template>
  </UDashboardPanel>
</template>
