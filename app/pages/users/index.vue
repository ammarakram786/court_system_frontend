<script setup lang="ts">
import type { User, UserFilters, ProfileStatusEnum } from '~/types/legal'

useHead({ title: 'Officers & Users' })

const { useUsersList, deleteUser, patchUser } = useUsers()
const refData = useReferenceData()
const toast = useToast()

const filters = reactive<UserFilters>({
  search: '',
  organization: undefined,
  role: undefined,
  profile_status: undefined,
  page: 1,
  page_size: 10,
  ordering: '-created_at'
})

const { data, status, refresh } = useUsersList(filters)

const orgOptions = ref<{ label: string, value: string }[]>([])
const roleOptions = ref<{ label: string, value: string }[]>([])

const profileStatusOptions = [
  { label: 'All Statuses', value: '' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
  { label: 'Suspended', value: 'SUSPENDED' },
  { label: 'On Leave', value: 'ON_LEAVE' },
  { label: 'Archived', value: 'ARCHIVED' }
]

onMounted(async () => {
  const [orgs, roles] = await Promise.all([
    refData.loadOrganizationOptions(),
    refData.loadRoleOptions()
  ])
  orgOptions.value = [{ label: 'All Organizations', value: '' }, ...orgs]
  roleOptions.value = [{ label: 'All Roles', value: '' }, ...roles]
})

// Modals
const isModalOpen = ref(false)
const selectedUser = ref<User | null>(null)

const isDeleteModalOpen = ref(false)
const userToDelete = ref<User | null>(null)
const isDeleting = ref(false)

function openCreate() {
  selectedUser.value = null
  isModalOpen.value = true
}

function openEdit(u: User) {
  selectedUser.value = u
  isModalOpen.value = true
}

function openDelete(u: User) {
  userToDelete.value = u
  isDeleteModalOpen.value = true
}

async function confirmDelete() {
  if (!userToDelete.value) return
  isDeleting.value = true
  try {
    await deleteUser(userToDelete.value.user_id)
    toast.add({ title: 'User deleted', color: 'success' })
    isDeleteModalOpen.value = false
    refresh()
  } catch (err: any) {
    toast.add({ title: 'Failed to delete user', description: err?.message, color: 'error' })
  } finally {
    isDeleting.value = false
  }
}

async function toggleActive(u: User) {
  try {
    await patchUser(u.user_id, { is_active: !u.is_active })
    toast.add({
      title: u.is_active ? 'Account deactivated' : 'Account activated',
      color: 'success'
    })
    refresh()
  } catch (err: any) {
    toast.add({ title: 'Failed to update user', description: err?.message, color: 'error' })
  }
}

function resetFilters() {
  filters.search = ''
  filters.organization = undefined
  filters.role = undefined
  filters.profile_status = undefined
  filters.page = 1
}
</script>

<template>
  <UDashboardPanel id="users">
    <template #header>
      <AppPageHeader title="Officers & Users Directory">
        <template #actions>
          <UButton
            label="Register User"
            icon="i-lucide-user-plus"
            color="primary"
            @click="openCreate"
          />
        </template>
      </AppPageHeader>
    </template>

    <template #body>
      <div class="p-4 sm:p-6 space-y-4 max-w-7xl mx-auto w-full">
        <!-- Filter bar -->
        <div class="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <UInput
              v-model="filters.search"
              placeholder="Search name, svc #, username..."
              icon="i-lucide-search"
              class="w-full"
              @update:model-value="filters.page = 1"
            />

            <USelect
              v-model="filters.organization"
              :items="orgOptions"
              value-key="value"
              label-key="label"
              placeholder="Filter by Organization"
              class="w-full"
              @update:model-value="filters.page = 1"
            />

            <USelect
              v-model="filters.role"
              :items="roleOptions"
              value-key="value"
              label-key="label"
              placeholder="Filter by Role"
              class="w-full"
              @update:model-value="filters.page = 1"
            />

            <USelect
              v-model="filters.profile_status"
              :items="profileStatusOptions"
              value-key="value"
              label-key="label"
              placeholder="Profile Status"
              class="w-full"
              @update:model-value="filters.page = 1"
            />
          </div>

          <div class="flex items-center justify-between text-xs text-muted pt-1">
            <span>
              Total users: <strong class="text-highlighted">{{ data?.count ?? 0 }}</strong>
            </span>
            <button
              v-if="filters.search || filters.organization || filters.role || filters.profile_status"
              type="button"
              class="text-primary hover:underline flex items-center gap-1"
              @click="resetFilters"
            >
              <UIcon name="i-lucide-rotate-ccw" class="size-3" />
              Reset Filters
            </button>
          </div>
        </div>

        <!-- Users Table -->
        <div class="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs sm:text-sm">
              <thead class="bg-neutral-50 dark:bg-neutral-800/50 text-muted uppercase tracking-wider font-semibold border-b border-neutral-200 dark:border-neutral-800">
                <tr>
                  <th class="px-4 py-3">Officer / User</th>
                  <th class="px-4 py-3">Rank & Appointment</th>
                  <th class="px-4 py-3">Organization</th>
                  <th class="px-4 py-3">Role</th>
                  <th class="px-4 py-3">Status</th>
                  <th class="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
                <tr
                  v-for="u in data?.results || []"
                  :key="u.user_id"
                  class="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40 transition"
                >
                  <td class="px-4 py-3.5">
                    <div class="flex items-center gap-3">
                      <div class="size-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">
                        {{ u.name ? u.name[0]?.toUpperCase() : 'U' }}
                      </div>
                      <div>
                        <NuxtLink :to="`/users/${u.user_id}`" class="font-bold text-highlighted hover:underline">
                          {{ u.name }}
                        </NuxtLink>
                        <div class="text-[11px] text-muted flex items-center gap-1.5 mt-0.5">
                          <span>@{{ u.username }}</span>
                          <span>·</span>
                          <span class="font-mono">{{ u.svc_number }}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td class="px-4 py-3.5">
                    <span class="font-medium text-highlighted block">
                      {{ u.rank_details?.title || '—' }}
                    </span>
                    <span class="text-[11px] text-muted block">
                      {{ u.appointment_details?.title || 'Unassigned' }}
                    </span>
                  </td>

                  <td class="px-4 py-3.5 text-muted">
                    {{ u.organization_details?.name || '—' }}
                  </td>

                  <td class="px-4 py-3.5">
                    <UBadge
                      :label="u.role_details?.name || 'Standard User'"
                      size="xs"
                      variant="outline"
                      color="neutral"
                    />
                  </td>

                  <td class="px-4 py-3.5">
                    <div class="flex items-center gap-1.5">
                      <CommonStatusBadge :value="u.profile_status" size="xs" />
                      <button
                        type="button"
                        class="cursor-pointer text-[11px] underline"
                        :class="u.is_active ? 'text-emerald-600' : 'text-neutral-400'"
                        @click="toggleActive(u)"
                      >
                        {{ u.is_active ? 'Active' : 'Disabled' }}
                      </button>
                    </div>
                  </td>

                  <td class="px-4 py-3.5 text-right whitespace-nowrap">
                    <div class="flex items-center justify-end gap-1">
                      <UButton
                        :to="`/users/${u.user_id}`"
                        label="Overrides"
                        size="xs"
                        variant="ghost"
                        trailing-icon="i-lucide-shield"
                      />
                      <UButton
                        icon="i-lucide-pencil"
                        size="xs"
                        variant="ghost"
                        color="neutral"
                        @click="openEdit(u)"
                      />
                      <UButton
                        icon="i-lucide-trash-2"
                        size="xs"
                        variant="ghost"
                        color="error"
                        @click="openDelete(u)"
                      />
                    </div>
                  </td>
                </tr>

                <tr v-if="!data?.results?.length && status !== 'pending'">
                  <td colspan="6" class="p-8">
                    <CommonEmptyState
                      icon="i-lucide-users"
                      title="No users found"
                      description="Register officers, clerks, or system administrators."
                      action-label="Register User"
                      @action="openCreate"
                    />
                  </td>
                </tr>

                <tr v-if="status === 'pending'" v-for="n in 3" :key="`skel-${n}`">
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
      <UsersUserModal
        v-model:open="isModalOpen"
        :user="selectedUser"
        @saved="() => refresh()"
      />

      <CommonConfirmModal
        v-model:open="isDeleteModalOpen"
        title="Delete User Account"
        :description="userToDelete ? `Delete user account for ${userToDelete.name} (@${userToDelete.username})?` : ''"
        confirm-label="Delete User"
        :loading="isDeleting"
        @confirm="confirmDelete"
      />
    </template>
  </UDashboardPanel>
</template>
