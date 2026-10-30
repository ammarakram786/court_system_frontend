<script setup lang="ts">
import type { StatusEnum, PartySideEnum, EffectEnum, NatureEnum, ProfileStatusEnum } from '~/types/legal'

const props = defineProps<{
  value?: StatusEnum | PartySideEnum | EffectEnum | NatureEnum | ProfileStatusEnum | string | null
  type?: 'status' | 'party' | 'effect' | 'nature' | 'profile'
  size?: 'xs' | 'sm' | 'md'
}>()

const config = computed(() => {
  const val = props.value ?? ''
  switch (val) {
    // Case statuses
    case 'PENDING':
      return { label: 'Pending', color: 'warning' as const, variant: 'subtle' as const }
    case 'DECIDED':
      return { label: 'Decided', color: 'success' as const, variant: 'subtle' as const }
    case 'DISPOSED':
      return { label: 'Disposed', color: 'info' as const, variant: 'subtle' as const }
    case 'TRANSFERRED':
      return { label: 'Transferred', color: 'secondary' as const, variant: 'subtle' as const }
    case 'CONSIGNED':
      return { label: 'Consigned', color: 'neutral' as const, variant: 'subtle' as const }

    // Party sides
    case 'PETITIONER':
      return { label: 'Petitioner / Appellant', color: 'info' as const, variant: 'outline' as const }
    case 'RESPONDENT':
      return { label: 'Respondent / Defendant', color: 'secondary' as const, variant: 'outline' as const }
    case 'STATE':
      return { label: 'State / Prosecution', color: 'success' as const, variant: 'outline' as const }

    // Nature
    case 'CIVIL':
      return { label: 'Civil', color: 'info' as const, variant: 'subtle' as const }
    case 'CRIMINAL':
      return { label: 'Criminal', color: 'error' as const, variant: 'subtle' as const }

    // Effects
    case 'ALLOW':
      return { label: 'ALLOW', color: 'success' as const, variant: 'solid' as const }
    case 'DENY':
      return { label: 'DENY', color: 'error' as const, variant: 'solid' as const }

    // Profile status
    case 'ACTIVE':
      return { label: 'Active', color: 'success' as const, variant: 'subtle' as const }
    case 'INACTIVE':
      return { label: 'Inactive', color: 'neutral' as const, variant: 'subtle' as const }
    case 'SUSPENDED':
      return { label: 'Suspended', color: 'error' as const, variant: 'subtle' as const }
    case 'ON_LEAVE':
      return { label: 'On Leave', color: 'warning' as const, variant: 'subtle' as const }
    case 'ARCHIVED':
      return { label: 'Archived', color: 'neutral' as const, variant: 'subtle' as const }

    default:
      return { label: val || 'Unknown', color: 'neutral' as const, variant: 'subtle' as const }
  }
})
</script>

<template>
  <UBadge
    :label="config.label"
    :color="config.color"
    :variant="config.variant"
    :size="size ?? 'sm'"
  />
</template>
