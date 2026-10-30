<script setup lang="ts">
import type { Organization, OrganizationPayload } from '~/types/legal'
import { ApiError } from '~/utils/api-error'

const props = defineProps<{
  open: boolean
  org?: Organization | null
}>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'saved', org: Organization): void
}>()

const isOpen = computed({
  get: () => props.open,
  set: (val: boolean) => emit('update:open', val)
})

const isEditing = computed(() => !!props.org)
const { createOrganization, updateOrganization } = useOrganizations()
const refData = useReferenceData()
const toast = useToast()

const parentOptions = ref<{ label: string, value: string }[]>([])
const loading = ref(false)
const errors = ref<string[]>([])
const fieldErrors = ref<Record<string, string[]>>({})

interface OrgFormState {
  name: string
  code: string
  parent_organization: string
  is_active: boolean
}

const formState = reactive<OrgFormState>({
  name: '',
  code: '',
  parent_organization: '',
  is_active: true
})

watch(isOpen, async (val) => {
  if (val) {
    errors.value = []
    fieldErrors.value = {}
    const orgs = await refData.loadOrganizationOptions()
    parentOptions.value = [{ label: 'None (Root Node)', value: '' }, ...orgs]

    if (props.org) {
      formState.name = props.org.name
      formState.code = props.org.code
      formState.parent_organization = props.org.parent_organization || ''
      formState.is_active = props.org.is_active
    } else {
      formState.name = ''
      formState.code = ''
      formState.parent_organization = ''
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
      parent_organization: formState.parent_organization || null
    }

    let saved: Organization
    if (isEditing.value && props.org) {
      saved = await updateOrganization(props.org.organization_id, payload)
      toast.add({ title: 'Organization updated', color: 'success' })
    } else {
      saved = await createOrganization(payload)
      toast.add({ title: 'Organization registered', color: 'success' })
    }

    emit('saved', saved)
    isOpen.value = false
  } catch (err: any) {
    if (err instanceof ApiError) {
      errors.value = err.messages.length ? err.messages : [err.message]
      fieldErrors.value = err.fields
    } else {
      errors.value = [err?.message || 'Failed to save organization']
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="isEditing ? 'Edit Organization' : 'Register Organization'"
    description="Manage command structure, wings, formations, and legal directorates"
  >
    <template #body>
      <form class="space-y-4" @submit.prevent="onSubmit">
        <AppFormErrors :messages="errors" />

        <UFormField label="Organization Name" required :error="fieldErrors.name?.[0]">
          <UInput v-model="formState.name" placeholder="e.g. Directorate of Legal Affairs, 4 Corps" class="w-full" />
        </UFormField>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField label="Unit / Formation Code" required :error="fieldErrors.code?.[0]">
            <UInput v-model="formState.code" placeholder="e.g. DLA-HQ, 4CORP-LGL" class="w-full" />
          </UFormField>

          <UFormField label="Parent Organization" :error="fieldErrors.parent_organization?.[0]">
            <USelect
              v-model="formState.parent_organization"
              :items="parentOptions"
              value-key="value"
              label-key="label"
              placeholder="Select Parent (Optional)"
              class="w-full"
            />
          </UFormField>
        </div>

        <div>
          <label class="flex items-center gap-2 cursor-pointer text-sm font-medium">
            <input
              v-model="formState.is_active"
              type="checkbox"
              class="rounded border-neutral-300 text-primary focus:ring-primary size-4"
            >
            <span>Organization is Active</span>
          </label>
        </div>

        <div class="flex items-center justify-end gap-2 pt-3">
          <UButton label="Cancel" variant="ghost" color="neutral" @click="isOpen = false" />
          <UButton type="submit" :label="isEditing ? 'Save Changes' : 'Create Organization'" color="primary" :loading="loading" />
        </div>
      </form>
    </template>
  </UModal>
</template>
