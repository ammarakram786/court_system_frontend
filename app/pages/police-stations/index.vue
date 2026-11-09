<script setup lang="ts">
import type { PoliceStation } from '~/types/legal'

useHead({ title: 'Police Stations' })

const { usePoliceStationsList, deletePoliceStation } = usePoliceStations()
const toast = useToast()

const filters = reactive({
  search: '',
  district: '',
  page: 1,
  page_size: 12,
  ordering: 'name'
})

const { data, status, refresh } = usePoliceStationsList(filters)

// Modals
const isModalOpen = ref(false)
const selectedStation = ref<PoliceStation | null>(null)

const isDeleteModalOpen = ref(false)
const stationToDelete = ref<PoliceStation | null>(null)
const isDeleting = ref(false)

function openCreate() {
  selectedStation.value = null
  isModalOpen.value = true
}

function openEdit(st: PoliceStation) {
  selectedStation.value = st
  isModalOpen.value = true
}

function openDelete(st: PoliceStation) {
  stationToDelete.value = st
  isDeleteModalOpen.value = true
}

async function confirmDelete() {
  if (!stationToDelete.value) return
  isDeleting.value = true
  try {
    await deletePoliceStation(stationToDelete.value.police_station_id)
    toast.add({ title: 'Police station deleted', color: 'success' })
    isDeleteModalOpen.value = false
    refresh()
  } catch (err: any) {
    toast.add({ title: 'Failed to delete station', description: err?.message, color: 'error' })
  } finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="police-stations">
    <template #header>
      <AppPageHeader title="Police Stations Directory">
        <template #actions>
          <UButton
            label="Add Police Station"
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
          <div class="flex items-center gap-3 w-full sm:max-w-lg">
            <UInput
              v-model="filters.search"
              placeholder="Search station name, code..."
              icon="i-lucide-search"
              class="w-full"
              @update:model-value="filters.page = 1"
            />
            <UInput
              v-model="filters.district"
              placeholder="District"
              class="w-48"
              @update:model-value="filters.page = 1"
            />
          </div>

          <div class="text-xs text-muted">
            Total stations: <strong class="text-highlighted">{{ data?.count ?? 0 }}</strong>
          </div>
        </div>

        <!-- Police Stations Table -->
        <div class="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs sm:text-sm">
              <thead class="bg-neutral-50 dark:bg-neutral-800/50 text-muted uppercase tracking-wider font-semibold border-b border-neutral-200 dark:border-neutral-800">
                <tr>
                  <th class="px-4 py-3">Station Name</th>
                  <th class="px-4 py-3">District</th>
                  <th class="px-4 py-3">Code</th>
                  <th class="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
                <tr
                  v-for="st in data?.results || []"
                  :key="st.police_station_id"
                  class="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40 transition"
                >
                  <td class="px-4 py-3.5 font-bold text-highlighted">
                    {{ st.name }}
                  </td>

                  <td class="px-4 py-3.5 font-medium text-muted">
                    {{ st.district }}
                  </td>

                  <td class="px-4 py-3.5 font-mono text-xs">
                    {{ st.code || '—' }}
                  </td>

                  <td class="px-4 py-3.5 text-right whitespace-nowrap">
                    <div class="flex items-center justify-end gap-1">
                      <UButton
                        icon="i-lucide-pencil"
                        size="xs"
                        variant="ghost"
                        color="neutral"
                        @click="openEdit(st)"
                      />
                      <UButton
                        icon="i-lucide-trash-2"
                        size="xs"
                        variant="ghost"
                        color="error"
                        @click="openDelete(st)"
                      />
                    </div>
                  </td>
                </tr>

                <tr v-if="!data?.results?.length && status !== 'pending'">
                  <td colspan="4" class="p-8">
                    <CommonEmptyState
                      icon="i-lucide-shield-alert"
                      title="No police stations found"
                      description="Add police stations for FIR registration mapping."
                      action-label="Add Police Station"
                      @action="openCreate"
                    />
                  </td>
                </tr>

                <tr v-if="status === 'pending'" v-for="n in 3" :key="`skel-${n}`">
                  <td colspan="4" class="px-4 py-4">
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
      <PoliceStationModal
        v-model:open="isModalOpen"
        :station="selectedStation"
        @saved="() => refresh()"
      />

      <CommonConfirmModal
        v-model:open="isDeleteModalOpen"
        title="Delete Police Station"
        :description="stationToDelete ? `Are you sure you want to delete ${stationToDelete.name}?` : ''"
        confirm-label="Delete Station"
        :loading="isDeleting"
        @confirm="confirmDelete"
      />
    </template>
  </UDashboardPanel>
</template>
