<script setup lang="ts">
import type { Case } from '~/types/legal'
import { parseCaseActionError } from '~/utils/api-error'

const props = defineProps<{
  open: boolean
  caseItem: Case | null
}>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'marked', caseItem: Case): void
}>()

const isOpen = computed({
  get: () => props.open,
  set: (val: boolean) => emit('update:open', val)
})

const { markCase } = useCases()
const refData = useReferenceData()
const toast = useToast()

const officerOptions = ref<{ label: string, value: string }[]>([])
const state = reactive({ to_user_id: '', remarks: '' })

const loading = ref(false)
const loadingOfficers = ref(false)
const errors = ref<string[]>([])
const fieldErrors = ref<Record<string, string[]>>({})

watch(isOpen, async (open) => {
  if (!open) return
  errors.value = []
  fieldErrors.value = {}
  state.to_user_id = ''
  state.remarks = ''

  loadingOfficers.value = true
  try {
    const officers = await refData.loadOfficerOptions()
    // The current assignee cannot be the target of a re-mark
    officerOptions.value = officers.filter(o => o.value !== props.caseItem?.assigned_case_officer)
  } finally {
    loadingOfficers.value = false
  }
})

async function onSubmit() {
  if (!props.caseItem) return
  if (!state.to_user_id) {
    fieldErrors.value = { to_user_id: ['Select the officer to mark this case to.'] }
    return
  }

  loading.value = true
  errors.value = []
  fieldErrors.value = {}

  try {
    const res = await markCase(props.caseItem.case_id, {
      to_user_id: state.to_user_id,
      remarks: state.remarks.trim() || undefined
    })

    const target = officerOptions.value.find(o => o.value === state.to_user_id)?.label
    toast.add({
      title: 'Case Marked',
      description: `Case ${res.case_number} has been marked${target ? ` to ${target}` : ''}.`,
      color: 'success'
    })

    emit('marked', res)
    isOpen.value = false
  } catch (err) {
    const parsed = parseCaseActionError(err, 'Failed to mark case')
    if (parsed.denied) {
      toast.add({ title: 'Action Denied', description: parsed.messages[0], color: 'error' })
      isOpen.value = false
    } else {
      errors.value = parsed.messages
      fieldErrors.value = parsed.fields
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    title="Mark Case To Officer"
    :description="caseItem ? `Reassign case ${caseItem.case_number}. You will lose working rights once it is marked.` : ''"
  >
    <template #body>
      <form class="space-y-4" @submit.prevent="onSubmit">
        <AppFormErrors :messages="errors" />

        <UFormField
          label="Mark To"
          name="to_user_id"
          required
          :error="fieldErrors.to_user_id?.[0] || fieldErrors.to_user?.[0]"
        >
          <USelect
            v-model="state.to_user_id"
            :items="officerOptions"
            value-key="value"
            label-key="label"
            :loading="loadingOfficers"
            placeholder="Select officer"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Instructions / Remarks" name="remarks" :error="fieldErrors.remarks?.[0]">
          <UTextarea
            v-model="state.remarks"
            placeholder="Instructions for the receiving officer (optional)"
            :rows="3"
            class="w-full"
          />
        </UFormField>

        <div class="flex items-center justify-end gap-2 pt-2">
          <UButton label="Cancel" variant="ghost" color="neutral" @click="isOpen = false" />
          <UButton
            type="submit"
            label="Mark Case"
            icon="i-lucide-arrow-right-circle"
            color="primary"
            :loading="loading"
          />
        </div>
      </form>
    </template>
  </UModal>
</template>
