<script setup lang="ts">
import type { CaseTimelineEvent, CaseTimelineEventType } from '~/types/legal'

const props = defineProps<{
  caseId: string
  canWork?: boolean
}>()

const emit = defineEmits<{
  (e: 'editProceeding', proceedingId: string): void
  (e: 'addProceeding'): void
}>()

const { useCaseTimeline } = useCases()

// Sort order state: 'desc' (newest first) or 'asc' (oldest first)
const order = ref<'desc' | 'asc'>('desc')

// Filter state
const activeFilter = ref<'ALL' | 'PROCEEDING' | 'MARKING' | 'MILESTONE'>('ALL')
const searchQuery = ref('')

// Reactive timeline data fetch
const { data: rawEvents, status, refresh } = useCaseTimeline(() => props.caseId, order)

defineExpose({ refresh })

// Computed counts for tab badges
const counts = computed(() => {
  const events = rawEvents.value || []
  return {
    all: events.length,
    proceedings: events.filter(e => e.event_type === 'PROCEEDING').length,
    markings: events.filter(e => e.event_type === 'MARK' || e.event_type === 'MARK_BACK').length,
    milestones: events.filter(e => e.event_type === 'INSTITUTION' || e.event_type === 'DECISION').length
  }
})

// Filtered and searched events
const filteredEvents = computed(() => {
  let list = rawEvents.value || []

  // Type filter
  if (activeFilter.value === 'PROCEEDING') {
    list = list.filter(e => e.event_type === 'PROCEEDING')
  } else if (activeFilter.value === 'MARKING') {
    list = list.filter(e => e.event_type === 'MARK' || e.event_type === 'MARK_BACK')
  } else if (activeFilter.value === 'MILESTONE') {
    list = list.filter(e => e.event_type === 'INSTITUTION' || e.event_type === 'DECISION')
  }

  // Search filter
  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    list = list.filter(e => {
      return (
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        (e.actor?.name && e.actor.name.toLowerCase().includes(q)) ||
        (e.target_user?.name && e.target_user.name.toLowerCase().includes(q)) ||
        (typeof e.metadata.stage === 'string' && e.metadata.stage.toLowerCase().includes(q)) ||
        (typeof e.metadata.today_action === 'string' && e.metadata.today_action.toLowerCase().includes(q)) ||
        (typeof e.metadata.short_order === 'string' && e.metadata.short_order.toLowerCase().includes(q)) ||
        (typeof e.metadata.remarks === 'string' && e.metadata.remarks.toLowerCase().includes(q))
      )
    })
  }

  return list
})

// Visual metadata per event type
const eventMeta: Record<
  CaseTimelineEventType,
  {
    badgeLabel: string
    badgeColor: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'
    icon: string
    nodeBg: string
    nodeColor: string
    nodeBorder: string
  }
> = {
  INSTITUTION: {
    badgeLabel: 'Institution',
    badgeColor: 'info',
    icon: 'i-lucide-folder-plus',
    nodeBg: 'bg-sky-50 dark:bg-sky-950/50',
    nodeColor: 'text-sky-600 dark:text-sky-400',
    nodeBorder: 'border-sky-200 dark:border-sky-800'
  },
  PROCEEDING: {
    badgeLabel: 'Court Hearing',
    badgeColor: 'primary',
    icon: 'i-lucide-gavel',
    nodeBg: 'bg-indigo-50 dark:bg-indigo-950/50',
    nodeColor: 'text-indigo-600 dark:text-indigo-400',
    nodeBorder: 'border-indigo-200 dark:border-indigo-800'
  },
  MARK: {
    badgeLabel: 'Marked To Officer',
    badgeColor: 'secondary',
    icon: 'i-lucide-arrow-right-circle',
    nodeBg: 'bg-blue-50 dark:bg-blue-950/50',
    nodeColor: 'text-blue-600 dark:text-blue-400',
    nodeBorder: 'border-blue-200 dark:border-blue-800'
  },
  MARK_BACK: {
    badgeLabel: 'Marked Back',
    badgeColor: 'warning',
    icon: 'i-lucide-undo-2',
    nodeBg: 'bg-amber-50 dark:bg-amber-950/50',
    nodeColor: 'text-amber-600 dark:text-amber-400',
    nodeBorder: 'border-amber-200 dark:border-amber-800'
  },
  DECISION: {
    badgeLabel: 'Final Decision',
    badgeColor: 'success',
    icon: 'i-lucide-award',
    nodeBg: 'bg-emerald-50 dark:bg-emerald-950/50',
    nodeColor: 'text-emerald-600 dark:text-emerald-400',
    nodeBorder: 'border-emerald-200 dark:border-emerald-800'
  }
}

