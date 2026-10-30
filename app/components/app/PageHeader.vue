<script setup lang="ts">
defineProps<{ title: string }>()
</script>

<template>
  <UDashboardNavbar :title="title">
    <template #leading>
      <UDashboardSidebarCollapse />
    </template>
    <template #right>
      <slot name="actions" />
      <UColorModeButton />
    </template>
  </UDashboardNavbar>
</template>
