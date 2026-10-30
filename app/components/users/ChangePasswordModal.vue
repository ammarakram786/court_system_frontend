<script setup lang="ts">
import { ApiError } from '~/utils/api-error'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'success'): void
}>()

const isOpen = computed({
  get: () => props.open,
  set: (val: boolean) => emit('update:open', val)
})

const { changePassword } = useUsers()
const toast = useToast()

const state = reactive({
  old_password: '',
  new_password: '',
  confirm_password: ''
})

const loading = ref(false)
const errors = ref<string[]>([])
const fieldErrors = ref<Record<string, string[]>>({})

watch(isOpen, (val) => {
  if (val) {
    errors.value = []
    fieldErrors.value = {}
    state.old_password = ''
    state.new_password = ''
    state.confirm_password = ''
  }
})

async function onSubmit() {
  if (state.new_password !== state.confirm_password) {
    errors.value = ['New password and confirmation do not match']
    return
  }

  loading.value = true
  errors.value = []
  fieldErrors.value = {}

  try {
    await changePassword({
      old_password: state.old_password,
      new_password: state.new_password
    })

    toast.add({
      title: 'Password changed successfully',
      description: 'Your password has been updated.',
      color: 'success'
    })

    emit('success')
    isOpen.value = false
  } catch (err: any) {
    if (err instanceof ApiError) {
      errors.value = err.messages.length ? err.messages : [err.message]
      fieldErrors.value = err.fields
    } else {
      errors.value = [err?.message || 'Failed to change password']
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    title="Change Password"
    description="Update your credentials to maintain security"
  >
    <template #body>
      <form class="space-y-4" @submit.prevent="onSubmit">
        <AppFormErrors :messages="errors" />

        <UFormField label="Current Password" required :error="fieldErrors.old_password?.[0]">
          <UInput v-model="state.old_password" type="password" autocomplete="current-password" class="w-full" />
        </UFormField>

        <UFormField label="New Password" required :error="fieldErrors.new_password?.[0]">
          <UInput v-model="state.new_password" type="password" autocomplete="new-password" class="w-full" />
        </UFormField>

        <UFormField label="Confirm New Password" required>
          <UInput v-model="state.confirm_password" type="password" autocomplete="new-password" class="w-full" />
        </UFormField>

        <div class="flex items-center justify-end gap-2 pt-3">
          <UButton label="Cancel" variant="ghost" color="neutral" @click="isOpen = false" />
          <UButton type="submit" label="Update Password" color="primary" icon="i-lucide-key" :loading="loading" />
        </div>
      </form>
    </template>
  </UModal>
</template>
