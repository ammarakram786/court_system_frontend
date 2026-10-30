<script setup lang="ts">
import type { Rank, Appointment, RankPayload, AppointmentPayload } from '~/types/legal'
import { ApiError } from '~/utils/api-error'

useHead({ title: 'Ranks & Appointments' })

const {
  useRanksList,
  createRank,
  updateRank,
  deleteRank,
  useAppointmentsList,
  createAppointment,
  updateAppointment,
  deleteAppointment
} = useAppointmentsAndRanks()

const toast = useToast()

const activeTab = ref<'ranks' | 'appointments'>('ranks')

// Ranks
const { data: ranksData, status: ranksStatus, refresh: refreshRanks } = useRanksList({ page_size: 50, ordering: 'seniority_index' })
const isRankModalOpen = ref(false)
const selectedRank = ref<Rank | null>(null)
const rankForm = reactive({ title: '', abbreviation: '', seniority_index: 1 })
const isRankLoading = ref(false)
const rankErrors = ref<string[]>([])

// Rank Delete
const isDeleteRankModalOpen = ref(false)
const rankToDelete = ref<Rank | null>(null)
const isDeletingRank = ref(false)

function openCreateRank() {
  selectedRank.value = null
  rankForm.title = ''
  rankForm.abbreviation = ''
  rankForm.seniority_index = 1
  rankErrors.value = []
  isRankModalOpen.value = true
}

function openEditRank(r: Rank) {
  selectedRank.value = r
  rankForm.title = r.title
  rankForm.abbreviation = r.abbreviation || ''
  rankForm.seniority_index = r.seniority_index
  rankErrors.value = []
  isRankModalOpen.value = true
}

async function submitRank() {
  isRankLoading.value = true
  rankErrors.value = []
  try {
    const payload: RankPayload = {
      title: rankForm.title,
      abbreviation: rankForm.abbreviation || null,
      seniority_index: rankForm.seniority_index
    }
    if (selectedRank.value) {
      await updateRank(selectedRank.value.rank_id, payload)
      toast.add({ title: 'Rank updated', color: 'success' })
    } else {
      await createRank(payload)
      toast.add({ title: 'Rank created', color: 'success' })
    }
    isRankModalOpen.value = false
    refreshRanks()
  } catch (err: any) {
    rankErrors.value = err instanceof ApiError ? err.messages : [err?.message || 'Failed to save rank']
  } finally {
    isRankLoading.value = false
  }
}

function openDeleteRank(r: Rank) {
  rankToDelete.value = r
  isDeleteRankModalOpen.value = true
}

async function confirmDeleteRank() {
  if (!rankToDelete.value) return
  isDeletingRank.value = true
  try {
    await deleteRank(rankToDelete.value.rank_id)
    toast.add({ title: 'Rank deleted', color: 'success' })
    isDeleteRankModalOpen.value = false
    refreshRanks()
  } catch (err: any) {
    toast.add({ title: 'Failed to delete rank', description: err?.message, color: 'error' })
  } finally {
    isDeletingRank.value = false
  }
}

// Appointments
const { data: apptsData, status: apptsStatus, refresh: refreshAppts } = useAppointmentsList({ page_size: 50, ordering: 'title' })
const isApptModalOpen = ref(false)
const selectedAppt = ref<Appointment | null>(null)
const apptForm = reactive({ title: '', appointment_code: '' })
const isApptLoading = ref(false)
const apptErrors = ref<string[]>([])

// Appt Delete
const isDeleteApptModalOpen = ref(false)
const apptToDelete = ref<Appointment | null>(null)
const isDeletingAppt = ref(false)

function openCreateAppt() {
  selectedAppt.value = null
  apptForm.title = ''
  apptForm.appointment_code = ''
  apptErrors.value = []
  isApptModalOpen.value = true
}

function openEditAppt(a: Appointment) {
  selectedAppt.value = a
  apptForm.title = a.title
  apptForm.appointment_code = a.appointment_code || ''
  apptErrors.value = []
  isApptModalOpen.value = true
}

async function submitAppt() {
  isApptLoading.value = true
  apptErrors.value = []
  try {
    const payload: AppointmentPayload = {
      title: apptForm.title,
      appointment_code: apptForm.appointment_code || null
    }
    if (selectedAppt.value) {
      await updateAppointment(selectedAppt.value.appointment_id, payload)
      toast.add({ title: 'Appointment updated', color: 'success' })
    } else {
      await createAppointment(payload)
      toast.add({ title: 'Appointment created', color: 'success' })
    }
    isApptModalOpen.value = false
    refreshAppts()
  } catch (err: any) {
    apptErrors.value = err instanceof ApiError ? err.messages : [err?.message || 'Failed to save appointment']
  } finally {
    isApptLoading.value = false
  }
}

