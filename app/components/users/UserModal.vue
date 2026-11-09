<script setup lang="ts">
import type { User, UserPayload, ProfileStatusEnum } from '~/types/legal'
import { ApiError } from '~/utils/api-error'

const props = defineProps<{
  open: boolean
  user?: User | null
}>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'saved', user: User): void
}>()

const isOpen = computed({
  get: () => props.open,
  set: (val: boolean) => emit('update:open', val)
})

const isEditing = computed(() => !!props.user)
const { createUser, updateUser } = useUsers()
const refData = useReferenceData()
const toast = useToast()

const rankOptions = ref<{ label: string, value: string }[]>([])
const apptOptions = ref<{ label: string, value: string }[]>([])
const orgOptions = ref<{ label: string, value: string }[]>([])
const roleOptions = ref<{ label: string, value: string }[]>([])

const statusOptions = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
  { label: 'Suspended', value: 'SUSPENDED' },
  { label: 'On Leave', value: 'ON_LEAVE' },
  { label: 'Archived', value: 'ARCHIVED' }
]

interface UserFormState {
  username: string
  name: string
  svc_number: string
  email: string
  password?: string
  profile_status: ProfileStatusEnum
  rank: string
  appointment: string
  organization: string
  role: string
  is_staff: boolean
  is_active: boolean
}

const formState = reactive<UserFormState>({
  username: '',
  name: '',
  svc_number: '',
  email: '',
  password: '',
  profile_status: 'ACTIVE',
  rank: '',
  appointment: '',
  organization: '',
  role: '',
  is_staff: false,
  is_active: true
})

const loading = ref(false)
const errors = ref<string[]>([])
const fieldErrors = ref<Record<string, string[]>>({})

