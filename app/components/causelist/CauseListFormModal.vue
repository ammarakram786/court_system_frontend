<script setup lang="ts">
import type { CauseList, CauseListPayload } from '~/types/legal'
import { ApiError } from '~/utils/api-error'

const props = defineProps<{
  open: boolean
  causeListItem?: CauseList | null
}>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'saved', item: CauseList): void
}>()

const isOpen = computed({
  get: () => props.open,
  set: (val: boolean) => emit('update:open', val)
})

const isEditing = computed(() => !!props.causeListItem)
const { createCauseList, updateCauseList } = useCauseLists()
const refData = useReferenceData()
const toast = useToast()

const courtOptions = ref<{ label: string, value: string }[]>([])
const loading = ref(false)
const errors = ref<string[]>([])
const fieldErrors = ref<Record<string, string[]>>({})

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => ({
  label: d,
  value: d
}))

const formState = reactive<CauseListPayload>({
  court: '',
  cause_list_date: new Date().toISOString().slice(0, 10),
  day_of_week: 'Monday'
})

// Compute day of week automatically from date
function onDateChange(dateStr: string) {
  if (!dateStr) return
  const date = new Date(dateStr)
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const dayName = days[date.getDay()]
  if (dayName) {
    formState.day_of_week = dayName
  }
}

watch(isOpen, async (val) => {
  if (val) {
    errors.value = []
    fieldErrors.value = {}
    courtOptions.value = await refData.loadCourtOptions()

    if (props.causeListItem) {
      formState.court = props.causeListItem.court
      formState.cause_list_date = props.causeListItem.cause_list_date
      formState.day_of_week = props.causeListItem.day_of_week
    } else {
      formState.court = courtOptions.value[0]?.value || ''
      formState.cause_list_date = new Date().toISOString().slice(0, 10)
      onDateChange(formState.cause_list_date)
    }
  }
})

async function onSubmit() {
  loading.value = true
  errors.value = []
  fieldErrors.value = {}

  try {
    let saved: CauseList
    if (isEditing.value && props.causeListItem) {
      saved = await updateCauseList(props.causeListItem.cause_list_id, formState)
      toast.add({ title: 'Cause List updated', color: 'success' })
    } else {
      saved = await createCauseList(formState)
      toast.add({ title: 'Cause List created successfully', color: 'success' })
    }

    emit('saved', saved)
    isOpen.value = false
  } catch (err: any) {
    if (err instanceof ApiError) {
      errors.value = err.messages.length ? err.messages : [err.message]
      fieldErrors.value = err.fields
    } else {
      errors.value = [err?.message || 'Failed to save cause list']
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="isEditing ? 'Edit Cause List' : 'Create Daily Cause List'"
    description="Manage daily court hearing roster schedule"
  >
    <template #body>
      <form class="space-y-4" @submit.prevent="onSubmit">
        <AppFormErrors :messages="errors" />

        <UFormField label="Court" required :error="fieldErrors.court?.[0]">
          <USelect
            v-model="formState.court"
            :items="courtOptions"
            value-key="value"
            label-key="label"
            placeholder="Select Court"
            class="w-full"
          />
        </UFormField>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField label="Cause List Date" required :error="fieldErrors.cause_list_date?.[0]">
            <UInput
              v-model="formState.cause_list_date"
              type="date"
              class="w-full"
              @update:model-value="onDateChange"
            />
          </UFormField>

          <UFormField label="Day of Week" required :error="fieldErrors.day_of_week?.[0]">
            <USelect
              v-model="formState.day_of_week"
              :items="daysOfWeek"
              value-key="value"
              label-key="label"
              class="w-full"
            />
          </UFormField>
        </div>

        <div class="flex items-center justify-end gap-2 pt-3">
          <UButton label="Cancel" variant="ghost" color="neutral" @click="isOpen = false" />
          <UButton type="submit" :label="isEditing ? 'Save Changes' : 'Create Cause List'" color="primary" :loading="loading" />
        </div>
      </form>
    </template>
  </UModal>
</template>
