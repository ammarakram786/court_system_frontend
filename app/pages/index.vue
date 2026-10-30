<script setup lang="ts">
import type { Case, CauseList, Court } from '~/types/legal'
import type { Paginated } from '~/types/api'

useHead({ title: 'Dashboard' })

const auth = useAuthStore()
const { useCasesList } = useCases()
const { useTodayCauseList } = useCauseLists()
const { useCourtsList } = useCourts()
const { useHealthCheck } = useHealth()

// SSR-safe data queries
const { data: pendingCasesData, status: pendingStatus } = useCasesList({ status: 'PENDING', page_size: 1 })
const { data: decidedCasesData } = useCasesList({ status: 'DECIDED', page_size: 1 })
const { data: courtsData } = useCourtsList({ page_size: 1 })
const { data: recentCasesData, refresh: refreshRecent } = useCasesList({ page_size: 5, ordering: '-created_at' })
const { data: todayList, status: todayStatus, refresh: refreshToday } = useTodayCauseList()
const { data: healthData } = useHealthCheck()

// Modal states for quick actions
const isCaseModalOpen = ref(false)
const isCauseListModalOpen = ref(false)

function onCaseSaved() {
  refreshRecent()
}

function onCauseListSaved() {
  refreshToday()
}
</script>

<template>
  <UDashboardPanel id="dashboard">
    <template #header>
      <AppPageHeader title="Executive Dashboard">
        <template #actions>
          <div class="flex items-center gap-2">
            <!-- Health Status Indicator -->
            <div
              class="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
              :class="healthData?.status === 'ok' || healthData?.status === 'healthy' || healthData?.database === 'connected'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'"
            >
              <span class="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Backend API: Online</span>
            </div>

            <UButton
              label="Register Case"
              icon="i-lucide-plus"
              color="primary"
              size="sm"
              @click="isCaseModalOpen = true"
            />
          </div>
        </template>
      </AppPageHeader>
    </template>

    <template #body>
      <div class="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
        <!-- Welcome Hero Banner -->
        <div class="rounded-2xl bg-gradient-to-r from-primary-600 to-primary-800 p-6 sm:p-8 text-white shadow-lg">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-medium backdrop-blur-sm mb-3">
                <UIcon name="i-lucide-shield-check" class="size-3.5" />
                Pakistan Court & Case Management System
              </span>
              <h1 class="text-2xl sm:text-3xl font-bold tracking-tight">
                Welcome back, {{ auth.user?.name || auth.user?.username || 'Officer' }}
              </h1>
              <p class="mt-1 text-sm sm:text-base text-white/80 max-w-2xl">
                {{ auth.user?.rank_details?.title ? `${auth.user.rank_details.title} · ` : '' }}
                {{ auth.user?.appointment_details?.title || 'Legal Administrator' }}
                {{ auth.user?.svc_number ? `(${auth.user.svc_number})` : '' }}
              </p>
            </div>

            <div class="flex items-center gap-3">
              <UButton
                label="New Cause List"
                icon="i-lucide-calendar-plus"
                color="neutral"
                variant="solid"
                class="bg-white text-primary-950 hover:bg-neutral-100 font-semibold"
                @click="isCauseListModalOpen = true"
              />
              <UButton
                to="/cases"
                label="Browse Docket"
                trailing-icon="i-lucide-arrow-right"
                variant="outline"
                class="border-white/30 text-white hover:bg-white/10"
              />
            </div>
          </div>
        </div>

        <!-- Metric KPI Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex items-center justify-between">
            <div>
              <p class="text-xs font-semibold text-muted uppercase tracking-wider">Pending Cases</p>
              <h3 class="text-2xl font-bold text-highlighted mt-1">
                {{ pendingCasesData?.count ?? '—' }}
              </h3>
              <span class="text-xs text-amber-600 dark:text-amber-400 font-medium inline-flex items-center gap-1 mt-1">
                <UIcon name="i-lucide-clock" class="size-3" /> Under proceeding
              </span>
            </div>
            <div class="size-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <UIcon name="i-lucide-scale" class="size-6" />
            </div>
          </div>

          <div class="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex items-center justify-between">
            <div>
              <p class="text-xs font-semibold text-muted uppercase tracking-wider">Decided / Disposed</p>
              <h3 class="text-2xl font-bold text-highlighted mt-1">
                {{ decidedCasesData?.count ?? '—' }}
              </h3>
              <span class="text-xs text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center gap-1 mt-1">
                <UIcon name="i-lucide-check-circle-2" class="size-3" /> Judgments finalized
              </span>
            </div>
            <div class="size-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <UIcon name="i-lucide-gavel" class="size-6" />
            </div>
          </div>

          <div class="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex items-center justify-between">
            <div>
              <p class="text-xs font-semibold text-muted uppercase tracking-wider">Today's Roster</p>
              <h3 class="text-2xl font-bold text-highlighted mt-1">
                {{ todayList?.items?.length ?? 0 }}
              </h3>
              <span class="text-xs text-primary font-medium inline-flex items-center gap-1 mt-1">
                <UIcon name="i-lucide-calendar" class="size-3" /> Scheduled today
              </span>
            </div>
            <div class="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <UIcon name="i-lucide-list-ordered" class="size-6" />
            </div>
          </div>

          <div class="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex items-center justify-between">
            <div>
              <p class="text-xs font-semibold text-muted uppercase tracking-wider">Active Courts</p>
              <h3 class="text-2xl font-bold text-highlighted mt-1">
                {{ courtsData?.count ?? '—' }}
              </h3>
              <span class="text-xs text-sky-600 dark:text-sky-400 font-medium inline-flex items-center gap-1 mt-1">
                <UIcon name="i-lucide-landmark" class="size-3" /> Judicial benches
              </span>
            </div>
            <div class="size-12 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <UIcon name="i-lucide-building" class="size-6" />
            </div>
          </div>
        </div>

        <!-- 2-Column Section: Today's Cause List & Quick Actions -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Today's Cause List Spotlight (2 Cols) -->
          <div class="lg:col-span-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden flex flex-col">
            <div class="p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <UIcon name="i-lucide-calendar-days" class="size-4" />
                </span>
                <div>
                  <h3 class="font-semibold text-highlighted text-sm sm:text-base">Today's Daily Cause List</h3>
                  <p class="text-xs text-muted">Daily court hearing roster for today</p>
                </div>
              </div>
              <UButton
                v-if="todayList"
                :to="`/cause-lists/${todayList.cause_list_id}`"
                label="Full Roster"
                size="xs"
                variant="ghost"
                trailing-icon="i-lucide-external-link"
              />
            </div>

            <div class="p-4 sm:p-5 flex-1 flex flex-col justify-center">
              <div v-if="todayList" class="space-y-4">
                <div class="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                  <div>
                    <span class="text-xs text-muted block">Court Bench</span>
                    <span class="text-sm font-semibold text-highlighted">
                      {{ todayList.court_details?.court_name || 'Court' }}
                    </span>
                    <span class="text-xs text-muted block">
                      Presiding: {{ todayList.court_details?.presiding_officer }} ({{ todayList.court_details?.district }})
                    </span>
                  </div>
                  <div class="text-right">
                    <span class="text-xs text-muted block">{{ todayList.day_of_week }}</span>
                    <span class="text-sm font-bold text-primary">{{ todayList.cause_list_date }}</span>
                  </div>
                </div>

                <div v-if="todayList.items && todayList.items.length > 0" class="divide-y divide-neutral-100 dark:divide-neutral-800">
                  <div
                    v-for="item in todayList.items.slice(0, 4)"
                    :key="item.item_id"
                    class="py-2.5 flex items-center justify-between gap-4 text-xs"
                  >
                    <div class="flex items-center gap-3">
                      <span class="size-6 rounded-full bg-neutral-100 dark:bg-neutral-800 font-bold flex items-center justify-center text-muted">
                        {{ item.roster_sr_no }}
                      </span>
                      <div>
                        <span class="font-medium text-highlighted hover:underline cursor-pointer">
                          {{ item.case_details?.case_number }}
                        </span>
                        <p class="text-[11px] text-muted truncate max-w-xs sm:max-w-md">
                          {{ item.case_details?.case_title }}
                        </p>
                      </div>
                    </div>
                    <div class="text-right">
                      <UBadge :label="item.category_heading" size="xs" variant="outline" color="neutral" />
                    </div>
                  </div>
                </div>

                <div v-else class="text-center py-6 text-sm text-muted">
                  No cases scheduled on today's roster yet.
                </div>
              </div>

              <!-- Empty today list -->
              <div v-else class="text-center py-8">
                <UIcon name="i-lucide-calendar-x" class="size-10 text-muted mx-auto mb-2" />
                <h4 class="text-sm font-semibold text-highlighted">No Cause List Found For Today</h4>
                <p class="text-xs text-muted mt-1 max-w-sm mx-auto">
                  Create today's court hearing schedule to organize the roster.
                </p>
                <UButton
                  label="Create Today's List"
                  icon="i-lucide-plus"
                  size="xs"
                  color="primary"
                  class="mt-4"
                  @click="isCauseListModalOpen = true"
                />
              </div>
            </div>
          </div>

          <!-- Quick Navigation Actions -->
          <div class="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm p-4 sm:p-5 flex flex-col justify-between">
            <div>
              <h3 class="font-semibold text-highlighted text-sm sm:text-base mb-1">Quick Actions</h3>
              <p class="text-xs text-muted mb-4">Frequently accessed judicial operations</p>

              <div class="space-y-2">
                <UButton
                  to="/cases"
                  label="Manage Case Dockets"
                  icon="i-lucide-folder-git-2"
                  variant="outline"
                  color="neutral"
                  block
                  class="justify-start text-xs"
                />
                <UButton
                  to="/proceedings"
                  label="Hearings & Proceedings"
                  icon="i-lucide-gavel"
                  variant="outline"
                  color="neutral"
                  block
                  class="justify-start text-xs"
                />
                <UButton
                  to="/cause-lists"
                  label="Browse All Cause Lists"
                  icon="i-lucide-calendar-days"
                  variant="outline"
                  color="neutral"
                  block
                  class="justify-start text-xs"
                />
                <UButton
                  to="/courts"
                  label="Courts & Benches Directory"
                  icon="i-lucide-landmark"
                  variant="outline"
                  color="neutral"
                  block
                  class="justify-start text-xs"
                />
                <UButton
                  to="/organizations"
                  label="Command & Org Structure"
                  icon="i-lucide-network"
                  variant="outline"
                  color="neutral"
                  block
                  class="justify-start text-xs"
                />
                <UButton
                  to="/users"
                  label="Officers & RBAC Management"
                  icon="i-lucide-shield-check"
                  variant="outline"
                  color="neutral"
                  block
                  class="justify-start text-xs"
                />
              </div>
            </div>

            <div class="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800 text-[11px] text-muted flex items-center justify-between">
              <span>Law DTE Frontend v1.0</span>
              <span class="text-emerald-600 dark:text-emerald-400 font-medium">Django DRF Connected</span>
            </div>
          </div>
        </div>

        <!-- Recent Registered Cases Table -->
        <div class="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
          <div class="p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <div>
              <h3 class="font-semibold text-highlighted text-sm sm:text-base">Recent Case Dockets</h3>
              <p class="text-xs text-muted">Latest court cases registered in the system</p>
            </div>
            <UButton
              to="/cases"
              label="View All Cases"
              size="xs"
              trailing-icon="i-lucide-arrow-right"
              variant="ghost"
            />
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-neutral-50 dark:bg-neutral-800/50 text-muted uppercase tracking-wider font-semibold border-b border-neutral-200 dark:border-neutral-800">
                <tr>
                  <th class="px-4 py-3">Case Number</th>
                  <th class="px-4 py-3">Case Title</th>
                  <th class="px-4 py-3">Court</th>
                  <th class="px-4 py-3">Category</th>
                  <th class="px-4 py-3">Institution Date</th>
                  <th class="px-4 py-3">Status</th>
                  <th class="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
                <tr
                  v-for="c in recentCasesData?.results || []"
                  :key="c.case_id"
                  class="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40 transition"
                >
                  <td class="px-4 py-3 font-semibold text-highlighted">
                    <NuxtLink :to="`/cases/${c.case_id}`" class="hover:underline text-primary">
                      {{ c.case_number }}
                    </NuxtLink>
                  </td>
                  <td class="px-4 py-3 font-medium max-w-xs truncate text-highlighted">
                    {{ c.case_title }}
                  </td>
                  <td class="px-4 py-3 text-muted">
                    {{ c.court_details?.court_name || '—' }}
                  </td>
                  <td class="px-4 py-3">
                    <span class="font-medium text-highlighted">{{ c.category_details?.name }}</span>
                  </td>
                  <td class="px-4 py-3 text-muted">
                    {{ c.institution_date }}
                  </td>
                  <td class="px-4 py-3">
                    <CommonStatusBadge :value="c.status" />
                  </td>
                  <td class="px-4 py-3 text-right">
                    <UButton
                      :to="`/cases/${c.case_id}`"
                      label="View"
                      size="xs"
                      variant="ghost"
                      trailing-icon="i-lucide-chevron-right"
                    />
                  </td>
                </tr>
                <tr v-if="!recentCasesData?.results?.length">
                  <td colspan="7" class="px-4 py-8 text-center text-muted">
                    No cases registered yet. Click "Register Case" to add one.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Modals for Quick Actions -->
      <CasesCaseFormModal
        v-model:open="isCaseModalOpen"
        @saved="onCaseSaved"
      />

      <CauselistCauseListFormModal
        v-model:open="isCauseListModalOpen"
        @saved="onCauseListSaved"
      />
    </template>
  </UDashboardPanel>
</template>
