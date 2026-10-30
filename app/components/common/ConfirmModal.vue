<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    open: boolean
    title?: string
    description?: string
    confirmLabel?: string
    cancelLabel?: string
    color?: 'error' | 'warning' | 'primary'
    icon?: string
    loading?: boolean
  }>(),
  {
    title: 'Are you sure?',
    description: 'This action cannot be undone.',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    color: 'error',
    icon: 'i-lucide-alert-triangle',
    loading: false
  }
)

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const isOpen = computed({
  get: () => props.open,
  set: (val: boolean) => emit('update:open', val)
})

function onConfirm() {
  emit('confirm')
}

function onCancel() {
  emit('cancel')
  isOpen.value = false
}
</script>

<template>
  <UModal v-model:open="isOpen" :title="title" :description="description">
    <template #footer>
      <div class="flex items-center justify-end gap-2 w-full">
        <UButton
          :label="cancelLabel"
          variant="ghost"
          color="neutral"
          :disabled="loading"
          @click="onCancel"
        />
        <UButton
          :label="confirmLabel"
          :color="color"
          :icon="icon"
          :loading="loading"
          @click="onConfirm"
        />
      </div>
    </template>
  </UModal>
</template>
