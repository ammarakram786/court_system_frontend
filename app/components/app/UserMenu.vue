<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

defineProps<{ collapsed?: boolean }>()

const auth = useAuthStore()
const colorMode = useColorMode()

const items = computed<DropdownMenuItem[][]>(() => [
  [{ type: 'label', label: auth.user?.username ?? '' }],
  [{
    label: colorMode.value === 'dark' ? 'Light mode' : 'Dark mode',
    icon: colorMode.value === 'dark' ? 'i-lucide-sun' : 'i-lucide-moon',
    onSelect: (e: Event) => {
      e.preventDefault()
      colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
    }
  }],
  [{
    label: 'Log out',
    icon: 'i-lucide-log-out',
    color: 'error',
    onSelect: () => auth.logout()
  }]
])
</script>

<template>
  <UDropdownMenu :items="items" :content="{ align: 'center', collisionPadding: 12 }" :ui="{ content: collapsed ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)' }">
    <UButton
      :label="collapsed ? undefined : auth.user?.name"
      :avatar="{ alt: auth.user?.name, text: undefined }"
      trailing-icon="i-lucide-chevrons-up-down"
      color="neutral"
      variant="ghost"
      block
      :square="collapsed"
      class="data-[state=open]:bg-elevated"
      :ui="{ trailingIcon: 'text-dimmed' }"
    />
  </UDropdownMenu>
</template>
