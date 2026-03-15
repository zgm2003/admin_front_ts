<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { AuditStreamLayout, useAuditStreamMetrics } from '@/components/AuditStreamLayout'
import type { LogStreamItem } from '@/components/LogStream'

interface AuditDemoItem extends LogStreamItem {
  user_name: string
  action: string
  action_group: string
  is_success: number
  ip: string
  device: string
  detail: string
}

const pageSize = 4

const allAuditItems: AuditDemoItem[] = [
  {
    id: 1,
    created_at: '2026-03-15 09:18:21',
    user_name: 'Luna',
    action: 'Updated role permissions',
    action_group: 'Permission',
    is_success: 1,
    ip: '10.10.12.8',
    device: 'Chrome / macOS',
    detail: 'Changed finance export visibility for regional managers.',
  },
  {
    id: 2,
    created_at: '2026-03-15 09:42:06',
    user_name: 'Milo',
    action: 'Deleted expired invite token',
    action_group: 'Security',
    is_success: 1,
    ip: '10.10.12.21',
    device: 'Edge / Windows',
    detail: 'System cleanup removed a stale invitation token after verification.',
  },
  {
    id: 3,
    created_at: '2026-03-15 10:06:54',
    user_name: 'Ava',
    action: 'Reset admin MFA',
    action_group: 'Security',
    is_success: 0,
    ip: '10.10.14.3',
    device: 'Safari / iPhone',
    detail: 'Reset request was blocked because the approval chain was incomplete.',
  },
  {
    id: 4,
    created_at: '2026-03-15 10:28:11',
    user_name: 'Noah',
    action: 'Synced department tree',
    action_group: 'Org',
    is_success: 1,
    ip: '10.10.15.7',
    device: 'Chrome / Linux',
    detail: 'Imported 28 department updates from the master directory.',
  },
  {
    id: 5,
    created_at: '2026-03-15 11:13:47',
    user_name: 'Emma',
    action: 'Changed tenant theme color',
    action_group: 'Brand',
    is_success: 1,
    ip: '10.10.18.2',
    device: 'Chrome / Android',
    detail: 'Updated tenant accent color to align with the new spring campaign.',
  },
  {
    id: 6,
    created_at: '2026-03-15 11:37:05',
    user_name: 'Liam',
    action: 'Exported salary report',
    action_group: 'Finance',
    is_success: 0,
    ip: '10.10.21.4',
    device: 'Edge / Windows',
    detail: 'Export failed because the requesting role no longer had download scope.',
  },
  {
    id: 7,
    created_at: '2026-03-14 17:49:13',
    user_name: 'Sophia',
    action: 'Created onboarding workflow',
    action_group: 'Workflow',
    is_success: 1,
    ip: '10.10.8.14',
    device: 'Chrome / macOS',
    detail: 'New onboarding workflow includes device assignment and access review.',
  },
  {
    id: 8,
    created_at: '2026-03-14 18:21:33',
    user_name: 'Ethan',
    action: 'Archived operation log batch',
    action_group: 'Audit',
    is_success: 1,
    ip: '10.10.6.9',
    device: 'Firefox / Ubuntu',
    detail: 'Archived 1,280 legacy operation records into cold storage.',
  },
]

const searchForm = ref({
  keyword: '',
  outcome: '',
  date: '',
})

const visibleCount = ref(pageSize)

const dateOptions = computed(() =>
  Array.from(new Set(allAuditItems.map((item) => item.created_at.slice(0, 10)))).map((value) => ({
    label: value,
    value,
  }))
)

const filteredItems = computed(() => {
  const keyword = searchForm.value.keyword.trim().toLowerCase()

  return allAuditItems.filter((item) => {
    const matchesKeyword = !keyword || [
      item.user_name,
      item.action,
      item.action_group,
      item.ip,
      item.device,
      item.detail,
    ].some((value) => value.toLowerCase().includes(keyword))

    const matchesOutcome = !searchForm.value.outcome || String(item.is_success) === searchForm.value.outcome
    const matchesDate = !searchForm.value.date || item.created_at.startsWith(searchForm.value.date)

    return matchesKeyword && matchesOutcome && matchesDate
  })
})

const visibleItems = computed(() => filteredItems.value.slice(0, visibleCount.value))
const hasMore = computed(() => visibleItems.value.length < filteredItems.value.length)

const filterSignature = computed(() => JSON.stringify(searchForm.value))

watch(filterSignature, () => {
  visibleCount.value = pageSize
})