function toggleOrder() {
  order.value = order.value === 'desc' ? 'asc' : 'desc'
}

function resetFilters() {
  activeFilter.value = 'ALL'
  searchQuery.value = ''
}
</script>

<template>
  <div class="space-y-6">
    <!-- Timeline Control Bar: Filters, Search, Sort & Refresh -->
    <div class="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
      <!-- Filter Segment Pills -->
      <div class="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
          :class="activeFilter === 'ALL'
            ? 'bg-primary text-inverted shadow-sm'
            : 'text-muted hover:bg-neutral-100 dark:hover:bg-neutral-800'"
          @click="activeFilter = 'ALL'"
        >
          <span>All Events</span>
          <span class="px-1.5 py-0.2 rounded-full text-[11px] font-bold" :class="activeFilter === 'ALL' ? 'bg-white/20' : 'bg-neutral-200 dark:bg-neutral-800'">
            {{ counts.all }}
          </span>
        </button>

        <button
          type="button"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
          :class="activeFilter === 'PROCEEDING'
            ? 'bg-primary text-inverted shadow-sm'
            : 'text-muted hover:bg-neutral-100 dark:hover:bg-neutral-800'"
          @click="activeFilter = 'PROCEEDING'"
        >
          <UIcon name="i-lucide-gavel" class="size-3.5" />
          <span>Hearings</span>
          <span class="px-1.5 py-0.2 rounded-full text-[11px] font-bold" :class="activeFilter === 'PROCEEDING' ? 'bg-white/20' : 'bg-neutral-200 dark:bg-neutral-800'">
            {{ counts.proceedings }}
          </span>
        </button>

        <button
          type="button"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
          :class="activeFilter === 'MARKING'
            ? 'bg-primary text-inverted shadow-sm'
            : 'text-muted hover:bg-neutral-100 dark:hover:bg-neutral-800'"
          @click="activeFilter = 'MARKING'"
        >
          <UIcon name="i-lucide-history" class="size-3.5" />
          <span>Movement & Custody</span>
          <span class="px-1.5 py-0.2 rounded-full text-[11px] font-bold" :class="activeFilter === 'MARKING' ? 'bg-white/20' : 'bg-neutral-200 dark:bg-neutral-800'">
            {{ counts.markings }}
          </span>
        </button>

        <button
          type="button"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
          :class="activeFilter === 'MILESTONE'
            ? 'bg-primary text-inverted shadow-sm'
            : 'text-muted hover:bg-neutral-100 dark:hover:bg-neutral-800'"
          @click="activeFilter = 'MILESTONE'"
        >
          <UIcon name="i-lucide-award" class="size-3.5" />
          <span>Milestones</span>
          <span class="px-1.5 py-0.2 rounded-full text-[11px] font-bold" :class="activeFilter === 'MILESTONE' ? 'bg-white/20' : 'bg-neutral-200 dark:bg-neutral-800'">
            {{ counts.milestones }}
          </span>
        </button>
      </div>

      <!-- Action & Search Controls -->
      <div class="flex items-center gap-2">
        <UInput
          v-model="searchQuery"
          icon="i-lucide-search"
          placeholder="Filter timeline events..."
          size="xs"
          class="w-48 sm:w-60"
        />

        <UButton
          :label="order === 'desc' ? 'Newest First' : 'Oldest First'"
          :icon="order === 'desc' ? 'i-lucide-arrow-down-narrow-wide' : 'i-lucide-arrow-up-narrow-wide'"
          size="xs"
          variant="outline"
          color="neutral"
          @click="toggleOrder"
        />

        <UButton
          icon="i-lucide-refresh-cw"
          size="xs"
          variant="ghost"
          color="neutral"
          :loading="status === 'pending'"
          @click="() => refresh()"
        />

        <UButton
          v-if="canWork"
          label="Record Hearing"
          icon="i-lucide-plus"
          size="xs"
          color="primary"
          @click="emit('addProceeding')"
        />
      </div>
    </div>

    <!-- Loading Skeleton State -->
    <div v-if="status === 'pending' && (!rawEvents || rawEvents.length === 0)" class="space-y-6 pl-6 border-l-2 border-neutral-200 dark:border-neutral-800 ml-4">
      <div v-for="n in 3" :key="n" class="space-y-3 relative">
        <div class="absolute -left-[31px] top-1 size-5 rounded-full bg-neutral-300 dark:bg-neutral-700 animate-pulse" />
        <div class="h-28 bg-neutral-100 dark:bg-neutral-800/60 rounded-xl animate-pulse" />
      </div>
    </div>

    <!-- Empty State (No events at all) -->
    <CommonEmptyState
      v-else-if="!rawEvents || rawEvents.length === 0"
      icon="i-lucide-history"
      title="No timeline events recorded"
      description="The chronological history of filings, hearings, and officer markings will appear here."
      :action-label="canWork ? 'Record First Proceeding' : undefined"
      @action="emit('addProceeding')"
    />

    <!-- Empty State (Filtered out) -->
    <CommonEmptyState
      v-else-if="filteredEvents.length === 0"
      icon="i-lucide-filter-x"
      title="No matching timeline events"
      description="No events match your current filter and search query."
      action-label="Reset Filters"
      @action="resetFilters"
    />

    <!-- Vertical Timeline Stream -->
    <div v-else class="relative pl-6 sm:pl-8 border-l-2 border-neutral-200 dark:border-neutral-800 ml-4 sm:ml-6 space-y-6">
      <div
        v-for="event in filteredEvents"
        :key="event.id"
        class="relative group"
      >
        <!-- Timeline Node Anchor Icon -->
        <div
          class="absolute -left-[37px] sm:-left-[45px] top-1.5 size-7 sm:size-8 rounded-full flex items-center justify-center shadow-xs border transition-transform duration-200 group-hover:scale-110"
          :class="[
            (eventMeta[event.event_type] ?? eventMeta.INSTITUTION).nodeBg,
            (eventMeta[event.event_type] ?? eventMeta.INSTITUTION).nodeColor,
            (eventMeta[event.event_type] ?? eventMeta.INSTITUTION).nodeBorder
          ]"
        >
          <UIcon :name="(eventMeta[event.event_type] ?? eventMeta.INSTITUTION).icon" class="size-4" />
        </div>

        <!-- Event Main Card -->
        <div class="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm p-4 sm:p-5 hover:border-neutral-300 dark:hover:border-neutral-700 transition">
          <!-- Card Header: Type Badge, Event Date & Actor -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-100 dark:border-neutral-800">
            <div class="flex items-center gap-2 flex-wrap">
              <UBadge
                :label="(eventMeta[event.event_type] ?? eventMeta.INSTITUTION).badgeLabel"
                :color="(eventMeta[event.event_type] ?? eventMeta.INSTITUTION).badgeColor"
                variant="subtle"
                size="xs"
              />

              <span class="inline-flex items-center gap-1 text-xs font-mono font-semibold text-highlighted bg-neutral-100 dark:bg-neutral-800/80 px-2 py-0.5 rounded">
                <UIcon name="i-lucide-calendar" class="size-3 text-muted" />
                {{ event.date }}
              </span>

              <span class="text-[11px] text-muted">
                {{ formatDateTime(event.timestamp) }}
              </span>
            </div>

            <!-- Actor badge if available -->
            <div v-if="event.actor" class="flex items-center gap-1.5 text-xs text-muted">
              <UIcon name="i-lucide-user" class="size-3.5" />
              <span>
                {{ event.actor.name }}
                <span v-if="event.actor.rank_details?.abbreviation" class="text-neutral-500 font-mono text-[10px]">
                  ({{ event.actor.rank_details.abbreviation }})
                </span>
              </span>
            </div>
          </div>

          <!-- Card Body: Title & Specific Event Sub-sections -->
          <div class="mt-3 space-y-3">
            <div class="flex items-start justify-between gap-3">
              <div>
                <h4 class="text-sm sm:text-base font-bold text-highlighted">
                  {{ event.title }}
                </h4>
                <p v-if="event.description && event.event_type !== 'PROCEEDING'" class="text-xs sm:text-sm text-muted mt-0.5">
                  {{ event.description }}
                </p>
              </div>

              <!-- Quick action for proceedings -->
              <div v-if="event.event_type === 'PROCEEDING' && canWork && event.metadata.proceeding_id" class="flex items-center gap-1 shrink-0">
                <UButton
                  icon="i-lucide-pencil"
                  label="Edit"
                  size="xs"
                  variant="ghost"
                  color="neutral"
                  @click="emit('editProceeding', String(event.metadata.proceeding_id))"
                />
              </div>
            </div>

            <!-- CASE INSTITUTION DETAILS -->
            <div
              v-if="event.event_type === 'INSTITUTION'"
              class="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800 text-xs grid grid-cols-2 sm:grid-cols-4 gap-3"
            >
              <div>
                <span class="text-muted block text-[11px]">Forum Court</span>
                <strong class="text-highlighted block mt-0.5">{{ event.metadata.court || '—' }}</strong>
              </div>

              <div>
                <span class="text-muted block text-[11px]">Category</span>
                <div class="flex items-center gap-1 mt-0.5">
                  <strong class="text-highlighted">{{ event.metadata.category || '—' }}</strong>
                  <UBadge
                    v-if="event.metadata.category_nature"
                    :label="String(event.metadata.category_nature)"
                    size="xs"
                    color="neutral"
                    variant="outline"
                  />
                </div>
              </div>

              <div>
                <span class="text-muted block text-[11px]">Managing Unit</span>
                <strong class="text-highlighted block mt-0.5">{{ event.metadata.managing_organization || '—' }}</strong>
              </div>

              <div>
                <span class="text-muted block text-[11px]">Institution #</span>
                <strong class="text-highlighted block mt-0.5 font-mono">{{ event.metadata.institution_number || '—' }}</strong>
              </div>

              <!-- Criminal FIR info if present -->
              <div
                v-if="event.metadata.police_station || event.metadata.fir_number"
                class="col-span-2 sm:col-span-4 pt-2 border-t border-neutral-200/50 dark:border-neutral-800 flex flex-wrap items-center gap-4 text-muted"
              >
                <span v-if="event.metadata.police_station">
                  PS: <strong class="text-highlighted">{{ event.metadata.police_station }}</strong>
                </span>
                <span v-if="event.metadata.fir_number">
                  FIR: <strong class="text-highlighted">#{{ event.metadata.fir_number }}/{{ event.metadata.fir_year }}</strong>
                </span>
                <span v-if="event.metadata.offence_sections">
                  Sections: <strong class="text-highlighted">{{ event.metadata.offence_sections }}</strong>
                </span>
              </div>
            </div>

            <!-- PROCEEDING / HEARING DETAILS -->
            <div v-else-if="event.event_type === 'PROCEEDING'" class="space-y-3">
              <!-- Stage and Summary row -->
              <div class="flex flex-wrap items-center gap-2 text-xs">
                <span class="text-muted">Hearing Stage:</span>
                <UBadge
                  :label="String(event.metadata.stage || 'Hearing')"
                  color="primary"
                  variant="subtle"
                  size="xs"
                />

                <span v-if="event.metadata.today_action" class="text-muted ml-2">Action:</span>
                <span v-if="event.metadata.today_action" class="font-medium text-highlighted">
                  {{ event.metadata.today_action }}
                </span>

                <UBadge
                  v-if="event.metadata.is_case_decided"
                  label="Decided in this hearing"
                  color="success"
                  variant="solid"
                  size="xs"
                  class="ml-auto"
                />
              </div>

              <!-- Short Order Sheet text -->
              <div
                v-if="event.metadata.short_order"
                class="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/40 border-l-4 border-primary text-xs space-y-1"
              >
                <div class="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
                  <UIcon name="i-lucide-scroll" class="size-3.5 text-primary" />
                  <span>Order Sheet Record</span>
                </div>
                <p class="text-neutral-700 dark:text-neutral-300 font-mono leading-relaxed whitespace-pre-line pl-1">
                  {{ event.metadata.short_order }}
                </p>
              </div>

              <!-- Next Adjournment Card -->
              <div
                v-if="event.metadata.next_proceeding_date"
                class="p-2.5 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/60 flex items-center justify-between text-xs"
              >
                <div class="flex items-center gap-2">
                  <div class="p-1.5 rounded-md bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">
                    <UIcon name="i-lucide-clock" class="size-4" />
                  </div>
                  <div>
                    <span class="text-muted text-[11px] block">Next Adjourned Hearing</span>
                    <strong class="font-bold text-primary block">
                      {{ event.metadata.next_proceeding_date }}
                    </strong>
                  </div>
                </div>

                <div v-if="event.metadata.next_stage_purpose" class="text-right">
                  <span class="text-muted text-[11px] block">Purpose</span>
                  <span class="font-medium text-highlighted text-xs">
                    {{ event.metadata.next_stage_purpose }}
                  </span>
                </div>
              </div>
            </div>

            <!-- MARKING / CUSTODY MOVEMENT -->
            <div v-else-if="event.event_type === 'MARK' || event.event_type === 'MARK_BACK'" class="space-y-2">
              <div class="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div class="flex items-center gap-2">
                  <div class="p-1 rounded-full bg-neutral-200 dark:bg-neutral-700 text-muted">
                    <UIcon name="i-lucide-user" class="size-3.5" />
                  </div>
                  <div>
                    <span class="text-[10px] text-muted block uppercase tracking-wider">From Officer</span>
                    <strong class="text-highlighted font-medium">
                      {{ event.metadata.from_user_name || '—' }}
                    </strong>
                  </div>
                </div>

                <UIcon name="i-lucide-arrow-right" class="size-4 text-muted hidden sm:block" />

                <div class="flex items-center gap-2">
                  <div class="p-1 rounded-full bg-primary/10 text-primary">
                    <UIcon name="i-lucide-user-check" class="size-3.5" />
                  </div>
                  <div>
                    <span class="text-[10px] text-muted block uppercase tracking-wider">To Assignee</span>
                    <strong class="text-primary font-semibold">
                      {{ event.metadata.to_user_name || '—' }}
                    </strong>
                  </div>
                </div>
              </div>

              <!-- Remarks quote -->
              <p
                v-if="event.metadata.remarks"
                class="text-xs p-2.5 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border-l-2 border-amber-500 text-neutral-700 dark:text-neutral-300 italic"
              >
                "{{ event.metadata.remarks }}"
              </p>
            </div>

            <!-- DECISION / FINAL MILESTONE -->
            <div
              v-else-if="event.event_type === 'DECISION'"
              class="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-between text-xs"
            >
              <div class="flex items-center gap-3">
                <div class="size-10 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <UIcon name="i-lucide-check-check" class="size-5" />
                </div>
                <div>
                  <h5 class="text-sm font-bold text-emerald-900 dark:text-emerald-300">
                    Case Concluded & Closed
                  </h5>
                  <p class="text-muted text-xs mt-0.5">
                    Official Decision Date: {{ event.metadata.decision_date || event.date }}
                  </p>
                </div>
              </div>

              <UBadge
                :label="String(event.metadata.status || 'DECIDED')"
                color="success"
                variant="solid"
                size="sm"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
