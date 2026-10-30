<script setup lang="ts">
import type { Role, Permission } from '~/types/legal'

useHead({ title: 'RBAC Roles & Permissions' })

const { useRolesList, usePermissionsList, deleteRole } = useRbac()
const toast = useToast()

const filters = reactive({
  search: '',
  page: 1,
  page_size: 20
})

const { data: rolesData, status, refresh: refreshRoles } = useRolesList(filters)
const { data: permsData } = usePermissionsList({ page_size: 150 })

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
    toast.add({ title: 'Role deleted', color: 'success' })
    isDeleteModalOpen.value = false
    refreshRoles()
  } catch (err: any) {
    toast.add({ title: 'Failed to delete role', description: err?.message, color: 'error' })
  } finally {
    isDeleting.value = false
  }
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
      <div class="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
        <!-- Roles Grid -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-base font-semibold text-highlighted">System Roles</h2>
              <p class="text-xs text-muted">Configured role profiles with bundled capability permissions</p>
            </div>
            <span class="text-xs text-muted">{{ rolesData?.count ?? 0 }} roles configured</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              v-for="role in rolesData?.results || []"
              :key="role.role_id"
              class="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div class="flex items-start justify-between gap-3 mb-2">
                  <div class="flex items-center gap-2">
                    <span class="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <UIcon name="i-lucide-shield-check" class="size-4" />
                    </span>
                    <div>
                      <h3 class="font-bold text-highlighted text-base">{{ role.name }}</h3>
                      <p class="text-xs text-muted">{{ role.description || 'No description provided' }}</p>
                    </div>
                  </div>

                  <UBadge
                    :label="`${role.permissions?.length || 0} permissions`"
                    size="xs"
                    color="primary"
                    variant="subtle"
                  />
                </div>

                <div class="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                  <span class="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-2">
                    Granted Permissions
                  </span>
                  <div class="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                    <span
                      v-for="p in role.permissions"
                      :key="p.permission_id"
                      class="px-2 py-0.5 rounded text-[11px] font-mono border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-highlighted"
                    >
                      {{ p.code }}
                    </span>
                    <span v-if="!role.permissions?.length" class="text-xs text-muted">No permissions attached</span>
                  </div>
                </div>
              </div>

              <div class="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <UButton
                  label="Edit Role"
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
            </div>
          </div>
        </div>

        <!-- System Permissions Catalog -->
        <div class="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
          <div class="p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <div>
              <h3 class="font-semibold text-highlighted text-sm sm:text-base">System Permissions Catalog</h3>
              <p class="text-xs text-muted">Available atomic authorization tokens defined in backend security</p>
            </div>
            <span class="text-xs text-muted">{{ permsData?.count ?? 0 }} total permissions</span>
          </div>

          <div class="overflow-x-auto max-h-80 overflow-y-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-neutral-50 dark:bg-neutral-800/50 text-muted uppercase tracking-wider font-semibold border-b border-neutral-200 dark:border-neutral-800 sticky top-0">
                <tr>
                  <th class="px-4 py-2.5">Code</th>
                  <th class="px-4 py-2.5">Module</th>
                  <th class="px-4 py-2.5">Description</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
                <tr
                  v-for="p in permsData?.results || []"
                  :key="p.permission_id"
                  class="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40 transition"
                >
                  <td class="px-4 py-2.5 font-bold font-mono text-primary whitespace-nowrap">
                    {{ p.code }}
                  </td>
                  <td class="px-4 py-2.5 whitespace-nowrap font-medium text-highlighted">
                    <UBadge :label="p.module" size="xs" variant="outline" color="neutral" />
                  </td>
                  <td class="px-4 py-2.5 text-muted">
                    {{ p.description || '—' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
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
        :description="roleToDelete ? `Delete role ${roleToDelete.name}? Users assigned to this role will lose its inherited permissions.` : ''"
        confirm-label="Delete Role"
        :loading="isDeleting"
        @confirm="confirmDelete"
      />
    </template>
  </UDashboardPanel>
</template>
