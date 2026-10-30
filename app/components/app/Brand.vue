<script setup lang="ts">
defineProps<{ collapsed?: boolean }>()
const { public: { appName } } = useRuntimeConfig()
</script>

<template>
  <NuxtLink to="/" class="flex items-center gap-2 min-w-0">
    <span class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-inverted">
      <UIcon name="i-lucide-scale" class="size-5" />
    </span>
    <span v-if="!collapsed" class="truncate font-semibold text-highlighted">{{ appName }}</span>
  </NuxtLink>
</template>