watch(isOpen, async (val) => {
  if (val) {
    errors.value = []
    fieldErrors.value = {}
    const [ranks, appts, orgs, roles] = await Promise.all([
      refData.loadRankOptions(),
      refData.loadAppointmentOptions(),
      refData.loadOrganizationOptions(),
      refData.loadRoleOptions()
    ])
    rankOptions.value = [{ label: 'None', value: '' }, ...ranks]
    apptOptions.value = [{ label: 'None', value: '' }, ...appts]
    orgOptions.value = [{ label: 'None', value: '' }, ...orgs]
    roleOptions.value = [{ label: 'None', value: '' }, ...roles]

    if (props.user) {
      formState.username = props.user.username
      formState.name = props.user.name
      formState.svc_number = props.user.svc_number
      formState.email = props.user.email || ''
      formState.password = ''
      formState.profile_status = props.user.profile_status
      formState.rank = props.user.rank || ''
      formState.appointment = props.user.appointment || ''
      formState.organization = props.user.organization || ''
      formState.role = props.user.role || ''
      formState.is_staff = props.user.is_staff
      formState.is_active = props.user.is_active
    } else {
      formState.username = ''
      formState.name = ''
      formState.svc_number = ''
      formState.email = ''
      formState.password = ''
      formState.profile_status = 'ACTIVE'
      formState.rank = ranks[0]?.value || ''
      formState.appointment = appts[0]?.value || ''
      formState.organization = orgs[0]?.value || ''
      formState.role = roles[0]?.value || ''
      formState.is_staff = false
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
      email: formState.email || null,
      rank: formState.rank || null,
      appointment: formState.appointment || null,
      organization: formState.organization || null,
      role: formState.role || null
    }

    if (isEditing.value && !payload.password) {
      delete payload.password
    }

    let saved: User
    if (isEditing.value && props.user) {
      saved = await updateUser(props.user.user_id, payload)
      toast.add({ title: 'User updated', color: 'success' })
    } else {
      saved = await createUser(payload)
      toast.add({ title: 'User created successfully', color: 'success' })
    }

    emit('saved', saved)
    isOpen.value = false
  } catch (err: any) {
    if (err instanceof ApiError) {
      errors.value = err.messages.length ? err.messages : [err.message]
      fieldErrors.value = err.fields
    } else {
      errors.value = [err?.message || 'Failed to save user']
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="isEditing ? 'Edit User Account' : 'Register New User'"
    description="Manage user credentials, rank, unit assignment, and access role"
    :ui="{ content: 'max-w-2xl' }"
  >
    <template #body>
      <form class="space-y-4" @submit.prevent="onSubmit">
        <AppFormErrors :messages="errors" />

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField label="Full Name" required :error="fieldErrors.name?.[0]">
            <UInput v-model="formState.name" placeholder="Officer / Staff name" class="w-full" />
          </UFormField>

          <UFormField label="Username" required :error="fieldErrors.username?.[0]">
            <UInput v-model="formState.username" placeholder="Username (login handle)" class="w-full" />
          </UFormField>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField label="Service / Personal Number" required :error="fieldErrors.svc_number?.[0]">
            <UInput v-model="formState.svc_number" placeholder="e.g. PA-12345" class="w-full" />
          </UFormField>

          <UFormField label="Email Address" :error="fieldErrors.email?.[0]">
            <UInput v-model="formState.email" type="email" placeholder="officer@domain.gov.pk" class="w-full" />
          </UFormField>
        </div>

        <UFormField
          :label="isEditing ? 'New Password (leave blank to keep current)' : 'Account Password'"
          :required="!isEditing"
          :error="fieldErrors.password?.[0]"
        >
          <UInput v-model="formState.password" type="password" placeholder="Secure password" class="w-full" />
        </UFormField>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField label="Rank" :error="fieldErrors.rank?.[0]">
            <AppSelect
              v-model="formState.rank"
              :items="rankOptions"
              value-key="value"
              label-key="label"
              placeholder="Select Rank"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Appointment / Designation" :error="fieldErrors.appointment?.[0]">
            <AppSelect
              v-model="formState.appointment"
              :items="apptOptions"
              value-key="value"
              label-key="label"
              placeholder="Select Appointment"
              class="w-full"
            />
          </UFormField>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField label="Assigned Organization" :error="fieldErrors.organization?.[0]">
            <AppSelect
              v-model="formState.organization"
              :items="orgOptions"
              value-key="value"
              label-key="label"
              placeholder="Select Organization"
              class="w-full"
            />
          </UFormField>

          <UFormField label="RBAC Role" :error="fieldErrors.role?.[0]">
            <AppSelect
              v-model="formState.role"
              :items="roleOptions"
              value-key="value"
              label-key="label"
              placeholder="Select Role"
              class="w-full"
            />
          </UFormField>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center border-t border-neutral-200 dark:border-neutral-800 pt-4">
          <UFormField label="Profile Status" :error="fieldErrors.profile_status?.[0]">
            <AppSelect
              v-model="formState.profile_status"
              :items="statusOptions"
              value-key="value"
              label-key="label"
              class="w-full"
            />
          </UFormField>

          <div class="pt-6">
            <label class="flex items-center gap-2 cursor-pointer text-sm font-medium">
              <input
                v-model="formState.is_active"
                type="checkbox"
                class="rounded border-neutral-300 text-primary focus:ring-primary size-4"
              >
              <span>Active Account</span>
            </label>
          </div>

          <div class="pt-6">
            <label class="flex items-center gap-2 cursor-pointer text-sm font-medium">
              <input
                v-model="formState.is_staff"
                type="checkbox"
                class="rounded border-neutral-300 text-primary focus:ring-primary size-4"
              >
              <span>Staff / Admin</span>
            </label>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-3">
          <UButton label="Cancel" variant="ghost" color="neutral" @click="isOpen = false" />
          <UButton type="submit" :label="isEditing ? 'Save Changes' : 'Create User'" color="primary" :loading="loading" />
        </div>
      </form>
    </template>
  </UModal>
</template>
