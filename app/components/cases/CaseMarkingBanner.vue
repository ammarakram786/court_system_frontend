<script setup lang="ts">
import type { Case } from '~/types/legal'

defineProps<{ caseItem: Pick<Case, 'marking_remarks' | 'marked_by_details' | 'marked_at'> }>()
</script>

<template>
  <div
    v-if="caseItem.marking_remarks"
    class="p-4 bg-amber-50 border border-amber-200 rounded-lg dark:bg-amber-950/20 dark:border-amber-900/50"
  >
    <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-amber-800 dark:text-amber-300 font-semibold text-sm">
      <UIcon name="i-lucide-message-square-text" class="size-4" />
      <span>Marking Instructions (from {{ caseItem.marked_by_details?.name || 'Assigner' }})</span>
      <span v-if="caseItem.marked_at" class="text-xs text-amber-600 dark:text-amber-400 font-normal">
        ({{ formatDateTime(caseItem.marked_at) }})
      </span>
    </div>
    <p class="mt-1 text-sm text-amber-900 dark:text-amber-200 whitespace-pre-line">
      {{ caseItem.marking_remarks }}
    </p>
  </div>
</template>
