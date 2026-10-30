<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({ layout: 'auth' })
useHead({ title: 'Sign in' })

const schema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
})
type Schema = z.output<typeof schema>

const auth = useAuthStore()
const route = useRoute()
const { public: { appName } } = useRuntimeConfig()

const form = useTemplateRef('form')
const state = reactive<Partial<Schema>>({ username: '', password: '' })
const loading = ref(false)
const formErrors = ref<string[]>([])

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true
  formErrors.value = []
  try {
    await auth.login(event.data)
    const redirect = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/') ? route.query.redirect : '/'
    await navigateTo(redirect)
  } catch (e) {
    if (e instanceof ApiError) {
      formErrors.value = e.messages.length ? e.messages : [e.message]
      form.value?.setErrors(Object.entries(e.fields).map(([name, msgs]) => ({ name, message: msgs.join(' ') })))
    } else {
      formErrors.value = ['Unexpected error. Please try again.']
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UCard class="w-full max-w-sm">
    <template #header>
      <div class="flex flex-col items-center gap-2 text-center">
        <span class="flex size-12 items-center justify-center rounded-xl bg-primary text-inverted">
          <UIcon name="i-lucide-scale" class="size-7" />
        </span>
        <h1 class="text-xl font-semibold text-highlighted">{{ appName }}</h1>
        <p class="text-sm text-muted">Sign in to your account</p>
      </div>
    </template>

    <UForm ref="form" :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
      <AppFormErrors :messages="formErrors" />

      <UFormField label="Username" name="username" required>
        <UInput v-model="state.username" autocomplete="username" icon="i-lucide-user" class="w-full" autofocus />
      </UFormField>

      <UFormField label="Password" name="password" required>
        <UInput v-model="state.password" type="password" autocomplete="current-password" icon="i-lucide-lock" class="w-full" />
      </UFormField>

      <UButton type="submit" label="Sign in" block :loading="loading" />
    </UForm>
  </UCard>
</template>
