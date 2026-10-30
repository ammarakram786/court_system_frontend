<script setup lang="ts">
import type { User, PermissionOverride } from '~/types/legal'

const route = useRoute()
const userId = computed(() => route.params.id as string)

const { useUserDetail } = useUsers()
const { useOverridesList, deleteOverride } = useRbac()
const toast = useToast()

const { data: user, status: userStatus, refresh: refreshUser } = useUserDetail(userId)
const { data: overridesData, status: overridesStatus, refresh: refreshOverrides } = useOverridesList({
  user: userId.value,
  page_size: 50
})

useHead({
  title: computed(() => user.value ? `${user.value.name} · User Profile` : 'User Profile')
})

// Modals
const isUserModalOpen = ref(false)
const isOverrideModalOpen = ref(false)
const selectedOverride = ref<PermissionOverride | null>(null)

const isDeleteOverrideModalOpen = ref(false)
const overrideToDelete = ref<PermissionOverride | null>(null)
const isDeletingOverride = ref(false)

function openCreateOverride() {
  selectedOverride.value = null
  isOverrideModalOpen.value = true
}

function openEditOverride(ov: PermissionOverride) {
  selectedOverride.value = ov
  isOverrideModalOpen.value = true
}

function openDeleteOverride(ov: PermissionOverride) {
  overrideToDelete.value = ov
  isDeleteOverrideModalOpen.value = true
}

