<script setup lang="ts">
defineProps<{
  icon?: string
  title: string
  description?: string
  actionLabel?: string
}>()

defineEmits<{
  (e: 'action'): void
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-xl border border-dashed border-neutral-300 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30">
    <div class="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
      <UIcon :name="icon || 'i-lucide-inbox'" class="size-7" />
    </div>
    <h3 class="text-base font-semibold text-highlighted">{{ title }}</h3>
    <p v-if="description" class="mt-1 max-w-sm text-sm text-muted">
      {{ description }}
    </p>
    <div v-if="$slots.actions || actionLabel" class="mt-5">
      <slot name="actions">
        <UButton
          v-if="actionLabel"
          :label="actionLabel"
          icon="i-lucide-plus"
          color="primary"
          @click="$emit('action')"
        />
      </slot>
    </div>
  </div>
</template>
