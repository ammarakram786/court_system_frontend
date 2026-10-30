<script setup lang="ts">
import type { Organization, OrganizationFilters } from '~/types/legal'

useHead({ title: 'Organizational Structure' })

const { useOrganizationsList, useRootOrganization, deleteOrganization, patchOrganization } = useOrganizations()
const toast = useToast()

const filters = reactive<OrganizationFilters>({
  search: '',
  page: 1,
  page_size: 15,
  ordering: 'org_level'
})

const { data, status, refresh } = useOrganizationsList(filters)
const { data: rootOrg, refresh: refreshRoot } = useRootOrganization()

// Modals
const isModalOpen = ref(false)
const selectedOrg = ref<Organization | null>(null)

const isDeleteModalOpen = ref(false)
const orgToDelete = ref<Organization | null>(null)
const isDeleting = ref(false)

function openCreate() {
  selectedOrg.value = null
  isModalOpen.value = true
}

function openEdit(o: Organization) {
  selectedOrg.value = o
  isModalOpen.value = true
}

function openDelete(o: Organization) {
  orgToDelete.value = o
  isDeleteModalOpen.value = true
}

async function confirmDelete() {
  if (!orgToDelete.value) return
  isDeleting.value = true
  try {
    await deleteOrganization(orgToDelete.value.organization_id)
    toast.add({ title: 'Organization deleted', color: 'success' })
    isDeleteModalOpen.value = false
    refresh()
    refreshRoot()
  } catch (err: any) {
    toast.add({ title: 'Failed to delete organization', description: err?.message, color: 'error' })
  } finally {
    isDeleting.value = false
  }
}

async function toggleActive(org: Organization) {
  try {
    await patchOrganization(org.organization_id, { is_active: !org.is_active })
    toast.add({
      title: org.is_active ? 'Organization deactivated' : 'Organization activated',
      color: 'success'
    })
    refresh()
  } catch (err: any) {
    toast.add({ title: 'Failed to update status', description: err?.message, color: 'error' })
  }
}
</script>

<template>
  <UDashboardPanel id="organizations">
    <template #header>
      <AppPageHeader title="Organizational Hierarchy">
        <template #actions>
          <UButton
            label="Register Organization"
            icon="i-lucide-plus"
            color="primary"
            @click="openCreate"
          />
        </template>
      </AppPageHeader>
    </template>

    <template #body>
      <div class="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
        <!-- Root Organization Spotlight -->
        <div v-if="rootOrg" class="p-5 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="size-12 rounded-xl bg-primary text-inverted flex items-center justify-center shrink-0">
              <UIcon name="i-lucide-network" class="size-6" />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold uppercase tracking-wider text-primary">Headquarters Root Node</span>
                <UBadge label="Root Org" size="xs" color="primary" variant="subtle" />
              </div>
              <h2 class="text-xl font-bold text-highlighted mt-0.5">{{ rootOrg.name }}</h2>
              <p class="text-xs text-muted">
                Formation Code: <strong class="text-highlighted font-mono">{{ rootOrg.code }}</strong> ·
                Subordinate Wings & Units: <strong class="text-highlighted">{{ rootOrg.sub_organizations_count }}</strong>
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <UButton
              label="Edit Root"
              icon="i-lucide-pencil"
              variant="outline"
              size="sm"
              color="neutral"
              @click="openEdit(rootOrg)"
            />
          </div>
        </div>

        <!-- Filter bar -->
        <div class="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div class="w-full sm:max-w-md">
            <UInput
              v-model="filters.search"
              placeholder="Search by name, code..."
              icon="i-lucide-search"
              class="w-full"
              @update:model-value="filters.page = 1"
            />
          </div>

          <div class="text-xs text-muted">
            Total organizations: <strong class="text-highlighted">{{ data?.count ?? 0 }}</strong>
          </div>
        </div>

        <!-- Organizations Table -->
        <div class="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs sm:text-sm">
              <thead class="bg-neutral-50 dark:bg-neutral-800/50 text-muted uppercase tracking-wider font-semibold border-b border-neutral-200 dark:border-neutral-800">
                <tr>
                  <th class="px-4 py-3">Organization Name</th>
                  <th class="px-4 py-3">Formation Code</th>
                  <th class="px-4 py-3">Hierarchy Level</th>
                  <th class="px-4 py-3">Sub-Units</th>
                  <th class="px-4 py-3">Status</th>
                  <th class="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
                <tr
                  v-for="org in data?.results || []"
                  :key="org.organization_id"
                  class="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40 transition"
                >
                  <td class="px-4 py-3.5 font-bold text-highlighted">
                    <div class="flex items-center gap-2">
                      <span>{{ org.name }}</span>
                      <UBadge
                        v-if="org.is_root"
                        label="Root"
                        size="xs"
                        color="primary"
                        variant="solid"
                      />
                    </div>
                  </td>

                  <td class="px-4 py-3.5 font-mono text-xs font-semibold text-primary">
                    {{ org.code }}
                  </td>

                  <td class="px-4 py-3.5">
                    <UBadge
                      :label="`Level ${org.org_level}`"
                      size="xs"
                      variant="outline"
                      color="neutral"
                    />
                  </td>

                  <td class="px-4 py-3.5 text-muted">
                    {{ org.sub_organizations_count }} sub-units
                  </td>

                  <td class="px-4 py-3.5">
                    <button
                      type="button"
                      class="inline-flex items-center gap-1.5 cursor-pointer"
                      @click="toggleActive(org)"
                    >
                      <UBadge
                        :label="org.is_active ? 'Active' : 'Inactive'"
                        :color="org.is_active ? 'success' : 'neutral'"
                        size="xs"
                        variant="subtle"
                      />
                    </button>
                  </td>

                  <td class="px-4 py-3.5 text-right whitespace-nowrap">
                    <div class="flex items-center justify-end gap-1">
                      <UButton
                        icon="i-lucide-pencil"
                        size="xs"
                        variant="ghost"
                        color="neutral"
                        @click="openEdit(org)"
                      />
                      <UButton
                        v-if="!org.is_root"
                        icon="i-lucide-trash-2"
                        size="xs"
                        variant="ghost"
                        color="error"
                        @click="openDelete(org)"
                      />
                    </div>
                  </td>
                </tr>

                <tr v-if="!data?.results?.length && status !== 'pending'">
                  <td colspan="6" class="p-8">
                    <CommonEmptyState
                      icon="i-lucide-network"
                      title="No organizations found"
                      description="Register organizational wings and corps directorates."
                      action-label="Register Organization"
                      @action="openCreate"
                    />
                  </td>
                </tr>

                <tr v-if="status === 'pending'" v-for="n in 3" :key="`skel-${n}`">
                  <td colspan="6" class="px-4 py-4">
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
      <OrganizationsOrgModal
        v-model:open="isModalOpen"
        :org="selectedOrg"
        @saved="() => refresh()"
      />

      <CommonConfirmModal
        v-model:open="isDeleteModalOpen"
        title="Delete Organization"
        :description="orgToDelete ? `Delete ${orgToDelete.name} (${orgToDelete.code})? Subordinate organizations must be detached first.` : ''"
        confirm-label="Delete Organization"
        :loading="isDeleting"
        @confirm="confirmDelete"
      />
    </template>
  </UDashboardPanel>
</template>
