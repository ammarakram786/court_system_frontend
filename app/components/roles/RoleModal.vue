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

const { data: permsData } = usePermissionsList({ page_size: 150 })
const allPermissions = computed(() => permsData.value?.results || [])

// Group permissions by module
const groupedPermissions = computed(() => {
  const groups: Record<string, Permission[]> = {}
  for (const p of allPermissions.value) {
    if (!groups[p.module]) groups[p.module] = []
    groups[p.module]!.push(p)
  }
  return groups
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
    if (props.roleItem) {
      formState.name = props.roleItem.name
      formState.description = props.roleItem.description || ''
      formState.permission_ids = props.roleItem.permissions.map(p => p.permission_id)
    } else {
      formState.name = ''
      formState.description = ''
      formState.permission_ids = []
    }
  }
})

function togglePermission(permId: string) {
  const idx = formState.permission_ids.indexOf(permId)
  if (idx > -1) {
    formState.permission_ids.splice(idx, 1)
  } else {
    formState.permission_ids.push(permId)
  }
}

function selectAllModule(modulePerms: Permission[]) {
  const ids = modulePerms.map(p => p.permission_id)
  const allSelected = ids.every(id => formState.permission_ids.includes(id))
  if (allSelected) {
    formState.permission_ids = formState.permission_ids.filter(id => !ids.includes(id))
  } else {
    for (const id of ids) {
      if (!formState.permission_ids.includes(id)) {
        formState.permission_ids.push(id)
      }
    }
  }
}

async function onSubmit() {
  loading.value = true
  errors.value = []
  fieldErrors.value = {}

  try {
    const payload: RolePayload = {
      name: formState.name,
      description: formState.description || null,
      permission_ids: formState.permission_ids
    }

    let saved: Role
    if (isEditing.value && props.roleItem) {
      saved = await updateRole(props.roleItem.role_id, payload)
      toast.add({ title: 'Role updated', color: 'success' })
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
    :title="isEditing ? 'Edit RBAC Role' : 'Create RBAC Role'"
    description="Configure role details and grant system capability permissions"
    :ui="{ content: 'max-w-2xl' }"
  >
    <template #body>
      <form class="space-y-4" @submit.prevent="onSubmit">
        <AppFormErrors :messages="errors" />

        <UFormField label="Role Name" required :error="fieldErrors.name?.[0]">
          <UInput v-model="formState.name" placeholder="e.g. Court Registrar, Legal Officer" class="w-full" />
        </UFormField>

        <UFormField label="Description" :error="fieldErrors.description?.[0]">
          <UInput v-model="formState.description" placeholder="Role duties and scope..." class="w-full" />
        </UFormField>

        <div class="border-t border-neutral-200 dark:border-neutral-800 pt-4">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-xs font-semibold uppercase tracking-wider text-muted">Permissions Matrix</h4>
            <span class="text-xs text-muted">{{ formState.permission_ids.length }} selected</span>
          </div>

          <div class="space-y-4 max-h-72 overflow-y-auto pr-1">
            <div
              v-for="(perms, moduleName) in groupedPermissions"
              :key="moduleName"
              class="rounded-lg border border-neutral-200 dark:border-neutral-800 p-3 bg-neutral-50/50 dark:bg-neutral-900/40"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-bold uppercase tracking-wider text-primary">{{ moduleName }}</span>
                <button
                  type="button"
                  class="text-xs text-muted hover:text-primary transition"
                  @click="selectAllModule(perms)"
                >
                  Toggle All
                </button>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label
                  v-for="p in perms"
                  :key="p.permission_id"
                  class="flex items-start gap-2 p-1.5 rounded cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs"
                >
                  <input
                    type="checkbox"
                    :checked="formState.permission_ids.includes(p.permission_id)"
                    class="mt-0.5 rounded border-neutral-300 text-primary focus:ring-primary size-3.5"
                    @change="togglePermission(p.permission_id)"
                  >
                  <div>
                    <span class="font-medium text-highlighted block">{{ p.code }}</span>
                    <span v-if="p.description" class="text-muted text-[11px] block">{{ p.description }}</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-3">
          <UButton label="Cancel" variant="ghost" color="neutral" @click="isOpen = false" />
          <UButton type="submit" :label="isEditing ? 'Save Changes' : 'Create Role'" color="primary" :loading="loading" />
        </div>
      </form>
    </template>
  </UModal>
</template>
