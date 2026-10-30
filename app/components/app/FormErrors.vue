<script setup lang="ts">
defineProps<{ messages: string[] }>()
</script>

<template>
  <UAlert
    v-if="messages.length"
    color="error"
    variant="subtle"
    icon="i-lucide-circle-alert"
    :title="messages[0]"
    :description="messages.slice(1).join(' ') || undefined"
  />
</template>
