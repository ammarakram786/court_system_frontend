<script setup lang="ts">
import type { Role, RolePayload, Permission } from '~/types/legal'
import { ApiError } from '~/utils/api-error'

const props = defineProps<{
  open: boolean
  roleItem?: Role | null
}>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'saved', role: Role): void
}>()

const isOpen = computed({
  get: () => props.open,
  set: (val: boolean) => emit('update:open', val)
})

const isEditing = computed(() => !!props.roleItem)
const { createRole, updateRole, usePermissionsList } = useRbac()
const toast = useToast()

// Fetch all available permissions for role capability assignment
const { data: permsData, status: permsStatus } = usePermissionsList({ page_size: 250 })
const allPermissions = computed<Permission[]>(() => permsData.value?.results || [])

// Normalization helpers for permissions
function getPermModule(p: Permission): string {
  return p.module || p.module_name || p.app_name || 'General'
}

function getPermCode(p: Permission): string {
  return p.code || p.code_name || ''
}

function getPermName(p: Permission): string {
  return p.name || p.code || p.code_name || ''
}

const moduleIcons: Record<string, string> = {
  Role: 'i-lucide-shield-check',
  User: 'i-lucide-user-cog',
  Organization: 'i-lucide-building-2',
  Rank: 'i-lucide-award',
  Appointment: 'i-lucide-briefcase',
  Permission: 'i-lucide-key-round',
  PermissionOverride: 'i-lucide-lock',
  Court: 'i-lucide-landmark',
  PoliceStation: 'i-lucide-shield-alert',
  Case: 'i-lucide-scale',
  CaseParty: 'i-lucide-users',
  CaseProceeding: 'i-lucide-gavel',
  CaseCategory: 'i-lucide-tags',
  CauseList: 'i-lucide-calendar-days',
  CauseListItem: 'i-lucide-list-ordered'
}

function getModuleIcon(mod: string): string {
  return moduleIcons[mod] || 'i-lucide-folder'
}

const permissionSearch = ref('')
const openGroups = ref<Record<string, boolean>>({})

// Group permissions by module
const groupedPermissions = computed(() => {
  const groups: Record<string, Permission[]> = {}
  for (const p of allPermissions.value) {
    const mod = getPermModule(p)
    if (!groups[mod]) groups[mod] = []
    groups[mod]!.push(p)
  }
  return groups
})

// Filtered grouped permissions based on permissionSearch
const filteredGroupedPermissions = computed(() => {
  const q = permissionSearch.value.trim().toLowerCase()
  if (!q) return groupedPermissions.value

  const filtered: Record<string, Permission[]> = {}
  for (const [mod, perms] of Object.entries(groupedPermissions.value)) {
    const matching = perms.filter((p) => {
      const code = getPermCode(p).toLowerCase()
      const name = getPermName(p).toLowerCase()
      const desc = (p.description || '').toLowerCase()
      const moduleName = mod.toLowerCase()
      return code.includes(q) || name.includes(q) || desc.includes(q) || moduleName.includes(q)
    })
    if (matching.length > 0) {
      filtered[mod] = matching
    }
  }
  return filtered
})

const sortedModuleNames = computed(() => {
  return Object.keys(filteredGroupedPermissions.value).sort((a, b) => a.localeCompare(b))
})

// Auto-expand groups when user searches for specific capabilities
watch(permissionSearch, (val) => {
  if (val.trim()) {
    for (const mod of sortedModuleNames.value) {
      openGroups.value[mod] = true
    }
  }
})

const formState = reactive<{
  name: string
  description: string
  permission_ids: string[]
}>({
  name: '',
  description: '',
  permission_ids: []
})

const loading = ref(false)
const errors = ref<string[]>([])
const fieldErrors = ref<Record<string, string[]>>({})

watch(isOpen, (val) => {
  if (val) {
    errors.value = []
    fieldErrors.value = {}
    permissionSearch.value = ''
    openGroups.value = {}

    if (props.roleItem) {
      formState.name = props.roleItem.name
      formState.description = props.roleItem.description || ''
      formState.permission_ids = (props.roleItem.permissions || []).map((p) => p.permission_id)

      // When editing an existing role, auto-expand groups that have active granted permissions
      const grantedSet = new Set(formState.permission_ids)
      for (const [mod, perms] of Object.entries(groupedPermissions.value)) {
        if (perms.some((p) => grantedSet.has(p.permission_id))) {
          openGroups.value[mod] = true
        }
      }
    } else {
      // Create mode: clean reset with all groups collapsable
      formState.name = ''
      formState.description = ''
      formState.permission_ids = []
      openGroups.value = {}
    }
  }
})

function isGroupOpen(mod: string): boolean {
  return !!openGroups.value[mod]
}

function toggleGroup(mod: string) {
  openGroups.value[mod] = !openGroups.value[mod]
}

