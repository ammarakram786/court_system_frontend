<script setup lang="ts">
import type { CaseCategory, CaseCategoryPayload, NatureEnum } from '~/types/legal'
import { ApiError } from '~/utils/api-error'

const props = defineProps<{
  open: boolean
  category?: CaseCategory | null
}>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'saved', cat: CaseCategory): void
}>()

const isOpen = computed({
  get: () => props.open,
  set: (val: boolean) => emit('update:open', val)
})

const isEditing = computed(() => !!props.category)
const { createCategory, updateCategory } = useCaseCategories()
const toast = useToast()

const natureOptions = [
  { label: 'Civil', value: 'CIVIL' },
  { label: 'Criminal', value: 'CRIMINAL' }
]

interface CategoryFormState {
  name: string
  nature: NatureEnum
  short_code: string
}

const formState = reactive<CategoryFormState>({
  name: '',
  nature: 'CIVIL',
  short_code: ''
})

const loading = ref(false)
const errors = ref<string[]>([])
const fieldErrors = ref<Record<string, string[]>>({})

watch(isOpen, (val) => {
  if (val) {
    errors.value = []
    fieldErrors.value = {}
    if (props.category) {
      formState.name = props.category.name
      formState.nature = props.category.nature
      formState.short_code = props.category.short_code || ''
    } else {
      formState.name = ''
      formState.nature = 'CIVIL'
      formState.short_code = ''
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
      short_code: formState.short_code || null
    }

    let saved: CaseCategory
    if (isEditing.value && props.category) {
      saved = await updateCategory(props.category.category_id, payload)
      toast.add({ title: 'Category updated', color: 'success' })
    } else {
      saved = await createCategory(payload)
      toast.add({ title: 'Category created', color: 'success' })
    }

    emit('saved', saved)
    isOpen.value = false
  } catch (err: any) {
    if (err instanceof ApiError) {
      errors.value = err.messages.length ? err.messages : [err.message]
      fieldErrors.value = err.fields
    } else {
      errors.value = [err?.message || 'Failed to save category']
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="isEditing ? 'Edit Case Category' : 'New Case Category'"
    description="Categorize cases by legal classification (Civil or Criminal)"
  >
    <template #body>
      <form class="space-y-4" @submit.prevent="onSubmit">
        <AppFormErrors :messages="errors" />

        <UFormField label="Category Name" required :error="fieldErrors.name?.[0]">
          <UInput v-model="formState.name" placeholder="e.g. Writ Petition, Bail Application, Civil Suit" class="w-full" />
        </UFormField>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField label="Legal Nature" required :error="fieldErrors.nature?.[0]">
            <AppSelect
              v-model="formState.nature"
              :items="natureOptions"
              value-key="value"
              label-key="label"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Short Code / Abbreviation" :error="fieldErrors.short_code?.[0]">
            <UInput v-model="formState.short_code" placeholder="e.g. WP, BA, CS" class="w-full" />
          </UFormField>
        </div>

        <div class="flex items-center justify-end gap-2 pt-3">
          <UButton label="Cancel" variant="ghost" color="neutral" @click="isOpen = false" />
          <UButton type="submit" :label="isEditing ? 'Save Changes' : 'Create Category'" color="primary" :loading="loading" />
        </div>
      </form>
    </template>
  </UModal>
</template>
