<script setup lang="ts">
import type { CauseList, CauseListItem } from '~/types/legal'

const route = useRoute()
const listId = computed(() => route.params.id as string)

const { useCauseListDetail, deleteCauseListItem } = useCauseLists()
const toast = useToast()

const { data: causeList, status, refresh } = useCauseListDetail(listId)

useHead({
  title: computed(() => causeList.value ? `${causeList.value.cause_list_date} · Cause List Roster` : 'Cause List Roster')
})

// Modals
const isItemModalOpen = ref(false)
const selectedItem = ref<CauseListItem | null>(null)

const isDeleteItemModalOpen = ref(false)
const itemToDelete = ref<CauseListItem | null>(null)
const isDeletingItem = ref(false)

function openAddItem() {
  selectedItem.value = null
  isItemModalOpen.value = true
}

function openEditItem(item: CauseListItem) {
  selectedItem.value = item
  isItemModalOpen.value = true
}

function openDeleteItem(item: CauseListItem) {
  itemToDelete.value = item
  isDeleteItemModalOpen.value = true
}

async function confirmDeleteItem() {
  if (!itemToDelete.value) return
  isDeletingItem.value = true
  try {
    await deleteCauseListItem(itemToDelete.value.item_id)
    toast.add({ title: 'Item removed from cause list', color: 'success' })
    isDeleteItemModalOpen.value = false
    refresh()
  } catch (err: any) {
    toast.add({ title: 'Failed to remove item', description: err?.message, color: 'error' })
  } finally {
    isDeletingItem.value = false
  }
}

// Sorted roster items
const sortedItems = computed(() => {
  return [...(causeList.value?.items || [])].sort((a, b) => a.roster_sr_no - b.roster_sr_no)
})
</script>

