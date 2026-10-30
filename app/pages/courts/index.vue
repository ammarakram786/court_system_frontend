<script setup lang="ts">
import type { Court, CourtFilters } from '~/types/legal'

useHead({ title: 'Courts Directory' })

const { useCourtsList, deleteCourt, patchCourt } = useCourts()
const toast = useToast()

const filters = reactive<CourtFilters>({
  search: '',
  district: undefined,
  is_active: undefined,
  page: 1,
  page_size: 10,
  ordering: 'court_name'
})

const { data, status, refresh } = useCourtsList(filters)

// Modals
const isModalOpen = ref(false)
const selectedCourt = ref<Court | null>(null)

const isDeleteModalOpen = ref(false)
const courtToDelete = ref<Court | null>(null)
const isDeleting = ref(false)

function openCreate() {
  selectedCourt.value = null
  isModalOpen.value = true
}

function openEdit(c: Court) {
  selectedCourt.value = c
  isModalOpen.value = true
}

function openDelete(c: Court) {
  courtToDelete.value = c
  isDeleteModalOpen.value = true
}

async function confirmDelete() {
  if (!courtToDelete.value) return
  isDeleting.value = true
  try {
    await deleteCourt(courtToDelete.value.court_id)
    toast.add({ title: 'Court deleted', color: 'success' })
    isDeleteModalOpen.value = false
    refresh()
  } catch (err: any) {
    toast.add({ title: 'Failed to delete court', description: err?.message, color: 'error' })
  } finally {
    isDeleting.value = false
  }
}

async function toggleActive(court: Court) {
  try {
    await patchCourt(court.court_id, { is_active: !court.is_active })
    toast.add({
      title: court.is_active ? 'Court deactivated' : 'Court activated',
      color: 'success'
    })
    refresh()
  } catch (err: any) {
    toast.add({ title: 'Failed to update status', description: err?.message, color: 'error' })
  }
}
</script>

<template>
  <UDashboardPanel id="courts">
    <template #header>
      <AppPageHeader title="Courts & Judicial Benches">
        <template #actions>
          <UButton
            label="Add Court"
            icon="i-lucide-plus"
            color="primary"
            @click="openCreate"
          />
        </template>
      </AppPageHeader>
    </template>

    <template #body>
      <div class="p-4 sm:p-6 space-y-4 max-w-7xl mx-auto w-full">
        <!-- Filter bar -->
        <div class="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div class="flex-1 w-full sm:max-w-md">
            <UInput
              v-model="filters.search"
              placeholder="Search court name, judge, district..."
              icon="i-lucide-search"
              class="w-full"
              @update:model-value="filters.page = 1"
            />
          </div>

          <div class="text-xs text-muted">
            Total courts registered: <strong class="text-highlighted">{{ data?.count ?? 0 }}</strong>
          </div>
        </div>

        <!-- Courts Table -->
        <div class="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs sm:text-sm">
              <thead class="bg-neutral-50 dark:bg-neutral-800/50 text-muted uppercase tracking-wider font-semibold border-b border-neutral-200 dark:border-neutral-800">
                <tr>
                  <th class="px-4 py-3">Court Name</th>
                  <th class="px-4 py-3">District</th>
                  <th class="px-4 py-3">Presiding Officer</th>
                  <th class="px-4 py-3">Designation</th>
                  <th class="px-4 py-3">Room #</th>
                  <th class="px-4 py-3">Status</th>
                  <th class="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
                <tr
                  v-for="c in data?.results || []"
                  :key="c.court_id"
                  class="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40 transition"
                >
                  <td class="px-4 py-3.5 font-bold text-highlighted">
                    {{ c.court_name }}
                  </td>

                  <td class="px-4 py-3.5 font-medium text-muted">
                    {{ c.district }}
                  </td>

                  <td class="px-4 py-3.5 font-semibold text-highlighted">
                    {{ c.presiding_officer }}
                  </td>

                  <td class="px-4 py-3.5 text-muted">
                    {{ c.designation }}
                  </td>

                  <td class="px-4 py-3.5 font-mono text-xs">
                    {{ c.court_room_no || '—' }}
                  </td>

                  <td class="px-4 py-3.5">
                    <button
                      type="button"
                      class="inline-flex items-center gap-1.5 cursor-pointer"
                      @click="toggleActive(c)"
                    >
                      <UBadge
                        :label="c.is_active ? 'Active' : 'Inactive'"
                        :color="c.is_active ? 'success' : 'neutral'"
                        size="xs"
                        variant="subtle"
                      />
                    </button>
                  </td>

                  <td class="px-4 py-3.5 text-right whitespace-nowrap">
                    <div class="flex items-center justify-end gap-1">
                      <UButton
                        icon="i-lucide-pencil"
                        size="xs"
                        variant="ghost"
                        color="neutral"
                        @click="openEdit(c)"
                      />
                      <UButton
                        icon="i-lucide-trash-2"
                        size="xs"
                        variant="ghost"
                        color="error"
                        @click="openDelete(c)"
                      />
                    </div>
                  </td>
                </tr>

                <tr v-if="!data?.results?.length && status !== 'pending'">
                  <td colspan="7" class="p-8">
                    <CommonEmptyState
                      icon="i-lucide-landmark"
                      title="No courts recorded"
                      description="Add judicial courts and magistrates to start managing schedules."
                      action-label="Add Court"
                      @action="openCreate"
                    />
                  </td>
                </tr>

                <tr v-if="status === 'pending'" v-for="n in 4" :key="`skel-${n}`">
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
      <CourtsCourtModal
        v-model:open="isModalOpen"
        :court-item="selectedCourt"
        @saved="() => refresh()"
      />

      <CommonConfirmModal
        v-model:open="isDeleteModalOpen"
        title="Delete Court"
        :description="courtToDelete ? `Are you sure you want to delete ${courtToDelete.court_name}?` : ''"
        confirm-label="Delete Court"
        :loading="isDeleting"
        @confirm="confirmDelete"
      />
    </template>
  </UDashboardPanel>
</template>
