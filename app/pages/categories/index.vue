<script setup lang="ts">
import type { CaseCategory, NatureEnum } from '~/types/legal'

useHead({ title: 'Case Categories' })

const { useCategoriesList, deleteCategory } = useCaseCategories()
const toast = useToast()

const filters = reactive({
  search: '',
  nature: undefined as NatureEnum | undefined,
  page: 1,
  page_size: 12,
  ordering: 'name'
})

const { data, status, refresh } = useCategoriesList(filters)

const natureOptions = [
  { label: 'All Natures', value: '' },
  { label: 'Civil', value: 'CIVIL' },
  { label: 'Criminal', value: 'CRIMINAL' }
]

// Modals
const isModalOpen = ref(false)
const selectedCategory = ref<CaseCategory | null>(null)

const isDeleteModalOpen = ref(false)
const categoryToDelete = ref<CaseCategory | null>(null)
const isDeleting = ref(false)

function openCreate() {
  selectedCategory.value = null
  isModalOpen.value = true
}

function openEdit(cat: CaseCategory) {
  selectedCategory.value = cat
  isModalOpen.value = true
}

function openDelete(cat: CaseCategory) {
  categoryToDelete.value = cat
  isDeleteModalOpen.value = true
}

async function confirmDelete() {
  if (!categoryToDelete.value) return
  isDeleting.value = true
  try {
    await deleteCategory(categoryToDelete.value.category_id)
    toast.add({ title: 'Category deleted', color: 'success' })
    isDeleteModalOpen.value = false
    refresh()
  } catch (err: any) {
    toast.add({ title: 'Failed to delete category', description: err?.message, color: 'error' })
  } finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="categories">
    <template #header>
      <AppPageHeader title="Case Classification Categories">
        <template #actions>
          <UButton
            label="New Category"
            icon="i-lucide-plus"
            color="primary"
            @click="openCreate"
          />
        </template>
      </AppPageHeader>
    </template>

    <template #body>
      <div class="p-4 sm:p-6 space-y-4 max-w-7xl mx-auto w-full">
        <!-- Filter bar -->
        <div class="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div class="flex items-center gap-3 w-full sm:max-w-md">
            <UInput
              v-model="filters.search"
              placeholder="Search category name, code..."
              icon="i-lucide-search"
              class="w-full"
              @update:model-value="filters.page = 1"
            />
            <USelect
              v-model="filters.nature"
              :items="natureOptions"
              value-key="value"
              label-key="label"
              placeholder="Nature"
              class="w-48"
              @update:model-value="filters.page = 1"
            />
          </div>

          <div class="text-xs text-muted">
            Total categories: <strong class="text-highlighted">{{ data?.count ?? 0 }}</strong>
          </div>
        </div>

        <!-- Categories Table -->
        <div class="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs sm:text-sm">
              <thead class="bg-neutral-50 dark:bg-neutral-800/50 text-muted uppercase tracking-wider font-semibold border-b border-neutral-200 dark:border-neutral-800">
                <tr>
                  <th class="px-4 py-3">Category Name</th>
                  <th class="px-4 py-3">Legal Nature</th>
                  <th class="px-4 py-3">Short Code</th>
                  <th class="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
                <tr
                  v-for="cat in data?.results || []"
                  :key="cat.category_id"
                  class="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40 transition"
                >
                  <td class="px-4 py-3.5 font-bold text-highlighted">
                    {{ cat.name }}
                  </td>

                  <td class="px-4 py-3.5">
                    <CommonStatusBadge :value="cat.nature" />
                  </td>

                  <td class="px-4 py-3.5 font-mono text-xs text-muted">
                    {{ cat.short_code || '—' }}
                  </td>

                  <td class="px-4 py-3.5 text-right whitespace-nowrap">
                    <div class="flex items-center justify-end gap-1">
                      <UButton
                        icon="i-lucide-pencil"
                        size="xs"
                        variant="ghost"
                        color="neutral"
                        @click="openEdit(cat)"
                      />
                      <UButton
                        icon="i-lucide-trash-2"
                        size="xs"
                        variant="ghost"
                        color="error"
                        @click="openDelete(cat)"
                      />
                    </div>
                  </td>
                </tr>

                <tr v-if="!data?.results?.length && status !== 'pending'">
                  <td colspan="4" class="p-8">
                    <CommonEmptyState
                      icon="i-lucide-tags"
                      title="No categories found"
                      description="Add case classifications (e.g. Writ Petitions, Appeals, Suits)."
                      action-label="Add Category"
                      @action="openCreate"
                    />
                  </td>
                </tr>

                <tr v-if="status === 'pending'" v-for="n in 3" :key="`skel-${n}`">
                  <td colspan="4" class="px-4 py-4">
                    <div class="h-4 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse w-full" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <CommonPaginationBar
            v-if="data && data.total_pages > 1"
            v-model:page="filters.page"
            v-model:page-size="filters.page_size"
            :total-count="data.count"
            :total-pages="data.total_pages"
          />
        </div>
      </div>

      <!-- Modals -->
      <CategoriesCategoryModal
        v-model:open="isModalOpen"
        :category="selectedCategory"
        @saved="() => refresh()"
      />

      <CommonConfirmModal
        v-model:open="isDeleteModalOpen"
        title="Delete Category"
        :description="categoryToDelete ? `Are you sure you want to delete ${categoryToDelete.name}?` : ''"
        confirm-label="Delete Category"
        :loading="isDeleting"
        @confirm="confirmDelete"
      />
    </template>
  </UDashboardPanel>
</template>