<template>
  <UDashboardPanel id="cause-list-detail">
    <template #header>
      <AppPageHeader :title="causeList ? `Cause List: ${causeList.cause_list_date}` : 'Cause List Roster'">
        <template #actions>
          <div class="flex items-center gap-2">
            <UButton
              to="/cause-lists"
              label="All Cause Lists"
              icon="i-lucide-arrow-left"
              variant="outline"
              color="neutral"
              size="sm"
            />
            <UButton
              label="Add Case to Roster"
              icon="i-lucide-plus"
              color="primary"
              size="sm"
              @click="openAddItem"
            />
          </div>
        </template>
      </AppPageHeader>
    </template>

    <template #body>
      <div v-if="causeList" class="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
        <!-- Roster Header Card -->
        <div class="p-5 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <UBadge :label="causeList.day_of_week" size="sm" color="primary" />
                <span class="text-xs text-muted">Daily Cause List</span>
              </div>
              <h1 class="text-xl sm:text-2xl font-bold text-highlighted">
                {{ causeList.court_details?.court_name }}
              </h1>
              <p class="text-xs sm:text-sm text-muted mt-1">
                Presiding: <strong class="text-highlighted">{{ causeList.court_details?.presiding_officer }}</strong>
                ({{ causeList.court_details?.designation }}) · Room: {{ causeList.court_details?.court_room_no || 'N/A' }} · District: {{ causeList.court_details?.district }}
              </p>
            </div>

            <div class="flex items-center gap-3">
              <div class="px-4 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 text-center">
                <span class="text-xs text-muted block">Date</span>
                <span class="text-sm font-bold text-primary">{{ causeList.cause_list_date }}</span>
              </div>
              <div class="px-4 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 text-center">
                <span class="text-xs text-muted block">Scheduled</span>
                <span class="text-sm font-bold text-highlighted">{{ causeList.items?.length || 0 }} Cases</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Roster Itemization Table -->
        <div class="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
          <div class="p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <div>
              <h3 class="font-semibold text-highlighted text-sm sm:text-base">Hearing Roster Order</h3>
              <p class="text-xs text-muted">Order of cases scheduled for hearing in this session</p>
            </div>
            <UButton
              label="Add Case to Roster"
              icon="i-lucide-plus"
              size="xs"
              color="primary"
              @click="openAddItem"
            />
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs sm:text-sm">
              <thead class="bg-neutral-50 dark:bg-neutral-800/50 text-muted uppercase tracking-wider font-semibold border-b border-neutral-200 dark:border-neutral-800">
                <tr>
                  <th class="px-4 py-3 text-center w-16">Sr. #</th>
                  <th class="px-4 py-3">Category Heading</th>
                  <th class="px-4 py-3">Case Information</th>
                  <th class="px-4 py-3">Proceeding Stage</th>
                  <th class="px-4 py-3">Today's Summary</th>
                  <th class="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
                <tr
                  v-for="item in sortedItems"
                  :key="item.item_id"
                  class="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40 transition"
                >
                  <td class="px-4 py-3.5 text-center font-bold text-muted">
                    <span class="size-7 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto text-highlighted">
                      {{ item.roster_sr_no }}
                    </span>
                  </td>

                  <td class="px-4 py-3.5 whitespace-nowrap">
                    <UBadge :label="item.category_heading" size="xs" variant="outline" color="neutral" />
                  </td>

                  <td class="px-4 py-3.5 max-w-xs sm:max-w-sm">
                    <NuxtLink :to="`/cases/${item.case}`" class="font-bold text-primary hover:underline block">
                      {{ item.case_details?.case_number }}
                    </NuxtLink>
                    <p class="text-xs text-muted line-clamp-1 mt-0.5">
                      {{ item.case_details?.case_title }}
                    </p>
                  </td>

                  <td class="px-4 py-3.5 font-semibold text-highlighted whitespace-nowrap">
                    {{ item.proceeding_details?.stage }}
                  </td>

                  <td class="px-4 py-3.5 max-w-xs text-muted text-xs">
                    {{ item.proceeding_details?.today_action || '—' }}
                  </td>

                  <td class="px-4 py-3.5 text-right whitespace-nowrap">
                    <div class="flex items-center justify-end gap-1">
                      <UButton
                        :to="`/cases/${item.case}`"
                        label="Docket"
                        size="xs"
                        variant="ghost"
                      />
                      <UButton
                        icon="i-lucide-pencil"
                        size="xs"
                        variant="ghost"
                        color="neutral"
                        @click="openEditItem(item)"
                      />
                      <UButton
                        icon="i-lucide-trash-2"
                        size="xs"
                        variant="ghost"
                        color="error"
                        @click="openDeleteItem(item)"
                      />
                    </div>
                  </td>
                </tr>

                <tr v-if="!sortedItems.length">
                  <td colspan="6" class="p-8">
                    <CommonEmptyState
                      icon="i-lucide-list-ordered"
                      title="No cases on this cause list"
                      description="Add cases and their linked proceedings to construct today's hearing schedule."
                      action-label="Add Case to Roster"
                      @action="openAddItem"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Loading skeleton -->
      <div v-else-if="status === 'pending'" class="p-6 space-y-4 max-w-7xl mx-auto">
        <div class="h-32 bg-neutral-200 dark:bg-neutral-800 rounded-2xl animate-pulse" />
        <div class="h-60 bg-neutral-200 dark:bg-neutral-800 rounded-xl animate-pulse" />
      </div>

      <!-- Modals -->
      <CauselistCauseListItemModal
        v-if="causeList"
        v-model:open="isItemModalOpen"
        :cause-list-id="causeList.cause_list_id"
        :item="selectedItem"
        @saved="() => refresh()"
      />

      <CommonConfirmModal
        v-model:open="isDeleteItemModalOpen"
        title="Remove From Cause List"
        :description="itemToDelete ? `Remove roster item #${itemToDelete.roster_sr_no} (${itemToDelete.case_details?.case_number}) from this cause list?` : ''"
        confirm-label="Remove Item"
        :loading="isDeletingItem"
        @confirm="confirmDeleteItem"
      />
    </template>
  </UDashboardPanel>
</template>
