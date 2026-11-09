<script setup lang="ts">
import type { Case, CasePayload, StatusEnum } from '~/types/legal'
import { ApiError } from '~/utils/api-error'

const props = defineProps<{
  open: boolean
  caseItem?: Case | null
}>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'saved', item: Case): void
}>()

const isOpen = computed({
  get: () => props.open,
  set: (val: boolean) => emit('update:open', val)
})

const isEditing = computed(() => !!props.caseItem)
const { createCase, updateCase } = useCases()
const refData = useReferenceData()
const toast = useToast()

const courtOptions = ref<{ label: string, value: string }[]>([])
const categoryOptions = ref<{ label: string, value: string }[]>([])
const orgOptions = ref<{ label: string, value: string }[]>([])
const officerOptions = ref<{ label: string, value: string }[]>([])
const policeStationOptions = ref<{ label: string, value: string }[]>([])

const statusOptions = [
  { label: 'Pending', value: 'PENDING' },
  { label: 'Decided', value: 'DECIDED' },
  { label: 'Disposed', value: 'DISPOSED' },
  { label: 'Transferred', value: 'TRANSFERRED' },
  { label: 'Consigned', value: 'CONSIGNED' }
]

interface CaseFormState {
  case_number: string
  case_title: string
  court: string
  category: string
  managing_organization: string
  institution_date: string
  assigned_case_officer: string
  institution_number: string
  police_station: string
  fir_number: string
  fir_year: number | undefined
  offence_sections: string
  status: StatusEnum
  decision_date: string
}

const formState = reactive<CaseFormState>({
  case_number: '',
  case_title: '',
  court: '',
  category: '',
  managing_organization: '',
  institution_date: new Date().toISOString().slice(0, 10),
  assigned_case_officer: '',
  institution_number: '',
  police_station: '',
  fir_number: '',
  fir_year: undefined,
  offence_sections: '',
  status: 'PENDING',
  decision_date: ''
})

const loading = ref(false)
const errors = ref<string[]>([])
const fieldErrors = ref<Record<string, string[]>>({})

// Load reference lookups when modal opens
watch(isOpen, async (open) => {
  if (open) {
    errors.value = []
    fieldErrors.value = {}
    const [courts, cats, orgs, officers, police] = await Promise.all([
      refData.loadCourtOptions(),
      refData.loadCategoryOptions(),
      refData.loadOrganizationOptions(),
      refData.loadOfficerOptions(),
      refData.loadPoliceStationOptions()
    ])
    courtOptions.value = courts
    categoryOptions.value = cats
    orgOptions.value = orgs
    officerOptions.value = [{ label: 'None (Unassigned)', value: '' }, ...officers]
    policeStationOptions.value = [{ label: 'None', value: '' }, ...police]

    if (props.caseItem) {
      formState.case_number = props.caseItem.case_number
      formState.case_title = props.caseItem.case_title
      formState.court = props.caseItem.court
      formState.category = props.caseItem.category
      formState.managing_organization = props.caseItem.managing_organization
      formState.institution_date = props.caseItem.institution_date
      formState.assigned_case_officer = props.caseItem.assigned_case_officer || ''
      formState.institution_number = props.caseItem.institution_number || ''
      formState.police_station = props.caseItem.police_station || ''
      formState.fir_number = props.caseItem.fir_number || ''
      formState.fir_year = props.caseItem.fir_year ?? undefined
      formState.offence_sections = props.caseItem.offence_sections || ''
      formState.status = props.caseItem.status
      formState.decision_date = props.caseItem.decision_date || ''
    } else {
      formState.case_number = ''
      formState.case_title = ''
      formState.court = courts[0]?.value ?? ''
      formState.category = cats[0]?.value ?? ''
      formState.managing_organization = orgs[0]?.value ?? ''
      formState.institution_date = new Date().toISOString().slice(0, 10)
      formState.assigned_case_officer = ''
      formState.institution_number = ''
      formState.police_station = ''
      formState.fir_number = ''
      formState.fir_year = undefined
      formState.offence_sections = ''
      formState.status = 'PENDING'
      formState.decision_date = ''
    }
  }
})

