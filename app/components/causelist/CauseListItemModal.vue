<script setup lang="ts">
import type { CauseListItem, CauseListItemPayload, Case, CaseProceeding } from '~/types/legal'
import type { Paginated } from '~/types/api'
import { ApiError } from '~/utils/api-error'

const props = defineProps<{
  open: boolean
  causeListId: string
  item?: CauseListItem | null
}>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'saved', item: CauseListItem): void
}>()

const isOpen = computed({
  get: () => props.open,
  set: (val: boolean) => emit('update:open', val)
})

const isEditing = computed(() => !!props.item)
const { createCauseListItem, updateCauseListItem } = useCauseLists()
const { api } = useApi()
const toast = useToast()

const casesList = ref<{ label: string, value: string }[]>([])
const proceedingsList = ref<{ label: string, value: string }[]>([])
const loading = ref(false)
const errors = ref<string[]>([])
const fieldErrors = ref<Record<string, string[]>>({})

const commonHeadings = [
  'FOR ADMISSION',
  'FOR ORDERS',
  'FOR NOTICE',
  'FOR ARGUMENTS',
  'FOR EVIDENCE',
  'FINAL DISPOSAL'
]

const formState = reactive<CauseListItemPayload>({
  cause_list: props.causeListId,
  case: '',
  proceeding: '',
  roster_sr_no: 1,
  category_heading: 'FOR ARGUMENTS'
})

// Load cases
async function loadCases() {
  try {
    const res = await api<Paginated<Case>>('/cases/', { query: { page_size: 50, ordering: '-created_at' } })
    casesList.value = (res.results || []).map(c => ({
      label: `${c.case_number} - ${c.case_title.slice(0, 40)}`,
      value: c.case_id
    }))
  } catch {
    casesList.value = []
  }
}

// Load proceedings for selected case
async function loadProceedingsForCase(caseId: string) {
  if (!caseId) {
    proceedingsList.value = []
    return
  }
  try {
    const res = await api<Paginated<CaseProceeding>>('/case-proceedings/', {
      query: { case: caseId, page_size: 30, ordering: '-proceeding_date' }
    })
    proceedingsList.value = (res.results || []).map(p => ({
      label: `${p.proceeding_date} - ${p.stage}`,
      value: p.proceeding_id
    }))
    if (proceedingsList.value.length > 0 && !formState.proceeding) {
      formState.proceeding = proceedingsList.value[0]?.value || ''
    }
  } catch {
    proceedingsList.value = []
  }
}

watch(isOpen, async (val) => {
  if (val) {
    errors.value = []
    fieldErrors.value = {}
    await loadCases()

    if (props.item) {
      formState.cause_list = props.item.cause_list
      formState.case = props.item.case
      formState.proceeding = props.item.proceeding
      formState.roster_sr_no = props.item.roster_sr_no
      formState.category_heading = props.item.category_heading
      await loadProceedingsForCase(props.item.case)
    } else {
      formState.cause_list = props.causeListId
      formState.case = casesList.value[0]?.value || ''
      formState.roster_sr_no = 1
      formState.category_heading = 'FOR ARGUMENTS'
      if (formState.case) {
        await loadProceedingsForCase(formState.case)
      }
    }
  }
})

watch(() => formState.case, (newCaseId) => {
  if (newCaseId) {
    loadProceedingsForCase(newCaseId)
  }
})

async function onSubmit() {
  loading.value = true
  errors.value = []
  fieldErrors.value = {}

  try {
    let saved: CauseListItem
    if (isEditing.value && props.item) {
      saved = await updateCauseListItem(props.item.item_id, formState)
      toast.add({ title: 'Roster item updated', color: 'success' })
    } else {
      saved = await createCauseListItem(formState)
      toast.add({ title: 'Item added to roster', color: 'success' })
    }

    emit('saved', saved)
    isOpen.value = false
  } catch (err: any) {
    if (err instanceof ApiError) {
      errors.value = err.messages.length ? err.messages : [err.message]
      fieldErrors.value = err.fields
    } else {
      errors.value = [err?.message || 'Failed to save roster item']
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="isEditing ? 'Edit Roster Item' : 'Add Item to Cause List'"
    description="Assign a case and proceeding to this court day's roster"
  >
    <template #body>
      <form class="space-y-4" @submit.prevent="onSubmit">
        <AppFormErrors :messages="errors" />

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <UFormField label="Roster Sr. #" required :error="fieldErrors.roster_sr_no?.[0]">
            <UInput v-model.number="formState.roster_sr_no" type="number" class="w-full" />
          </UFormField>

          <div class="sm:col-span-2">
            <UFormField label="Category Heading" required :error="fieldErrors.category_heading?.[0]">
              <UInput v-model="formState.category_heading" placeholder="e.g. FOR ARGUMENTS" class="w-full" />
            </UFormField>
          </div>
        </div>

        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="h in commonHeadings"
            :key="h"
            type="button"
            class="text-xs px-2 py-0.5 rounded-full border border-neutral-200 dark:border-neutral-700 hover:border-primary text-muted hover:text-primary transition"
            @click="formState.category_heading = h"
          >
            {{ h }}
          </button>
        </div>

        <UFormField label="Case" required :error="fieldErrors.case?.[0]">
          <USelect
            v-model="formState.case"
            :items="casesList"
            value-key="value"
            label-key="label"
            placeholder="Select Case"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Court Proceeding" required :error="fieldErrors.proceeding?.[0]">
          <USelect
            v-model="formState.proceeding"
            :items="proceedingsList"
            value-key="value"
            label-key="label"
            placeholder="Select Proceeding"
            class="w-full"
          />
        </UFormField>

        <div class="flex items-center justify-end gap-2 pt-3">
          <UButton label="Cancel" variant="ghost" color="neutral" @click="isOpen = false" />
          <UButton type="submit" :label="isEditing ? 'Save Changes' : 'Add to Roster'" color="primary" :loading="loading" />
        </div>
      </form>
    </template>
  </UModal>
</template>
