<script setup lang="ts">
import type { SelectItem } from '@nuxt/ui'

/**
 * Drop-in `USelect` that supports an "empty" option (`value: ''`).
 *
 * Reka UI (the primitive library under Nuxt UI) forbids `''` as an item value
 * because it is reserved for "clear selection / show placeholder". Our API
 * forms and filters rely on `''` meaning "All" / "None", so we translate
 * `''` <-> a private sentinel at the boundary. Parents keep using `''`
 * (or undefined/null) and never see the sentinel.
 */
defineOptions({ inheritAttrs: false })

const EMPTY = '__app_select_empty__'

const props = defineProps<{
  modelValue?: string | number | null
  items: SelectItem[]
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string | number] }>()

const isEmptyItem = (i: SelectItem) => typeof i === 'object' && i !== null && (i as { value?: unknown }).value === ''

const hasEmptyItem = computed(() => props.items.some(isEmptyItem))

const mappedItems = computed<SelectItem[]>(() =>
  props.items.map(i => (isEmptyItem(i) ? { ...(i as object), value: EMPTY } as SelectItem : i))
)

const model = computed({
  get: () => {
    const v = props.modelValue
    if ((v === '' || v === null || v === undefined) && hasEmptyItem.value) return EMPTY
    return v ?? undefined
  },
  set: (v: string | number | undefined) => emit('update:modelValue', v === EMPTY ? '' : (v as string | number))
})
</script>

<template>
  <USelect v-bind="$attrs" v-model="model" :items="mappedItems">
    <template v-for="(_, name) in $slots" #[name]="slotData">
      <slot :name="name" v-bind="slotData || {}" />
    </template>
  </USelect>
</template>
