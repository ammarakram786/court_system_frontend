<script setup lang="ts">
import type { MarkingActionEnum } from '~/types/legal'

const props = defineProps<{ caseId: string }>()

const { useCaseMarkingHistory } = useCases()
const { data: historyList, status, refresh } = useCaseMarkingHistory(() => props.caseId)

defineExpose({ refresh })

const actionMeta: Record<MarkingActionEnum, { label: string, color: 'info' | 'warning' | 'success', icon: string }> = {
  INITIAL: { label: 'Assigned', color: 'success', icon: 'i-lucide-user-plus' },
  MARK: { label: 'Marked', color: 'info', icon: 'i-lucide-arrow-right' },
  MARK_BACK: { label: 'Marked Back', color: 'warning', icon: 'i-lucide-undo-2' }
}
</script>

<template>
  <div v-if="status === 'pending' && !historyList" class="space-y-3">
    <div v-for="n in 3" :key="n" class="h-20 bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse" />
  </div>

  <CommonEmptyState
    v-else-if="!historyList || historyList.length === 0"
    icon="i-lucide-history"
    title="No marking transfers recorded yet"
    description="When this case is marked to another officer or marked back, the chain of custody appears here."
  />

  <div v-else class="space-y-3">
    <div
      v-for="log in historyList"
      :key="log.history_id"
      class="border border-neutral-200 dark:border-neutral-800 rounded-lg p-3 bg-white dark:bg-neutral-900 shadow-sm flex items-start gap-3"
    >
      <div class="p-2 rounded-full bg-primary/10 text-primary">
        <UIcon :name="(actionMeta[log.action] ?? actionMeta.MARK).icon" class="size-5" />
      </div>

      <div class="flex-1 min-w-0">
        <div class="flex flex-wrap justify-between items-center gap-1 text-sm">
          <span class="font-medium">
            <span class="text-highlighted">{{ log.from_user_details?.name || '—' }}</span>
            <span class="text-muted mx-1">→</span>
            <span class="text-primary font-semibold">{{ log.to_user_details?.name || '—' }}</span>
          </span>
          <span class="text-xs text-muted">{{ formatDateTime(log.created_at) }}</span>
        </div>

        <UBadge
          :label="(actionMeta[log.action] ?? actionMeta.MARK).label"
          :color="(actionMeta[log.action] ?? actionMeta.MARK).color"
          variant="subtle"
          size="xs"
          class="mt-1"
        />

        <p
          v-if="log.remarks"
          class="mt-2 text-xs bg-neutral-50 dark:bg-neutral-800 p-2 rounded text-neutral-700 dark:text-neutral-300 whitespace-pre-line"
        >
          "{{ log.remarks }}"
        </p>
      </div>
    </div>
  </div>
</template>
