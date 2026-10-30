<script setup lang="ts">
import type { Court, CourtPayload } from '~/types/legal'
import { ApiError } from '~/utils/api-error'

const props = defineProps<{
  open: boolean
  courtItem?: Court | null
}>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'saved', court: Court): void
}>()

const isOpen = computed({
  get: () => props.open,
  set: (val: boolean) => emit('update:open', val)
})

const isEditing = computed(() => !!props.courtItem)
const { createCourt, updateCourt } = useCourts()
const toast = useToast()

interface CourtFormState {
  district: string
  court_name: string
  presiding_officer: string
  designation: string
  court_room_no: string
  is_active: boolean
}

const formState = reactive<CourtFormState>({
  district: '',
  court_name: '',
  presiding_officer: '',
  designation: 'Civil Judge / Judicial Magistrate',
  court_room_no: '',
  is_active: true
})

const loading = ref(false)
const errors = ref<string[]>([])
const fieldErrors = ref<Record<string, string[]>>({})

watch(isOpen, (val) => {
  if (val) {
    errors.value = []
    fieldErrors.value = {}
    if (props.courtItem) {
      formState.district = props.courtItem.district
      formState.court_name = props.courtItem.court_name
      formState.presiding_officer = props.courtItem.presiding_officer
      formState.designation = props.courtItem.designation
      formState.court_room_no = props.courtItem.court_room_no || ''
      formState.is_active = props.courtItem.is_active
    } else {
      formState.district = 'Lahore'
      formState.court_name = ''
      formState.presiding_officer = ''
      formState.designation = 'Civil Judge / Judicial Magistrate'
      formState.court_room_no = ''
      formState.is_active = true
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
      court_room_no: formState.court_room_no || null
    }

    let saved: Court
    if (isEditing.value && props.courtItem) {
      saved = await updateCourt(props.courtItem.court_id, payload)
      toast.add({ title: 'Court updated successfully', color: 'success' })
    } else {
      saved = await createCourt(payload)
      toast.add({ title: 'Court added successfully', color: 'success' })
    }

    emit('saved', saved)
    isOpen.value = false
  } catch (err: any) {
    if (err instanceof ApiError) {
      errors.value = err.messages.length ? err.messages : [err.message]
      fieldErrors.value = err.fields
    } else {
      errors.value = [err?.message || 'Failed to save court']
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="isEditing ? 'Edit Court' : 'Add New Court'"
    description="Manage judicial benches and court room directory"
  >
    <template #body>
      <form class="space-y-4" @submit.prevent="onSubmit">
        <AppFormErrors :messages="errors" />

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField label="Court Name" required :error="fieldErrors.court_name?.[0]">
            <UInput v-model="formState.court_name" placeholder="e.g. Court of Senior Civil Judge" class="w-full" />
          </UFormField>

          <UFormField label="District" required :error="fieldErrors.district?.[0]">
            <UInput v-model="formState.district" placeholder="e.g. Lahore, Rawalpindi" class="w-full" />
          </UFormField>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField label="Presiding Officer" required :error="fieldErrors.presiding_officer?.[0]">
            <UInput v-model="formState.presiding_officer" placeholder="Name of Judge / Magistrate" class="w-full" />
          </UFormField>

          <UFormField label="Designation" required :error="fieldErrors.designation?.[0]">
            <UInput v-model="formState.designation" placeholder="e.g. Additional Sessions Judge" class="w-full" />
          </UFormField>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <UFormField label="Court Room No." :error="fieldErrors.court_room_no?.[0]">
            <UInput v-model="formState.court_room_no" placeholder="e.g. Room 12, 2nd Floor" class="w-full" />
          </UFormField>

          <div class="pt-6">
            <label class="flex items-center gap-2 cursor-pointer text-sm font-medium">
              <input
                v-model="formState.is_active"
                type="checkbox"
                class="rounded border-neutral-300 text-primary focus:ring-primary size-4"
              >
              <span>Court is currently active</span>
            </label>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-3">
          <UButton label="Cancel" variant="ghost" color="neutral" @click="isOpen = false" />
          <UButton type="submit" :label="isEditing ? 'Save Changes' : 'Create Court'" color="primary" :loading="loading" />
        </div>
      </form>
    </template>
  </UModal>
</template>
