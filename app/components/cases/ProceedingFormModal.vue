<script setup lang="ts">
import type { CaseProceeding, CaseProceedingPayload } from '~/types/legal'
import { ApiError } from '~/utils/api-error'

const props = defineProps<{
  open: boolean
  caseId: string
  defaultCourtId?: string
  proceedingItem?: CaseProceeding | null
}>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'saved', proceeding: CaseProceeding): void
}>()

const isOpen = computed({
  get: () => props.open,
  set: (val: boolean) => emit('update:open', val)
})

const isEditing = computed(() => !!props.proceedingItem)
const { createProceeding, updateProceeding } = useCases()
const refData = useReferenceData()
const toast = useToast()

const courtOptions = ref<{ label: string, value: string }[]>([])
const loading = ref(false)
const errors = ref<string[]>([])
const fieldErrors = ref<Record<string, string[]>>({})

interface ProceedingFormState {
  case: string
  court: string
  proceeding_date: string
  stage: string
  today_action: string
  short_order: string
  is_case_decided: boolean
  next_proceeding_date: string
  next_stage_purpose: string
  sr_no: number
}

const formState = reactive<ProceedingFormState>({
  case: props.caseId,
  court: props.defaultCourtId || '',
  proceeding_date: new Date().toISOString().slice(0, 10),
  stage: '',
  today_action: '',
  short_order: '',
  is_case_decided: false,
  next_proceeding_date: '',
  next_stage_purpose: '',
  sr_no: 1
})

const commonStages = [
  'Institution & Scrutiny',
  'Notice / Summons Issued',
  'Written Statement / Reply',
  'Framing of Issues',
  'Petitioner Evidence',
  'Respondent Evidence',
  'Cross Examination',
  'Final Arguments',
  'Reserved for Judgment',
  'Order / Judgment Pronounced'
]

watch(isOpen, async (val) => {
  if (val) {
    errors.value = []
    fieldErrors.value = {}
    courtOptions.value = await refData.loadCourtOptions()

    if (props.proceedingItem) {
      formState.case = props.proceedingItem.case
      formState.court = props.proceedingItem.court
      formState.proceeding_date = props.proceedingItem.proceeding_date
      formState.stage = props.proceedingItem.stage
      formState.today_action = props.proceedingItem.today_action || ''
      formState.short_order = props.proceedingItem.short_order || ''
      formState.is_case_decided = props.proceedingItem.is_case_decided
      formState.next_proceeding_date = props.proceedingItem.next_proceeding_date || ''
      formState.next_stage_purpose = props.proceedingItem.next_stage_purpose || ''
      formState.sr_no = props.proceedingItem.sr_no || 1
    } else {
      formState.case = props.caseId
      formState.court = props.defaultCourtId || courtOptions.value[0]?.value || ''
      formState.proceeding_date = new Date().toISOString().slice(0, 10)
      formState.stage = 'Final Arguments'
      formState.today_action = ''
      formState.short_order = ''
      formState.is_case_decided = false
      formState.next_proceeding_date = ''
      formState.next_stage_purpose = ''
      formState.sr_no = 1
    }
  }
})

async function onSubmit() {
  loading.value = true
  errors.value = []
  fieldErrors.value = {}

  try {
    const payload: CaseProceedingPayload = {
      ...formState,
      case: props.caseId,
      today_action: formState.today_action || null,
      short_order: formState.short_order || null,
      next_proceeding_date: formState.next_proceeding_date || null,
      next_stage_purpose: formState.next_stage_purpose || null
    }

    let saved: CaseProceeding
    if (isEditing.value && props.proceedingItem) {
      saved = await updateProceeding(props.proceedingItem.proceeding_id, payload)
      toast.add({ title: 'Proceeding updated', color: 'success' })
    } else {
      saved = await createProceeding(payload)
      toast.add({ title: 'Proceeding recorded successfully', color: 'success' })
    }

    emit('saved', saved)
    isOpen.value = false
  } catch (err: any) {
    if (err instanceof ApiError) {
      errors.value = err.messages.length ? err.messages : [err.message]
      fieldErrors.value = err.fields
    } else {
      errors.value = [err?.message || 'Failed to save proceeding']
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="isEditing ? 'Edit Court Proceeding' : 'Record Court Proceeding'"
    :description="isEditing ? 'Update hearing notes and orders' : 'Record hearing details, orders, and adjournments'"
    :ui="{ content: 'max-w-2xl' }"
  >
    <template #body>
      <form class="space-y-4" @submit.prevent="onSubmit">
        <AppFormErrors :messages="errors" />

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          <UFormField label="Proceeding Date" required :error="fieldErrors.proceeding_date?.[0]">
            <UInput v-model="formState.proceeding_date" type="date" class="w-full" />
          </UFormField>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="sm:col-span-2">
            <UFormField label="Current Stage" required :error="fieldErrors.stage?.[0]">
              <UInput
                v-model="formState.stage"
                placeholder="Stage of hearing (e.g. Arguments, Evidence)"
                class="w-full"
              />
            </UFormField>
          </div>

          <UFormField label="Roster / Sr. No" :error="fieldErrors.sr_no?.[0]">
            <UInput v-model.number="formState.sr_no" type="number" class="w-full" />
          </UFormField>
        </div>

        <!-- Quick stage chips -->
        <div class="flex flex-wrap gap-1.5 pt-1">
          <button
            v-for="s in commonStages"
            :key="s"
            type="button"
            class="text-xs px-2 py-0.5 rounded-full border border-neutral-200 dark:border-neutral-700 hover:border-primary text-muted hover:text-primary transition"
            @click="formState.stage = s"
          >
            {{ s }}
          </button>
        </div>

        <UFormField label="Today's Action / Summary" :error="fieldErrors.today_action?.[0]">
          <UInput v-model="formState.today_action" placeholder="What transpired in court today..." class="w-full" />
        </UFormField>

        <UFormField label="Short Order / Minute" :error="fieldErrors.short_order?.[0]">
          <UTextarea v-model="formState.short_order" placeholder="Enter short court order..." :rows="3" class="w-full" />
        </UFormField>

        <div class="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 space-y-3 bg-neutral-50/50 dark:bg-neutral-900/30">
          <label class="flex items-center gap-2 cursor-pointer text-sm font-medium">
            <input
              v-model="formState.is_case_decided"
              type="checkbox"
              class="rounded border-neutral-300 text-primary focus:ring-primary size-4"
            >
            <span>Case decided in this proceeding</span>
          </label>

          <div v-if="!formState.is_case_decided" class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <UFormField label="Next Proceeding Date" :error="fieldErrors.next_proceeding_date?.[0]">
              <UInput v-model="formState.next_proceeding_date" type="date" class="w-full" />
            </UFormField>

            <UFormField label="Next Purpose / Stage" :error="fieldErrors.next_stage_purpose?.[0]">
              <UInput v-model="formState.next_stage_purpose" placeholder="e.g. Cross examination of PW-1" class="w-full" />
            </UFormField>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-3">
          <UButton label="Cancel" variant="ghost" color="neutral" @click="isOpen = false" />
          <UButton type="submit" :label="isEditing ? 'Save Changes' : 'Record Proceeding'" color="primary" :loading="loading" />
        </div>
      </form>
    </template>
  </UModal>
</template>