function openDeleteAppt(a: Appointment) {
  apptToDelete.value = a
  isDeleteApptModalOpen.value = true
}

async function confirmDeleteAppt() {
  if (!apptToDelete.value) return
  isDeletingAppt.value = true
  try {
    await deleteAppointment(apptToDelete.value.appointment_id)
    toast.add({ title: 'Appointment deleted', color: 'success' })
    isDeleteApptModalOpen.value = false
    refreshAppts()
  } catch (err: any) {
    toast.add({ title: 'Failed to delete appointment', description: err?.message, color: 'error' })
  } finally {
    isDeletingAppt.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="ranks-appointments">
    <template #header>
      <AppPageHeader title="Ranks & Appointments">
        <template #actions>
          <UButton
            v-if="activeTab === 'ranks'"
            label="Add Rank"
            icon="i-lucide-plus"
            color="primary"
            @click="openCreateRank"
          />
          <UButton
            v-else
            label="Add Appointment"
            icon="i-lucide-plus"
            color="primary"
            @click="openCreateAppt"
          />
        </template>
      </AppPageHeader>
    </template>

    <template #body>
      <div class="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
        <!-- Tab selector -->
        <div class="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-2">
          <button
            type="button"
            class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition"
            :class="activeTab === 'ranks'
              ? 'bg-primary text-inverted shadow-sm'
              : 'text-muted hover:bg-neutral-100 dark:hover:bg-neutral-800'"
            @click="activeTab = 'ranks'"
          >
            <UIcon name="i-lucide-award" class="size-4" />
            <span>Official Ranks</span>
            <span class="px-1.5 py-0.2 rounded-full text-xs font-bold" :class="activeTab === 'ranks' ? 'bg-white/20' : 'bg-neutral-200 dark:bg-neutral-800'">
              {{ ranksData?.count ?? 0 }}
            </span>
          </button>

          <button
            type="button"
            class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition"
            :class="activeTab === 'appointments'
              ? 'bg-primary text-inverted shadow-sm'
              : 'text-muted hover:bg-neutral-100 dark:hover:bg-neutral-800'"
            @click="activeTab = 'appointments'"
          >
            <UIcon name="i-lucide-briefcase" class="size-4" />
            <span>Designations & Appointments</span>
            <span class="px-1.5 py-0.2 rounded-full text-xs font-bold" :class="activeTab === 'appointments' ? 'bg-white/20' : 'bg-neutral-200 dark:bg-neutral-800'">
              {{ apptsData?.count ?? 0 }}
            </span>
          </button>
        </div>

        <!-- TAB 1: RANKS -->
        <div v-if="activeTab === 'ranks'" class="space-y-4">
          <div class="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs sm:text-sm">
                <thead class="bg-neutral-50 dark:bg-neutral-800/50 text-muted uppercase tracking-wider font-semibold border-b border-neutral-200 dark:border-neutral-800">
                  <tr>
                    <th class="px-4 py-3">Rank Title</th>
                    <th class="px-4 py-3">Abbreviation</th>
                    <th class="px-4 py-3">Seniority Index</th>
                    <th class="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
                  <tr
                    v-for="r in ranksData?.results || []"
                    :key="r.rank_id"
                    class="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40 transition"
                  >
                    <td class="px-4 py-3.5 font-bold text-highlighted">
                      {{ r.title }}
                    </td>
                    <td class="px-4 py-3.5 font-mono text-xs text-muted">
                      {{ r.abbreviation || '—' }}
                    </td>
                    <td class="px-4 py-3.5">
                      <UBadge :label="`Index ${r.seniority_index}`" size="xs" variant="outline" color="neutral" />
                    </td>
                    <td class="px-4 py-3.5 text-right whitespace-nowrap">
                      <div class="flex items-center justify-end gap-1">
                        <UButton
                          icon="i-lucide-pencil"
                          size="xs"
                          variant="ghost"
                          color="neutral"
                          @click="openEditRank(r)"
                        />
                        <UButton
                          icon="i-lucide-trash-2"
                          size="xs"
                          variant="ghost"
                          color="error"
                          @click="openDeleteRank(r)"
                        />
                      </div>
                    </td>
                  </tr>

                  <tr v-if="!ranksData?.results?.length">
                    <td colspan="4" class="p-8">
                      <CommonEmptyState
                        icon="i-lucide-award"
                        title="No ranks configured"
                        action-label="Add Rank"
                        @action="openCreateRank"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- TAB 2: APPOINTMENTS -->
        <div v-if="activeTab === 'appointments'" class="space-y-4">
          <div class="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs sm:text-sm">
                <thead class="bg-neutral-50 dark:bg-neutral-800/50 text-muted uppercase tracking-wider font-semibold border-b border-neutral-200 dark:border-neutral-800">
                  <tr>
                    <th class="px-4 py-3">Appointment Title</th>
                    <th class="px-4 py-3">Appointment Code</th>
                    <th class="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
                  <tr
                    v-for="a in apptsData?.results || []"
                    :key="a.appointment_id"
                    class="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40 transition"
                  >
                    <td class="px-4 py-3.5 font-bold text-highlighted">
                      {{ a.title }}
                    </td>
                    <td class="px-4 py-3.5 font-mono text-xs text-muted">
                      {{ a.appointment_code || '—' }}
                    </td>
                    <td class="px-4 py-3.5 text-right whitespace-nowrap">
                      <div class="flex items-center justify-end gap-1">
                        <UButton
                          icon="i-lucide-pencil"
                          size="xs"
                          variant="ghost"
                          color="neutral"
                          @click="openEditAppt(a)"
                        />
                        <UButton
                          icon="i-lucide-trash-2"
                          size="xs"
                          variant="ghost"
                          color="error"
                          @click="openDeleteAppt(a)"
                        />
                      </div>
                    </td>
                  </tr>

                  <tr v-if="!apptsData?.results?.length">
                    <td colspan="3" class="p-8">
                      <CommonEmptyState
                        icon="i-lucide-briefcase"
                        title="No appointments configured"
                        action-label="Add Appointment"
                        @action="openCreateAppt"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Rank Modal -->
      <UModal
        v-model:open="isRankModalOpen"
        :title="selectedRank ? 'Edit Rank' : 'New Rank'"
        description="Configure rank title and seniority index"
      >
        <template #body>
          <form class="space-y-4" @submit.prevent="submitRank">
            <AppFormErrors :messages="rankErrors" />
            <UFormField label="Rank Title" required>
              <UInput v-model="rankForm.title" placeholder="e.g. Major, Lieutenant Colonel, Registrar" class="w-full" />
            </UFormField>
            <div class="grid grid-cols-2 gap-4">
              <UFormField label="Abbreviation">
                <UInput v-model="rankForm.abbreviation" placeholder="e.g. Maj, Lt Col" class="w-full" />
              </UFormField>
              <UFormField label="Seniority Index" required>
                <UInput v-model.number="rankForm.seniority_index" type="number" class="w-full" />
              </UFormField>
            </div>
            <div class="flex items-center justify-end gap-2 pt-3">
              <UButton label="Cancel" variant="ghost" color="neutral" @click="isRankModalOpen = false" />
              <UButton type="submit" :label="selectedRank ? 'Save Changes' : 'Create Rank'" color="primary" :loading="isRankLoading" />
            </div>
          </form>
        </template>
      </UModal>

      <!-- Appt Modal -->
      <UModal
        v-model:open="isApptModalOpen"
        :title="selectedAppt ? 'Edit Appointment' : 'New Appointment'"
        description="Configure official designation / assignment"
      >
        <template #body>
          <form class="space-y-4" @submit.prevent="submitAppt">
            <AppFormErrors :messages="apptErrors" />
            <UFormField label="Appointment Title" required>
              <UInput v-model="apptForm.title" placeholder="e.g. Staff Officer Legal, Judge Advocate" class="w-full" />
            </UFormField>
            <UFormField label="Appointment Code">
              <UInput v-model="apptForm.appointment_code" placeholder="e.g. SO-LGL, DJAG" class="w-full" />
            </UFormField>
            <div class="flex items-center justify-end gap-2 pt-3">
              <UButton label="Cancel" variant="ghost" color="neutral" @click="isApptModalOpen = false" />
              <UButton type="submit" :label="selectedAppt ? 'Save Changes' : 'Create Appointment'" color="primary" :loading="isApptLoading" />
            </div>
          </form>
        </template>
      </UModal>

      <!-- Delete Confirmations -->
      <CommonConfirmModal
        v-model:open="isDeleteRankModalOpen"
        title="Delete Rank"
        :description="rankToDelete ? `Delete rank ${rankToDelete.title}?` : ''"
        confirm-label="Delete Rank"
        :loading="isDeletingRank"
        @confirm="confirmDeleteRank"
      />

      <CommonConfirmModal
        v-model:open="isDeleteApptModalOpen"
        title="Delete Appointment"
        :description="apptToDelete ? `Delete appointment ${apptToDelete.title}?` : ''"
        confirm-label="Delete Appointment"
        :loading="isDeletingAppt"
        @confirm="confirmDeleteAppt"
      />
    </template>
  </UDashboardPanel>
</template>
