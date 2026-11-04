<script setup lang="ts">
import type { Case, CaseClosePayload, StatusEnum } from '~/types/legal'
import { parseCaseActionError } from '~/utils/api-error'

const props = defineProps<{
  open: boolean
  caseItem: Case | null
}>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'closed', caseItem: Case): void
}>()

const isOpen = computed({
  get: () => props.open,
  set: (val: boolean) => emit('update:open', val)
})

const { closeCase } = useCases()
const toast = useToast()

const state = reactive<{
  decision_date: string
  status: StatusEnum
  short_order: string
  today_action: string
}>({
  decision_date: new Date().toISOString().slice(0, 10),
  status: 'DECIDED',
  short_order: '',
  today_action: ''
})

const statusOptions = [
  { label: 'Decided', value: 'DECIDED' },
  { label: 'Disposed', value: 'DISPOSED' },
  { label: 'Consigned', value: 'CONSIGNED' }
]

const loading = ref(false)
const errors = ref<string[]>([])

watch(isOpen, (val) => {
  if (val) {
    errors.value = []
    state.decision_date = new Date().toISOString().slice(0, 10)
    state.status = 'DECIDED'
    state.short_order = ''
    state.today_action = 'Case closed and decided upon final judgment.'
  }
})

async function onSubmit() {
  if (!props.caseItem) return
  loading.value = true
  errors.value = []

  try {
    const res = await closeCase(props.caseItem.case_id, {
      decision_date: state.decision_date,
      status: state.status,
      short_order: state.short_order || undefined,
      today_action: state.today_action || undefined
    })

    toast.add({
      title: 'Case Closed',
      description: `Case ${res.case_number} has been marked as ${res.status}.`,
      color: 'success'
    })

    emit('closed', res)
    isOpen.value = false
  } catch (err) {
    const parsed = parseCaseActionError(err, 'Failed to close case')
    if (parsed.denied) {
      toast.add({ title: 'Action Denied', description: parsed.messages[0], color: 'error' })
      isOpen.value = false
    } else {
      errors.value = parsed.messages
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    title="Close / Decide Case"
    :description="caseItem ? `Record final decision for case: ${caseItem.case_number}` : ''"
  >
    <template #body>
      <form class="space-y-4" @submit.prevent="onSubmit">
        <AppFormErrors :messages="errors" />

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField label="Decision Date" required>
            <UInput v-model="state.decision_date" type="date" class="w-full" />
          </UFormField>

          <UFormField label="Final Status" required>
            <USelect
              v-model="state.status"
              :items="statusOptions"
              value-key="value"
              label-key="label"
              class="w-full"
            />
          </UFormField>
        </div>

        <UFormField label="Today's Action / Final Ruling">
          <UInput v-model="state.today_action" placeholder="Summary of action" class="w-full" />
        </UFormField>

        <UFormField label="Short Order / Detailed Judgment">
          <UTextarea v-model="state.short_order" placeholder="Enter short order details..." :rows="3" class="w-full" />
        </UFormField>

        <div class="flex items-center justify-end gap-2 pt-2">
          <UButton label="Cancel" variant="ghost" color="neutral" @click="isOpen = false" />
          <UButton type="submit" label="Close Case" color="warning" icon="i-lucide-check-circle" :loading="loading" />
        </div>
      </form>
    </template>
  </UModal>
</template>