const {
  activeFilterCount,
  successCount,
  failureCount,
  successRate,
} = useAuditStreamMetrics({
  list: visibleItems,
  searchForm,
  isSuccess: (item) => item.is_success === 1,
})

const stats = computed(() => [
  { key: 'loaded', tone: 'primary' as const, label: 'Loaded', value: visibleItems.value.length },
  { key: 'success', tone: 'success' as const, label: 'Success', value: successCount.value },
  { key: 'failed', tone: 'danger' as const, label: 'Failed', value: failureCount.value },
  { key: 'rate', tone: 'warning' as const, label: 'Success rate', value: `${successRate.value}%` },
])

const filterHint = computed(() =>
  activeFilterCount.value
    ? `${activeFilterCount.value} active filters`
    : 'Use the search slot to simulate real audit filtering.'
)

const timelineHint = computed(() => {
  if (!filteredItems.value.length) return 'No entries match the current filter state.'
  if (hasMore.value) return `${visibleItems.value.length} of ${filteredItems.value.length} entries loaded`
  return `${visibleItems.value.length} entries loaded`
})

const toolbarState = computed(() =>
  hasMore.value ? 'More entries available' : 'All matching entries are loaded'
)

const auditLayoutProps = [
  { name: 'title / eyebrow / description', type: 'string', desc: 'Header copy shown above the stream.' },
  { name: 'stats', type: 'AuditStreamStat[]', desc: 'KPI pills rendered in the page header.' },
  { name: 'filterTitle / filterHint', type: 'string', desc: 'Filter panel heading and helper text.' },
  { name: 'filterActive', type: 'boolean', desc: 'Highlights the filter card when any condition is active.' },
  { name: 'timelineTitle / timelineHint', type: 'string', desc: 'Stream toolbar heading content.' },
  { name: 'list', type: 'LogStreamItem[]', desc: 'Entries passed through to the underlying LogStream.' },
  { name: 'loading / hasMore', type: 'boolean', desc: 'Controls the footer loading and load-more states.' },
  { name: 'emptyText', type: 'string', desc: 'Empty state copy forwarded to LogStream.' },
]

const auditLayoutSlots = [
  { name: 'header-tags', desc: 'Optional pills or badges placed beside the title block.' },
  { name: 'filter-meta', desc: 'Right-side summary content in the filter header.' },
  { name: 'search', desc: 'Filter controls area. Usually Search, form, or custom filter widgets.' },
  { name: 'toolbar-right', desc: 'Extra status content aligned to the right of the timeline toolbar.' },
  { name: 'default', desc: 'Required item renderer. Receives `{ item }` from LogStream.' },
]

const auditMetricsOptions = [
  { name: 'list', type: 'Ref<T[]>', desc: 'The currently rendered audit list.' },
  { name: 'searchForm', type: 'Ref<Record<string, unknown>>', desc: 'Filter state used to count active conditions.' },
  { name: 'isSuccess', type: '(item: T) => boolean', desc: 'Custom success predicate for success/failure metrics.' },
]

const resetFilters = () => {
  searchForm.value = {
    keyword: '',
    outcome: '',
    date: '',
  }
}

const loadMore = () => {
  if (!hasMore.value) return
  visibleCount.value += pageSize
}
</script>

