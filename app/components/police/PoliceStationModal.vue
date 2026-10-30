<script setup lang="ts">
import type { PoliceStation, PoliceStationPayload } from '~/types/legal'
import { ApiError } from '~/utils/api-error'

const props = defineProps<{
  open: boolean
  station?: PoliceStation | null
}>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'saved', station: PoliceStation): void
}>()

const isOpen = computed({
  get: () => props.open,
  set: (val: boolean) => emit('update:open', val)
})

const isEditing = computed(() => !!props.station)
const { createPoliceStation, updatePoliceStation } = usePoliceStations()
const toast = useToast()

interface PoliceFormState {
  name: string
  district: string
  code: string
}

const formState = reactive<PoliceFormState>({
  name: '',
  district: '',
  code: ''
})

const loading = ref(false)
const errors = ref<string[]>([])
const fieldErrors = ref<Record<string, string[]>>({})

watch(isOpen, (val) => {
  if (val) {
    errors.value = []
    fieldErrors.value = {}
    if (props.station) {
      formState.name = props.station.name
      formState.district = props.station.district
      formState.code = props.station.code || ''
    } else {
      formState.name = ''
      formState.district = 'Lahore'
      formState.code = ''
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
      code: formState.code || null
    }

    let saved: PoliceStation
    if (isEditing.value && props.station) {
      saved = await updatePoliceStation(props.station.police_station_id, payload)
      toast.add({ title: 'Police station updated', color: 'success' })
    } else {
      saved = await createPoliceStation(payload)
      toast.add({ title: 'Police station added', color: 'success' })
    }

    emit('saved', saved)
    isOpen.value = false
  } catch (err: any) {
    if (err instanceof ApiError) {
      errors.value = err.messages.length ? err.messages : [err.message]
      fieldErrors.value = err.fields
    } else {
      errors.value = [err?.message || 'Failed to save police station']
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="isEditing ? 'Edit Police Station' : 'Add Police Station'"
    description="Manage police station directory for FIR records"
  >
    <template #body>
      <form class="space-y-4" @submit.prevent="onSubmit">
        <AppFormErrors :messages="errors" />

        <UFormField label="Police Station Name" required :error="fieldErrors.name?.[0]">
          <UInput v-model="formState.name" placeholder="e.g. PS Civil Lines" class="w-full" />
        </UFormField>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField label="District" required :error="fieldErrors.district?.[0]">
            <UInput v-model="formState.district" placeholder="District name" class="w-full" />
          </UFormField>

          <UFormField label="Station Code" :error="fieldErrors.code?.[0]">
            <UInput v-model="formState.code" placeholder="e.g. LHR-CL-01" class="w-full" />
          </UFormField>
        </div>

        <div class="flex items-center justify-end gap-2 pt-3">
          <UButton label="Cancel" variant="ghost" color="neutral" @click="isOpen = false" />
          <UButton type="submit" :label="isEditing ? 'Save Changes' : 'Create Police Station'" color="primary" :loading="loading" />
        </div>
      </form>
    </template>
  </UModal>
</template>