function expandAll() {
  for (const mod of sortedModuleNames.value) {
    openGroups.value[mod] = true
  }
}

function collapseAll() {
  for (const mod of sortedModuleNames.value) {
    openGroups.value[mod] = false
  }
}

const areAllExpanded = computed(() => {
  const mods = sortedModuleNames.value
  if (!mods.length) return false
  return mods.every((m) => openGroups.value[m])
})

function togglePermission(permId: string) {
  const idx = formState.permission_ids.indexOf(permId)
  if (idx > -1) {
    formState.permission_ids.splice(idx, 1)
  } else {
    formState.permission_ids.push(permId)
  }
}

function isModuleAllSelected(perms: Permission[]): boolean {
  if (!perms.length) return false
  return perms.every((p) => formState.permission_ids.includes(p.permission_id))
}

function getModuleSelectedCount(perms: Permission[]): number {
  return perms.filter((p) => formState.permission_ids.includes(p.permission_id)).length
}

function toggleSelectModule(perms: Permission[]) {
  const allSelected = isModuleAllSelected(perms)
  const ids = perms.map((p) => p.permission_id)
  if (allSelected) {
    formState.permission_ids = formState.permission_ids.filter((id) => !ids.includes(id))
  } else {
    for (const id of ids) {
      if (!formState.permission_ids.includes(id)) {
        formState.permission_ids.push(id)
      }
    }
  }
}

function selectAllPermissions() {
  const allIds = allPermissions.value.map((p) => p.permission_id)
  formState.permission_ids = Array.from(new Set([...formState.permission_ids, ...allIds]))
}

function clearAllPermissions() {
  formState.permission_ids = []
}

