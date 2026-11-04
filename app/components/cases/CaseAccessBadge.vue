<script setup lang="ts">
import type { WorkAccessTypeEnum } from '~/types/legal'

const props = defineProps<{
  value?: WorkAccessTypeEnum | null
  size?: 'xs' | 'sm' | 'md'
}>()

const config = computed(() => {
  switch (props.value) {
    case 'ASSIGNED':
      return { label: 'Active Assignee', color: 'success' as const, icon: 'i-lucide-user-check' }
    case 'PEER':
      return { label: 'Peer Officer (Working Rights)', color: 'info' as const, icon: 'i-lucide-users' }
    case 'ADMIN':
      return { label: 'Administrator', color: 'secondary' as const, icon: 'i-lucide-shield-check' }
    default:
      return { label: 'View Only', color: 'neutral' as const, icon: 'i-lucide-eye' }
  }
})
</script>

<template>
  <UBadge
    :label="config.label"
    :color="config.color"
    :icon="config.icon"
    variant="subtle"
    :size="size ?? 'sm'"
  />
</template>