async function confirmDeleteOverride() {
  if (!overrideToDelete.value) return
  isDeletingOverride.value = true
  try {
    await deleteOverride(overrideToDelete.value.override_id)
    toast.add({ title: 'Override revoked', color: 'success' })
    isDeleteOverrideModalOpen.value = false
    refreshOverrides()
  } catch (err: any) {
    toast.add({ title: 'Failed to revoke override', description: err?.message, color: 'error' })
  } finally {
    isDeletingOverride.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="user-detail">
    <template #header>
      <AppPageHeader :title="user?.name || 'User Profile'">
        <template #actions>
          <div class="flex items-center gap-2">
            <UButton
              to="/users"
              label="All Users"
              icon="i-lucide-arrow-left"
              variant="outline"
              color="neutral"
              size="sm"
            />
            <UButton
              v-if="user"
              label="Edit User"
              icon="i-lucide-pencil"
              variant="outline"
              color="neutral"
              size="sm"
              @click="isUserModalOpen = true"
            />
          </div>
        </template>
      </AppPageHeader>
    </template>

    <template #body>
      <div v-if="user" class="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
        <!-- Profile Overview Card -->
        <div class="p-5 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="flex items-center gap-4">
              <div class="size-16 rounded-2xl bg-primary text-inverted text-2xl font-bold flex items-center justify-center shrink-0">
                {{ user.name[0]?.toUpperCase() }}
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h1 class="text-xl sm:text-2xl font-bold text-highlighted">{{ user.name }}</h1>
                  <CommonStatusBadge :value="user.profile_status" size="xs" />
                  <UBadge v-if="user.is_staff" label="Staff / Admin" size="xs" color="warning" />
                </div>
                <p class="text-xs sm:text-sm text-muted mt-0.5">
                  @{{ user.username }} · Service # <span class="font-mono font-semibold text-highlighted">{{ user.svc_number }}</span>
                  <span v-if="user.email"> · {{ user.email }}</span>
                </p>
              </div>
            </div>

            <UButton
              label="Grant Override"
              icon="i-lucide-shield-plus"
              color="primary"
              size="sm"
              @click="openCreateOverride"
            />
          </div>

          <!-- Attributes Grid -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 text-xs">
            <div>
              <span class="text-muted block">Military / Civilian Rank</span>
              <strong class="font-semibold text-highlighted block mt-0.5">
                {{ user.rank_details?.title || 'Unassigned' }}
              </strong>
              <span v-if="user.rank_details?.abbreviation" class="text-muted text-[11px]">
                ({{ user.rank_details.abbreviation }})
              </span>
            </div>

            <div>
              <span class="text-muted block">Appointment</span>
              <strong class="font-semibold text-highlighted block mt-0.5">
                {{ user.appointment_details?.title || 'Unassigned' }}
              </strong>
            </div>

            <div>
              <span class="text-muted block">Organization Unit</span>
              <strong class="font-semibold text-highlighted block mt-0.5">
                {{ user.organization_details?.name || 'Unassigned' }}
              </strong>
            </div>

            <div>
              <span class="text-muted block">Assigned RBAC Role</span>
              <strong class="font-semibold text-primary block mt-0.5">
                {{ user.role_details?.name || 'Standard User' }}
              </strong>
            </div>
          </div>
        </div>

        <!-- Custom Permission Overrides Table -->
        <div class="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
          <div class="p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <div>
              <h3 class="font-semibold text-highlighted text-sm sm:text-base">Custom Permission Overrides</h3>
              <p class="text-xs text-muted">Direct ALLOW or DENY policy overrides applied to this individual</p>
            </div>
            <UButton
              label="Grant Override"
              icon="i-lucide-plus"
              size="xs"
              color="primary"
              @click="openCreateOverride"
            />
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs sm:text-sm">
              <thead class="bg-neutral-50 dark:bg-neutral-800/50 text-muted uppercase tracking-wider font-semibold border-b border-neutral-200 dark:border-neutral-800">
                <tr>
                  <th class="px-4 py-3">Permission Code</th>
                  <th class="px-4 py-3">Effect</th>
                  <th class="px-4 py-3">Justification / Reason</th>
                  <th class="px-4 py-3">Granted By</th>
                  <th class="px-4 py-3">Expires At</th>
                  <th class="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
                <tr
                  v-for="ov in overridesData?.results || []"
                  :key="ov.override_id"
                  class="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40 transition"
                >
                  <td class="px-4 py-3.5 font-bold font-mono text-highlighted">
                    {{ ov.permission_code }}
                  </td>

                  <td class="px-4 py-3.5">
                    <CommonStatusBadge :value="ov.effect" />
                  </td>

                  <td class="px-4 py-3.5 text-muted max-w-xs">
                    {{ ov.reason }}
                  </td>

                  <td class="px-4 py-3.5 text-muted font-medium">
                    {{ ov.granted_by }}
                  </td>

                  <td class="px-4 py-3.5 font-mono text-xs whitespace-nowrap">
                    {{ ov.expires_at || 'Never (Permanent)' }}
                  </td>

                  <td class="px-4 py-3.5 text-right whitespace-nowrap">
                    <div class="flex items-center justify-end gap-1">
                      <UButton
                        icon="i-lucide-pencil"
                        size="xs"
                        variant="ghost"
                        color="neutral"
                        @click="openEditOverride(ov)"
                      />
                      <UButton
                        icon="i-lucide-trash-2"
                        size="xs"
                        variant="ghost"
                        color="error"
                        @click="openDeleteOverride(ov)"
                      />
                    </div>
                  </td>
                </tr>

                <tr v-if="!overridesData?.results?.length">
                  <td colspan="6" class="p-8">
                    <CommonEmptyState
                      icon="i-lucide-shield-check"
                      title="No custom overrides active"
                      description="User inherits standard permissions exclusively from their assigned role."
                      action-label="Grant Custom Override"
                      @action="openCreateOverride"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Role Inherited Permissions Matrix -->
        <div class="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm p-5 space-y-3">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-semibold text-highlighted text-sm sm:text-base">Inherited Role Permissions</h3>
              <p class="text-xs text-muted">Granted by assigned role: <strong>{{ user.role_details?.name || 'None' }}</strong></p>
            </div>
            <span class="text-xs text-muted">{{ user.role_details?.permissions?.length || 0 }} permissions</span>
          </div>

          <div v-if="user.role_details?.permissions?.length" class="flex flex-wrap gap-2 pt-2">
            <span
              v-for="p in user.role_details.permissions"
              :key="p.permission_id"
              class="px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-neutral-800 text-xs font-mono font-medium text-highlighted bg-neutral-50 dark:bg-neutral-800/40"
            >
              {{ p.code }}
            </span>
          </div>
          <p v-else class="text-xs text-muted">No specific permissions attached to this role.</p>
        </div>
      </div>

      <!-- Modals -->
      <UsersUserModal
        v-if="user"
        v-model:open="isUserModalOpen"
        :user="user"
        @saved="() => refreshUser()"
      />

      <UsersOverrideModal
        v-if="user"
        v-model:open="isOverrideModalOpen"
        :user-id="user.user_id"
        :user-name="user.name"
        :override-item="selectedOverride"
        @saved="() => refreshOverrides()"
      />

      <CommonConfirmModal
        v-model:open="isDeleteOverrideModalOpen"
        title="Revoke Permission Override"
        :description="overrideToDelete ? `Revoke override ${overrideToDelete.permission_code} (${overrideToDelete.effect}) for this user?` : ''"
        confirm-label="Revoke Override"
        :loading="isDeletingOverride"
        @confirm="confirmDeleteOverride"
      />
    </template>
  </UDashboardPanel>
</template>
