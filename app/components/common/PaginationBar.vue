<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    page?: number
    pageSize?: number
    totalCount?: number
    totalPages?: number
  }>(),
  {
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 1
  }
)

const emit = defineEmits<{
  (e: 'update:page', val: number): void
  (e: 'update:pageSize', val: number): void
}>()

const from = computed(() => {
  if (props.totalCount === 0) return 0
  return (props.page - 1) * props.pageSize + 1
})

const to = computed(() => {
  return Math.min(props.page * props.pageSize, props.totalCount)
})

function prev() {
  if (props.page > 1) {
    emit('update:page', props.page - 1)
  }
}

function next() {
  if (props.page < props.totalPages) {
    emit('update:page', props.page + 1)
  }
}
</script>

<template>
  <div class="flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-4 border-t border-neutral-200 dark:border-neutral-800 text-sm text-muted">
    <div class="text-xs sm:text-sm">
      Showing <span class="font-medium text-highlighted">{{ from }}</span> to <span class="font-medium text-highlighted">{{ to }}</span> of <span class="font-medium text-highlighted">{{ totalCount }}</span> results
    </div>

    <div class="flex items-center gap-2">
      <UButton
        icon="i-lucide-chevron-left"
        size="xs"
        variant="outline"
        color="neutral"
        :disabled="page <= 1"
        @click="prev"
      >
        Previous
      </UButton>
      <span class="text-xs px-2 font-medium">Page {{ page }} of {{ Math.max(1, totalPages) }}</span>
      <UButton
        trailing-icon="i-lucide-chevron-right"
        size="xs"
        variant="outline"
        color="neutral"
        :disabled="page >= totalPages"
        @click="next"
      >
        Next
      </UButton>
    </div>
  </div>
</template>
