<script setup lang="ts">
useHead({ title: 'Dashboard' })
const auth = useAuthStore()
</script>

<template>
  <UDashboardPanel id="dashboard">
    <template #header>
      <AppPageHeader title="Dashboard" />
    </template>

    <template #body>
      <UPageCard
        :title="`Welcome back, ${auth.user?.name ?? 'there'}`"
        description="The project is scaffolded and connected to the Django API. Share the API endpoints and the modules will be built here."
        icon="i-lucide-scale"
        variant="subtle"
      />
    </template>
  </UDashboardPanel>
</template>