async function onSubmit() {
  loading.value = true
  errors.value = []
  fieldErrors.value = {}

  try {
    const payload: CasePayload = {
      case_number: formState.case_number,
      case_title: formState.case_title,
      court: formState.court,
      category: formState.category,
      managing_organization: formState.managing_organization,
      institution_date: formState.institution_date,
      assigned_case_officer: formState.assigned_case_officer || null,
      institution_number: formState.institution_number || null,
      police_station: formState.police_station || null,
      fir_number: formState.fir_number || null,
      fir_year: formState.fir_year ?? null,
      offence_sections: formState.offence_sections || null,
      status: formState.status,
      decision_date: formState.decision_date || null
    }

    let savedCase: Case
    if (isEditing.value && props.caseItem) {
      savedCase = await updateCase(props.caseItem.case_id, payload)
      toast.add({ title: 'Case updated successfully', color: 'success' })
    } else {
      savedCase = await createCase(payload)
      toast.add({ title: 'Case registered successfully', color: 'success' })
    }

    emit('saved', savedCase)
    isOpen.value = false
  } catch (err: any) {
    if (err instanceof ApiError) {
      errors.value = err.messages.length ? err.messages : [err.message]
      fieldErrors.value = err.fields
    } else {
      errors.value = [err?.message || 'Failed to save case']
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="isEditing ? 'Edit Case' : 'Register New Case'"
    :description="isEditing ? 'Update court and docket information' : 'Record a new legal case in the court system'"
    :ui="{ content: 'max-w-2xl' }"
  >
    <template #body>
      <form class="space-y-4" @submit.prevent="onSubmit">
        <AppFormErrors :messages="errors" />

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField label="Case Number" name="case_number" required :error="fieldErrors.case_number?.[0]">
            <UInput v-model="formState.case_number" placeholder="e.g. WP-2025/104" class="w-full" />
          </UFormField>

          <UFormField label="Institution Date" name="institution_date" required :error="fieldErrors.institution_date?.[0]">
            <UInput v-model="formState.institution_date" type="date" class="w-full" />
          </UFormField>
        </div>

        <UFormField label="Case Title" name="case_title" required :error="fieldErrors.case_title?.[0]">
          <UInput v-model="formState.case_title" placeholder="e.g. State vs. Muhammad Ali & Others" class="w-full" />
        </UFormField>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField label="Court" name="court" required :error="fieldErrors.court?.[0]">
            <AppSelect
              v-model="formState.court"
              :items="courtOptions"
              value-key="value"
              label-key="label"
              placeholder="Select Court"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Category" name="category" required :error="fieldErrors.category?.[0]">
            <AppSelect
              v-model="formState.category"
              :items="categoryOptions"
              value-key="value"
              label-key="label"
              placeholder="Select Category"
              class="w-full"
            />
          </UFormField>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField label="Managing Organization" name="managing_organization" required :error="fieldErrors.managing_organization?.[0]">
            <AppSelect
              v-model="formState.managing_organization"
              :items="orgOptions"
              value-key="value"
              label-key="label"
              placeholder="Select Organization"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Assigned Case Officer" name="assigned_case_officer" :error="fieldErrors.assigned_case_officer?.[0]">
            <AppSelect
              v-model="formState.assigned_case_officer"
              :items="officerOptions"
              value-key="value"
              label-key="label"
              placeholder="Select Case Officer (Optional)"
              class="w-full"
            />
          </UFormField>
        </div>

        <div class="border-t border-neutral-200 dark:border-neutral-800 pt-4">
          <h4 class="text-xs font-semibold uppercase tracking-wider text-muted mb-3">Police & FIR Details (Optional)</h4>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <UFormField label="Police Station" name="police_station" :error="fieldErrors.police_station?.[0]">
              <AppSelect
                v-model="formState.police_station"
                :items="policeStationOptions"
                value-key="value"
                label-key="label"
                placeholder="Police Station"
                class="w-full"
              />
            </UFormField>

            <UFormField label="FIR Number" name="fir_number" :error="fieldErrors.fir_number?.[0]">
              <UInput v-model="formState.fir_number" placeholder="FIR No" class="w-full" />
            </UFormField>

            <UFormField label="FIR Year" name="fir_year" :error="fieldErrors.fir_year?.[0]">
              <UInput v-model.number="formState.fir_year" type="number" placeholder="Year" class="w-full" />
            </UFormField>
          </div>

          <div class="mt-3">
            <UFormField label="Offence Sections" name="offence_sections" :error="fieldErrors.offence_sections?.[0]">
              <UInput v-model="formState.offence_sections" placeholder="e.g. 302, 324, 109 PPC" class="w-full" />
            </UFormField>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-neutral-200 dark:border-neutral-800 pt-4">
          <UFormField label="Status" name="status" :error="fieldErrors.status?.[0]">
            <AppSelect
              v-model="formState.status"
              :items="statusOptions"
              value-key="value"
              label-key="label"
              class="w-full"
            />
          </UFormField>

          <UFormField v-if="formState.status === 'DECIDED' || formState.status === 'DISPOSED'" label="Decision Date" name="decision_date" :error="fieldErrors.decision_date?.[0]">
            <UInput v-model="formState.decision_date" type="date" class="w-full" />
          </UFormField>
        </div>

        <div class="flex items-center justify-end gap-2 pt-4">
          <UButton label="Cancel" variant="ghost" color="neutral" @click="isOpen = false" />
          <UButton type="submit" :label="isEditing ? 'Save Changes' : 'Register Case'" color="primary" :loading="loading" />
        </div>
      </form>
    </template>
  </UModal>
</template>