async function onSubmit() {
  loading.value = true
  errors.value = []
  fieldErrors.value = {}

  if (!formState.name.trim()) {
    fieldErrors.value = { name: ['Role name is required'] }
    loading.value = false
    return
  }

  try {
    const payload: RolePayload = {
      name: formState.name.trim(),
      description: formState.description?.trim() || null,
      permission_ids: formState.permission_ids
    }

    let saved: Role
    if (isEditing.value && props.roleItem) {
      saved = await updateRole(props.roleItem.role_id, payload)
      toast.add({ title: 'Role updated successfully', color: 'success' })
    } else {
      saved = await createRole(payload)
      toast.add({ title: 'Role created successfully', color: 'success' })
    }

    emit('saved', saved)
    isOpen.value = false
  } catch (err: any) {
    if (err instanceof ApiError) {
      errors.value = err.messages.length ? err.messages : [err.message]
      fieldErrors.value = err.fields
    } else {
      errors.value = [err?.message || 'Failed to save role']
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="isEditing ? `Edit RBAC Role: ${roleItem?.name}` : 'Create RBAC Role'"
    description="Configure role identity and assign capability permissions grouped by functional module"
    :ui="{ content: 'max-w-3xl sm:max-w-4xl' }"
  >
    <template #body>
      <form class="space-y-5" @submit.prevent="onSubmit">
        <AppFormErrors :messages="errors" />

        <!-- Role Credentials -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <UFormField label="Role Name" required :error="fieldErrors.name?.[0]">
            <UInput
              v-model="formState.name"
              placeholder="e.g. Court Registrar, Legal Officer"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Description" :error="fieldErrors.description?.[0]">
            <UInput
              v-model="formState.description"
              placeholder="Operational responsibilities and scope..."
              class="w-full"
            />
          </UFormField>
        </div>

        <!-- Permissions Section -->
        <div class="pt-2 border-t border-neutral-200 dark:border-neutral-800 space-y-3">
          <!-- Permissions Header & Controls -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-50 dark:bg-neutral-800/40 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800">
            <div>
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-shield-check" class="size-4 text-primary" />
                <h4 class="text-xs font-bold uppercase tracking-wider text-highlighted">
                  Permissions Matrix
                </h4>
                <UBadge
                  :label="`${formState.permission_ids.length} of ${allPermissions.length} granted`"
                  size="xs"
                  :color="formState.permission_ids.length > 0 ? 'primary' : 'neutral'"
                  variant="subtle"
                />
              </div>
              <p class="text-[11px] text-muted mt-0.5">
                Grouped by module. Click any group header to expand or collapse.
              </p>
            </div>

            <!-- Toolbar actions -->
            <div class="flex items-center flex-wrap gap-1.5">
              <UInput
                v-model="permissionSearch"
                placeholder="Search capabilities..."
                icon="i-lucide-search"
                size="xs"
                class="w-full sm:w-48"
              />
              <UButton
                :label="areAllExpanded ? 'Collapse All' : 'Expand All'"
                :icon="areAllExpanded ? 'i-lucide-chevrons-up' : 'i-lucide-chevrons-down'"
                size="xs"
                variant="outline"
                color="neutral"
                @click="areAllExpanded ? collapseAll() : expandAll()"
              />
              <UButton
                label="Select All"
                icon="i-lucide-check-check"
                size="xs"
                variant="ghost"
                color="primary"
                @click="selectAllPermissions"
              />
              <UButton
                v-if="formState.permission_ids.length > 0"
                label="Clear"
                icon="i-lucide-x"
                size="xs"
                variant="ghost"
                color="neutral"
                @click="clearAllPermissions"
              />
            </div>
          </div>

          <!-- Collapsible Groups Accordion Container -->
          <div class="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
            <div
              v-for="mod in sortedModuleNames"
              :key="mod"
              class="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-white dark:bg-neutral-900 transition-shadow"
            >
              <!-- Collapsible Group Header -->
              <div
                class="flex items-center justify-between p-3 cursor-pointer select-none bg-neutral-50/60 dark:bg-neutral-800/30 hover:bg-neutral-100/80 dark:hover:bg-neutral-800/70 transition"
                @click="toggleGroup(mod)"
              >
                <div class="flex items-center gap-2.5 min-w-0">
                  <UIcon
                    name="i-lucide-chevron-right"
                    class="size-4 text-muted transition-transform duration-200 shrink-0"
                    :class="{ 'rotate-90': isGroupOpen(mod) }"
                  />
                  <span class="size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <UIcon :name="getModuleIcon(mod)" class="size-4" />
                  </span>
                  <div class="truncate">
                    <span class="font-bold text-highlighted text-xs sm:text-sm">{{ mod }}</span>
                    <span class="text-[11px] text-muted ml-2">
                      ({{ filteredGroupedPermissions[mod]?.length || 0 }} tokens)
                    </span>
                  </div>
                </div>

                <div class="flex items-center gap-2 shrink-0" @click.stop>
                  <UBadge
                    :label="`${getModuleSelectedCount(filteredGroupedPermissions[mod] || [])} / ${filteredGroupedPermissions[mod]?.length || 0}`"
                    size="xs"
                    :color="isModuleAllSelected(filteredGroupedPermissions[mod] || []) ? 'primary' : getModuleSelectedCount(filteredGroupedPermissions[mod] || []) > 0 ? 'info' : 'neutral'"
                    :variant="isModuleAllSelected(filteredGroupedPermissions[mod] || []) ? 'solid' : 'subtle'"
                  />
                  <UButton
                    :label="isModuleAllSelected(filteredGroupedPermissions[mod] || []) ? 'Deselect All' : 'Select All'"
                    size="xs"
                    variant="ghost"
                    color="neutral"
                    class="text-xs"
                    @click="toggleSelectModule(filteredGroupedPermissions[mod] || [])"
                  />
                </div>
              </div>

              <!-- Collapsible Group Body -->
              <div
                v-show="isGroupOpen(mod)"
                class="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/20 dark:bg-neutral-950/20"
              >
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div
                    v-for="p in filteredGroupedPermissions[mod] || []"
                    :key="p.permission_id"
                    class="flex items-start gap-2.5 p-2.5 rounded-lg border transition cursor-pointer select-none"
                    :class="formState.permission_ids.includes(p.permission_id)
                      ? 'border-primary/50 bg-primary/5 dark:bg-primary/10 dark:border-primary/50 shadow-xs'
                      : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700'"
                    @click="togglePermission(p.permission_id)"
                  >
                    <input
                      type="checkbox"
                      :checked="formState.permission_ids.includes(p.permission_id)"
                      class="mt-0.5 rounded border-neutral-300 text-primary focus:ring-primary size-4 shrink-0 cursor-pointer"
                      @click.stop="togglePermission(p.permission_id)"
                    >
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-1.5 flex-wrap">
                        <span class="font-mono text-xs font-semibold text-primary">
                          {{ getPermCode(p) }}
                        </span>
                        <span
                          v-if="getPermName(p) && getPermName(p) !== getPermCode(p)"
                          class="text-xs font-medium text-highlighted"
                        >
                          · {{ getPermName(p) }}
                        </span>
                      </div>
                      <p v-if="p.description" class="text-[11px] text-muted line-clamp-2 mt-0.5">
                        {{ p.description }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Empty permissions filter search state -->
            <div
              v-if="sortedModuleNames.length === 0"
              class="text-center py-8 text-xs text-muted border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl"
            >
              No permissions found matching "{{ permissionSearch }}".
            </div>
          </div>
        </div>

        <!-- Form Actions -->
        <div class="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
          <UButton label="Cancel" variant="ghost" color="neutral" @click="isOpen = false" />
          <UButton
            type="submit"
            :label="isEditing ? 'Save Changes' : 'Create Role'"
            icon="i-lucide-shield-check"
            color="primary"
            :loading="loading"
          />
        </div>
      </form>
    </template>
  </UModal>
</template>