<template>
  <div class="audit-stream-demo">
    <div class="demo-section">
      <h4>AuditStreamLayout</h4>
      <div class="demo-block demo-block--audit">
        <AuditStreamLayout
          title="Audit activity shell"
          eyebrow="Compound component"
          description="A page-level layout that wraps stream analytics, filters, and the audit timeline into one consistent shell."
          :stats="stats"
          filter-title="Search slot"
          :filter-hint="filterHint"
          :filter-active="activeFilterCount > 0"
          timeline-title="Audit timeline"
          :timeline-hint="timelineHint"
          :list="visibleItems"
          :has-more="hasMore"
          empty-text="No audit entries match the current filters."
          @load-more="loadMore"
        >
          <template #header-tags>
            <el-tag effect="plain">Demo</el-tag>
            <el-tag type="info" effect="plain">Mobile friendly</el-tag>
          </template>

          <template #filter-meta>
            <el-text type="info" size="small">{{ filteredItems.length }} matched</el-text>
          </template>

          <template #search>
            <div class="demo-filters">
              <el-input
                v-model="searchForm.keyword"
                clearable
                placeholder="Search user, action, device, IP"
              />
              <el-select
                v-model="searchForm.outcome"
                clearable
                placeholder="Outcome"
              >
                <el-option label="Success" value="1" />
                <el-option label="Failed" value="0" />
              </el-select>
              <el-select
                v-model="searchForm.date"
                clearable
                placeholder="Day"
              >
                <el-option
                  v-for="option in dateOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
              <el-button @click="resetFilters">Reset</el-button>
            </div>
          </template>

          <template #toolbar-right>
            <el-tag :type="hasMore ? 'warning' : 'success'" effect="plain">
              {{ toolbarState }}
            </el-tag>
          </template>

          <template #default="{ item }">
            <article class="audit-entry" :class="{ 'is-failed': item.is_success !== 1 }">
              <div class="audit-entry__top">
                <div class="audit-entry__identity">
                  <span class="audit-entry__user">{{ item.user_name }}</span>
                  <el-tag
                    size="small"
                    effect="plain"
                    :type="item.is_success === 1 ? 'success' : 'danger'"
                  >
                    {{ item.is_success === 1 ? 'Success' : 'Failed' }}
                  </el-tag>
                </div>
                <span class="audit-entry__group">{{ item.action_group }}</span>
              </div>

              <p class="audit-entry__action">{{ item.action }}</p>
              <p class="audit-entry__detail">{{ item.detail }}</p>

              <div class="audit-entry__meta">
                <span>{{ item.ip }}</span>
                <span>{{ item.device }}</span>
                <span>{{ item.created_at }}</span>
              </div>
            </article>
          </template>
        </AuditStreamLayout>
      </div>
      <div class="demo-code">
        <el-text type="info">
          &lt;AuditStreamLayout :stats="stats" :list="list" :has-more="hasMore" @load-more="loadMore"&gt;
        </el-text>
      </div>
    </div>

    <div class="demo-section">
      <h4>Attributes</h4>
      <el-table :data="auditLayoutProps" border>
        <el-table-column prop="name" label="Prop" width="240" />
        <el-table-column prop="type" label="Type" width="180" />
        <el-table-column prop="desc" label="Description" />
      </el-table>
    </div>

    <div class="demo-section">
      <h4>Slots</h4>
      <el-table :data="auditLayoutSlots" border>
        <el-table-column prop="name" label="Slot" width="200" />
        <el-table-column prop="desc" label="Description" />
      </el-table>
    </div>

    <div class="demo-section">
      <h4>useAuditStreamMetrics</h4>
      <el-table :data="auditMetricsOptions" border>
        <el-table-column prop="name" label="Option" width="200" />
        <el-table-column prop="type" label="Type" width="220" />
        <el-table-column prop="desc" label="Description" />
      </el-table>
    </div>
  </div>
</template>

<style scoped lang="scss">
.audit-stream-demo {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.demo-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.demo-section h4 {
  margin: 0;
  font-size: 16px;
  color: var(--el-text-color-primary);
}

.demo-block {
  padding: 24px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  margin-bottom: 8px;
}

.demo-block--audit {
  height: 780px;
  min-height: 0;
}

.demo-code {
  padding: 12px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
}

.demo-filters {
  display: grid;
  grid-template-columns: minmax(0, 2fr) repeat(2, minmax(0, 1fr)) auto;
  gap: 12px;
  align-items: center;
}

.audit-entry {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  background: linear-gradient(180deg, var(--el-bg-color), var(--el-fill-color-blank));

  &.is-failed {
    border-color: var(--el-color-danger-light-7);
    background: linear-gradient(180deg, var(--el-bg-color), var(--el-color-danger-light-9));
  }
}

.audit-entry__top,
.audit-entry__identity,
.audit-entry__meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.audit-entry__top {
  justify-content: space-between;
}

.audit-entry__user,
.audit-entry__action {
  color: var(--el-text-color-primary);
}

.audit-entry__user {
  font-size: 15px;
  font-weight: 700;
}

.audit-entry__group {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.audit-entry__action,
.audit-entry__detail {
  margin: 0;
}

.audit-entry__action {
  font-size: 14px;
  font-weight: 600;
}

.audit-entry__detail {
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-regular);
}

.audit-entry__meta {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

@media (max-width: 768px) {
  .demo-block {
    padding: 16px;
  }

  .demo-block--audit {
    height: auto;
    min-height: 680px;
  }

  .demo-filters {
    grid-template-columns: 1fr;
  }

  .demo-section :deep(.el-table) {
    font-size: 12px;
  }
}
</style>
