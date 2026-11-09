<script setup lang="ts">
import type { Role, Permission } from '~/types/legal'

useHead({ title: 'RBAC Roles & Permissions' })

const { useRolesList, deleteRole } = useRbac()
const toast = useToast()

const filters = reactive({
  search: '',
  page: 1,
  page_size: 10
})

const { data: rolesData, status, refresh: refreshRoles } = useRolesList(filters)

const totalPages = computed(() => {
  const count = rolesData.value?.count ?? 0
  return Math.max(1, Math.ceil(count / filters.page_size))
})

// Expanded row state for inspecting granted permissions inline
const expandedRoleIds = ref<Set<string>>(new Set())

function toggleRowExpand(roleId: string) {
  if (expandedRoleIds.value.has(roleId)) {
    expandedRoleIds.value.delete(roleId)
  } else {
    expandedRoleIds.value.add(roleId)
  }
}

function isRowExpanded(roleId: string): boolean {
  return expandedRoleIds.value.has(roleId)
}

function getRoleGroupedPermissions(role: Role): Record<string, Permission[]> {
  const groups: Record<string, Permission[]> = {}
  for (const p of role.permissions || []) {
    const mod = p.module || p.module_name || p.app_name || 'General'
    if (!groups[mod]) groups[mod] = []
    groups[mod]!.push(p)
  }
  return groups
}

function getRoleModuleSummary(role: Role): { module: string, count: number }[] {
  const groups = getRoleGroupedPermissions(role)
  return Object.entries(groups).map(([module, perms]) => ({
    module,
    count: perms.length
  }))
}

// Modals
const isRoleModalOpen = ref(false)
const selectedRole = ref<Role | null>(null)

const isDeleteModalOpen = ref(false)
const roleToDelete = ref<Role | null>(null)
const isDeleting = ref(false)

function openCreate() {
  selectedRole.value = null
  isRoleModalOpen.value = true
}

function openEdit(r: Role) {
  selectedRole.value = r
  isRoleModalOpen.value = true
}

function openDelete(r: Role) {
  roleToDelete.value = r
  isDeleteModalOpen.value = true
}

async function confirmDelete() {
  if (!roleToDelete.value) return
  isDeleting.value = true
  try {
    await deleteRole(roleToDelete.value.role_id)
    toast.add({ title: 'Role deleted successfully', color: 'success' })
    isDeleteModalOpen.value = false
    refreshRoles()
  } catch (err: any) {
    toast.add({ title: 'Failed to delete role', description: err?.message, color: 'error' })
  } finally {
    isDeleting.value = false
  }
}

function resetFilters() {
  filters.search = ''
  filters.page = 1
}
</script>

