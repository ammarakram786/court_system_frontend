<script setup lang="ts">
import type { PermissionOverride, PermissionOverridePayload, Permission, EffectEnum } from '~/types/legal'
import { ApiError } from '~/utils/api-error'

const props = defineProps<{
  open: boolean
  userId: string
  userName?: string
  overrideItem?: PermissionOverride | null
}>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'saved', override: PermissionOverride): void
}>()

const isOpen = computed({
  get: () => props.open,
  set: (val: boolean) => emit('update:open', val)
})

const isEditing = computed(() => !!props.overrideItem)
const { createOverride, updateOverride, usePermissionsList } = useRbac()
const auth = useAuthStore()
const toast = useToast()

const { data: permList } = usePermissionsList({ page_size: 100 })
const permOptions = computed(() => {
  return (permList.value?.results || []).map((p: Permission) => ({
    label: `${p.code} (${p.module})`,
    value: p.code
  }))
})

const effectOptions = [
  { label: 'ALLOW (Grant Permission)', value: 'ALLOW' },
  { label: 'DENY (Explicitly Revoke)', value: 'DENY' }
]

interface OverrideFormState {
  user: string
  permission_code: string
  effect: EffectEnum
  reason: string
  granted_by: string
  expires_at: string
}

const formState = reactive<OverrideFormState>({
  user: props.userId,
  permission_code: '',
  effect: 'ALLOW',
  reason: '',
  granted_by: auth.user?.name || 'Administrator',
  expires_at: ''
})

const loading = ref(false)
const errors = ref<string[]>([])
const fieldErrors = ref<Record<string, string[]>>({})

watch(isOpen, (val) => {
  if (val) {
    errors.value = []
    fieldErrors.value = {}
    if (props.overrideItem) {
      formState.user = props.overrideItem.user
      formState.permission_code = props.overrideItem.permission_code
      formState.effect = props.overrideItem.effect
      formState.reason = props.overrideItem.reason
      formState.granted_by = props.overrideItem.granted_by
      formState.expires_at = props.overrideItem.expires_at || ''
    } else {
      formState.user = props.userId
      formState.permission_code = permOptions.value[0]?.value || 'cases:view'
      formState.effect = 'ALLOW'
      formState.reason = ''
      formState.granted_by = auth.user?.name || 'Administrator'
      formState.expires_at = ''
    }
  }
})

async function onSubmit() {
  loading.value = true
  errors.value = []
  fieldErrors.value = {}

  try {
    const payload = {
      ...formState,
      user: props.userId,
      expires_at: formState.expires_at || null
    }

    let saved: PermissionOverride
    if (isEditing.value && props.overrideItem) {
      saved = await updateOverride(props.overrideItem.override_id, payload)
      toast.add({ title: 'Override updated', color: 'success' })
    } else {
      saved = await createOverride(payload)
      toast.add({ title: 'Permission override created', color: 'success' })
    }

    emit('saved', saved)
    isOpen.value = false
  } catch (err: any) {
    if (err instanceof ApiError) {
      errors.value = err.messages.length ? err.messages : [err.message]
      fieldErrors.value = err.fields
    } else {
      errors.value = [err?.message || 'Failed to save override']
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="isEditing ? 'Edit Permission Override' : 'Grant Permission Override'"
    :description="userName ? `Assign individual policy override for ${userName}` : 'Assign individual policy override'"
  >
    <template #body>
      <form class="space-y-4" @submit.prevent="onSubmit">
        <AppFormErrors :messages="errors" />

        <UFormField label="Permission" required :error="fieldErrors.permission_code?.[0]">
          <USelect
            v-model="formState.permission_code"
            :items="permOptions"
            value-key="value"
            label-key="label"
            placeholder="Select Permission"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Effect (ALLOW / DENY)" required :error="fieldErrors.effect?.[0]">
          <USelect
            v-model="formState.effect"
            :items="effectOptions"
            value-key="value"
            label-key="label"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Justification / Reason" required :error="fieldErrors.reason?.[0]">
          <UInput v-model="formState.reason" placeholder="e.g. Temporary assignment on special tribunal" class="w-full" />
        </UFormField>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField label="Granted By" required :error="fieldErrors.granted_by?.[0]">
            <UInput v-model="formState.granted_by" placeholder="Authorizing official" class="w-full" />
          </UFormField>

          <UFormField label="Expiration Date & Time" :error="fieldErrors.expires_at?.[0]">
            <UInput v-model="formState.expires_at" type="datetime-local" class="w-full" />
          </UFormField>
        </div>

        <div class="flex items-center justify-end gap-2 pt-3">
          <UButton label="Cancel" variant="ghost" color="neutral" @click="isOpen = false" />
          <UButton type="submit" :label="isEditing ? 'Save Changes' : 'Grant Override'" color="primary" :loading="loading" />
        </div>
      </form>
    </template>
  </UModal>
</template>
