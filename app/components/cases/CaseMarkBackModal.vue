<script setup lang="ts">
import type { Case } from '~/types/legal'
import { parseCaseActionError } from '~/utils/api-error'

const props = defineProps<{
  open: boolean
  caseItem: Case | null
}>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'marked-back', caseItem: Case): void
}>()

const isOpen = computed({
  get: () => props.open,
  set: (val: boolean) => emit('update:open', val)
})

const { markBackCase } = useCases()
const toast = useToast()

const remarks = ref('')
const loading = ref(false)
const errors = ref<string[]>([])

const senderName = computed(() => props.caseItem?.marked_by_details?.name || 'the previous officer')

watch(isOpen, (open) => {
  if (open) {
    remarks.value = ''
    errors.value = []
  }
})

async function onSubmit() {
  if (!props.caseItem) return
  loading.value = true
  errors.value = []

  try {
    const res = await markBackCase(props.caseItem.case_id, {
      ...(remarks.value.trim() ? { remarks: remarks.value.trim() } : {})
    })

    toast.add({
      title: 'Case Marked Back',
      description: `Case ${res.case_number} was returned to ${senderName.value}.`,
      color: 'success'
    })

    emit('marked-back', res)
    isOpen.value = false
  } catch (err) {
    const parsed = parseCaseActionError(err, 'Failed to mark case back')
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
    title="Mark Case Back"
    :description="caseItem ? `Return case ${caseItem.case_number} to ${senderName}.` : ''"
  >
    <template #body>
      <form class="space-y-4" @submit.prevent="onSubmit">
        <AppFormErrors :messages="errors" />

        <UFormField label="Remarks" name="remarks">
          <UTextarea
            v-model="remarks"
            placeholder="Add a note for the officer receiving the case back (optional)"
            :rows="3"
            class="w-full"
          />
        </UFormField>

        <div class="flex items-center justify-end gap-2 pt-2">
          <UButton label="Cancel" variant="ghost" color="neutral" @click="isOpen = false" />
          <UButton
            type="submit"
            :label="`Mark Back to ${caseItem?.marked_by_details?.name || 'Sender'}`"
            icon="i-lucide-undo-2"
            color="warning"
            :loading="loading"
          />
        </div>
      </form>
    </template>
  </UModal>
</template>
