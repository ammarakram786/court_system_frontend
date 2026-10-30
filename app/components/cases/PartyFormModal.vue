<script setup lang="ts">
import type { CaseParty, CasePartyPayload, PartySideEnum } from '~/types/legal'
import { ApiError } from '~/utils/api-error'

const props = defineProps<{
  open: boolean
  caseId: string
  partyItem?: CaseParty | null
}>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'saved', party: CaseParty): void
}>()

const isOpen = computed({
  get: () => props.open,
  set: (val: boolean) => emit('update:open', val)
})

const isEditing = computed(() => !!props.partyItem)
const { createParty, updateParty, addCaseParty } = useCases()
const toast = useToast()

const sideOptions = [
  { label: 'Petitioner / Appellant', value: 'PETITIONER' },
  { label: 'Respondent / Defendant', value: 'RESPONDENT' },
  { label: 'State / Prosecution', value: 'STATE' }
]

interface PartyFormState {
  case: string
  party_side: PartySideEnum
  party_name: string
  is_primary_party: boolean
  counsel_name: string
  cnic: string
  contact_number: string
}

const formState = reactive<PartyFormState>({
  case: props.caseId,
  party_side: 'PETITIONER',
  party_name: '',
  is_primary_party: false,
  counsel_name: '',
  cnic: '',
  contact_number: ''
})

const loading = ref(false)
const errors = ref<string[]>([])
const fieldErrors = ref<Record<string, string[]>>({})

watch(isOpen, (val) => {
  if (val) {
    errors.value = []
    fieldErrors.value = {}
    if (props.partyItem) {
      formState.case = props.partyItem.case
      formState.party_side = props.partyItem.party_side
      formState.party_name = props.partyItem.party_name
      formState.is_primary_party = props.partyItem.is_primary_party
      formState.counsel_name = props.partyItem.counsel_name || ''
      formState.cnic = props.partyItem.cnic || ''
      formState.contact_number = props.partyItem.contact_number || ''
    } else {
      formState.case = props.caseId
      formState.party_side = 'PETITIONER'
      formState.party_name = ''
      formState.is_primary_party = false
      formState.counsel_name = ''
      formState.cnic = ''
      formState.contact_number = ''
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
      case: props.caseId,
      counsel_name: formState.counsel_name || null,
      cnic: formState.cnic || null,
      contact_number: formState.contact_number || null
    }

    let saved: any
    if (isEditing.value && props.partyItem) {
      saved = await updateParty(props.partyItem.party_id, payload)
      toast.add({ title: 'Party updated successfully', color: 'success' })
    } else {
      // Can use either nested /cases/{id}/parties/ or /case-parties/
      saved = await createParty(payload as CasePartyPayload)
      toast.add({ title: 'Party added to case', color: 'success' })
    }

    emit('saved', saved)
    isOpen.value = false
  } catch (err: any) {
    if (err instanceof ApiError) {
      errors.value = err.messages.length ? err.messages : [err.message]
      fieldErrors.value = err.fields
    } else {
      errors.value = [err?.message || 'Failed to save party']
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="isEditing ? 'Edit Case Party' : 'Add Case Party'"
    :description="isEditing ? 'Update party or counsel details' : 'Add petitioner, respondent, or state representative'"
  >
    <template #body>
      <form class="space-y-4" @submit.prevent="onSubmit">
        <AppFormErrors :messages="errors" />

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField label="Party Side" required :error="fieldErrors.party_side?.[0]">
            <USelect
              v-model="formState.party_side"
              :items="sideOptions"
              value-key="value"
              label-key="label"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Party Name" required :error="fieldErrors.party_name?.[0]">
            <UInput v-model="formState.party_name" placeholder="Full name or company" class="w-full" />
          </UFormField>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField label="Advocate / Counsel Name" :error="fieldErrors.counsel_name?.[0]">
            <UInput v-model="formState.counsel_name" placeholder="Advocate on record" class="w-full" />
          </UFormField>

          <UFormField label="CNIC Number" :error="fieldErrors.cnic?.[0]">
            <UInput v-model="formState.cnic" placeholder="e.g. 35201-1234567-1" class="w-full" />
          </UFormField>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <UFormField label="Contact Number" :error="fieldErrors.contact_number?.[0]">
            <UInput v-model="formState.contact_number" placeholder="e.g. 0300-1234567" class="w-full" />
          </UFormField>

          <div class="pt-6">
            <label class="flex items-center gap-2 cursor-pointer text-sm font-medium">
              <input
                v-model="formState.is_primary_party"
                type="checkbox"
                class="rounded border-neutral-300 text-primary focus:ring-primary size-4"
              >
              <span>Is Primary Party (Lead Litigant)</span>
            </label>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-3">
          <UButton label="Cancel" variant="ghost" color="neutral" @click="isOpen = false" />
          <UButton type="submit" :label="isEditing ? 'Save Changes' : 'Add Party'" color="primary" :loading="loading" />
        </div>
      </form>
    </template>
  </UModal>
</template>