<template>
  <UDashboardPanel id="roles">
    <template #header>
      <AppPageHeader title="Access Control & Roles (RBAC)">
        <template #actions>
          <UButton
            label="Create Role"
            icon="i-lucide-shield-plus"
            color="primary"
            @click="openCreate"
          />
        </template>
      </AppPageHeader>
    </template>

    <template #body>
      <div class="p-4 sm:p-6 space-y-4 max-w-7xl mx-auto w-full">
        <!-- Filter & Search Toolbar -->
        <div class="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div class="flex-1 w-full sm:max-w-md">
            <UInput
              v-model="filters.search"
              placeholder="Search by role name or description..."
              icon="i-lucide-search"
              class="w-full"
              @update:model-value="filters.page = 1"
            />
          </div>

          <div class="flex items-center justify-between sm:justify-end gap-3 text-xs text-muted">
            <span>
              Total roles: <strong class="text-highlighted">{{ rolesData?.count ?? 0 }}</strong>
            </span>
            <UButton
              v-if="filters.search"
              label="Reset"
              icon="i-lucide-rotate-ccw"
              size="xs"
              variant="ghost"
              color="neutral"
              @click="resetFilters"
            />
            <UButton
              icon="i-lucide-refresh-cw"
              size="xs"
              variant="ghost"
              color="neutral"
              :loading="status === 'pending'"
              @click="refreshRoles()"
            />
          </div>
        </div>

        <!-- Tabular Form: System Roles Table -->
        <div class="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs sm:text-sm">
              <thead class="bg-neutral-50 dark:bg-neutral-800/50 text-muted uppercase tracking-wider font-semibold border-b border-neutral-200 dark:border-neutral-800">
                <tr>
                  <th class="px-4 py-3">Role & Scope</th>
                  <th class="px-4 py-3">Description</th>
                  <th class="px-4 py-3">Assigned Users</th>
                  <th class="px-4 py-3">Permissions Matrix</th>
                  <th class="px-4 py-3">Created</th>
                  <th class="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
                <template v-for="role in rolesData?.results || []" :key="role.role_id">
                  <tr class="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40 transition">
                    <!-- Role & Scope -->
                    <td class="px-4 py-3.5">
                      <div class="flex items-center gap-3">
                        <span class="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <UIcon name="i-lucide-shield-check" class="size-4" />
                        </span>
                        <div>
                          <span class="font-bold text-highlighted block text-sm">
                            {{ role.name }}
                          </span>
                          <span class="font-mono text-[11px] text-muted">
                            {{ role.role_id.slice(0, 8) }}
                          </span>
                        </div>
                      </div>
                    </td>

                    <!-- Description -->
                    <td class="px-4 py-3.5 text-muted max-w-xs">
                      <p class="truncate text-xs">
                        {{ role.description || 'No description provided' }}
                      </p>
                    </td>

                    <!-- Assigned Users -->
                    <td class="px-4 py-3.5 whitespace-nowrap">
                      <UBadge
                        :label="`${role.users_count ?? 0} users`"
                        size="xs"
                        variant="subtle"
                        color="neutral"
                        icon="i-lucide-users"
                      />
                    </td>

                    <!-- Granted Permissions -->
                    <td class="px-4 py-3.5">
                      <div class="flex flex-col gap-1.5 items-start">
                        <div class="flex items-center gap-2">
                          <UBadge
                            :label="`${role.permissions?.length || 0} permissions`"
                            size="xs"
                            :color="(role.permissions?.length || 0) > 0 ? 'primary' : 'neutral'"
                            :variant="(role.permissions?.length || 0) > 0 ? 'subtle' : 'outline'"
                          />
                          <button
                            v-if="role.permissions?.length"
                            type="button"
                            class="text-[11px] text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
                            @click="toggleRowExpand(role.role_id)"
                          >
                            <span>{{ isRowExpanded(role.role_id) ? 'Hide details' : 'View details' }}</span>
                            <UIcon
                              name="i-lucide-chevron-down"
                              class="size-3 transition-transform duration-200"
                              :class="{ 'rotate-180': isRowExpanded(role.role_id) }"
                            />
                          </button>
                        </div>

                        <!-- Module distribution pills -->
                        <div v-if="role.permissions?.length" class="flex flex-wrap gap-1">
                          <span
                            v-for="summary in getRoleModuleSummary(role).slice(0, 3)"
                            :key="summary.module"
                            class="px-1.5 py-0.5 rounded text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-muted border border-neutral-200 dark:border-neutral-700/60"
                          >
                            {{ summary.module }}: {{ summary.count }}
                          </span>
                          <span
                            v-if="getRoleModuleSummary(role).length > 3"
                            class="px-1.5 py-0.5 rounded text-[10px] text-muted"
                          >
                            +{{ getRoleModuleSummary(role).length - 3 }} more
                          </span>
                        </div>
                      </div>
                    </td>

                    <!-- Created Date -->
                    <td class="px-4 py-3.5 whitespace-nowrap text-xs text-muted">
                      {{ formatDateTime(role.created_at) }}
                    </td>

                    <!-- Actions -->
                    <td class="px-4 py-3.5 text-right whitespace-nowrap">
                      <div class="flex items-center justify-end gap-1.5">
                        <UButton
                          label="Edit"
                          icon="i-lucide-pencil"
                          size="xs"
                          variant="ghost"
                          color="neutral"
                          @click="openEdit(role)"
                        />
                        <UButton
                          icon="i-lucide-trash-2"
                          size="xs"
                          variant="ghost"
                          color="error"
                          @click="openDelete(role)"
                        />
                      </div>
                    </td>
                  </tr>

                  <!-- Collapsible Expanded Permission Details Row -->
                  <tr v-if="isRowExpanded(role.role_id)" class="bg-neutral-50/70 dark:bg-neutral-800/30">
                    <td colspan="6" class="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
                      <div class="space-y-3">
                        <div class="flex items-center justify-between">
                          <div class="flex items-center gap-2">
                            <UIcon name="i-lucide-key-round" class="size-4 text-primary" />
                            <h4 class="text-xs font-bold uppercase tracking-wider text-highlighted">
                              Active Permissions for {{ role.name }}
                            </h4>
                            <span class="text-xs text-muted">
                              ({{ role.permissions?.length || 0 }} capability tokens granted)
                            </span>
                          </div>
                          <UButton
                            label="Edit Permissions"
                            icon="i-lucide-pencil"
                            size="xs"
                            variant="outline"
                            color="primary"
                            @click="openEdit(role)"
                          />
                        </div>

                        <!-- Grouped Permissions Matrix in Expanded Row -->
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          <div
                            v-for="(perms, modName) in getRoleGroupedPermissions(role)"
                            :key="modName"
                            class="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xs"
                          >
                            <div class="flex items-center justify-between mb-2 pb-1.5 border-b border-neutral-100 dark:border-neutral-800">
                              <span class="text-xs font-bold text-primary flex items-center gap-1.5">
                                <UIcon name="i-lucide-shield" class="size-3.5" />
                                {{ modName }}
                              </span>
                              <span class="text-[11px] text-muted">{{ perms.length }} tokens</span>
                            </div>
                            <div class="flex flex-wrap gap-1">
                              <span
                                v-for="p in perms"
                                :key="p.permission_id"
                                class="px-2 py-0.5 rounded text-[11px] font-mono bg-neutral-100 dark:bg-neutral-800 text-highlighted border border-neutral-200 dark:border-neutral-700/60"
                                :title="p.description || undefined"
                              >
                                {{ p.code || p.code_name }}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>

          <!-- Empty State -->
          <CommonEmptyState
            v-if="!rolesData?.results?.length"
            icon="i-lucide-shield-off"
            title="No roles found"
            :description="filters.search ? `No roles matched '${filters.search}'. Try resetting your search.` : 'Get started by creating your first system role with customized capability permissions.'"
            action-label="Create Role"
            @action="openCreate"
          />

          <!-- Pagination Bar -->
          <CommonPaginationBar
            v-if="(rolesData?.count ?? 0) > 0"
            v-model:page="filters.page"
            v-model:page-size="filters.page_size"
            :total-count="rolesData?.count ?? 0"
            :total-pages="totalPages"
          />
        </div>
      </div>

      <!-- Modals -->
      <RolesRoleModal
        v-model:open="isRoleModalOpen"
        :role-item="selectedRole"
        @saved="() => refreshRoles()"
      />

      <CommonConfirmModal
        v-model:open="isDeleteModalOpen"
        title="Delete Role"
        :description="roleToDelete ? `Are you sure you want to delete role '${roleToDelete.name}'? Users assigned to this role will lose their inherited permissions.` : ''"
        confirm-label="Delete Role"
        :loading="isDeleting"
        @confirm="confirmDelete"
      />
    </template>
  </UDashboardPanel>
</template>