<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElTag, ElText } from 'element-plus'
import { AuditStreamLayout, useAuditStreamMetrics } from '@/components/AuditStreamLayout'
import { useLogStream, type LogStreamItem } from '@/components/LogStream'
import { Search } from '@/components/Search'
import type { SearchField } from '@/components/Search/types'
import { CommonEnum } from '@/enums'
import { OperationLogApi } from '@/api/system/operationLog'
import { UsersListApi } from '@/api/user/users'
import { useIsMobile } from '@/hooks/useResponsive'
import { useUserStore } from '@/store/user'
import OperationLogEntry from './components/OperationLogEntry.vue'

interface UserLookupOption {
  id: number | string
  username?: string
  email?: string
}

interface OperationLogStreamItem extends LogStreamItem {
  action?: string
  is_success?: number
  request_data?: string | null
  response_data?: string | null
  user_email?: string
  user_name?: string
}

const userStore = useUserStore()
const { t } = useI18n()
const isMobile = useIsMobile()

const searchForm = ref({
  user_id: '',
  action: '',
  date: [] as string[],
})

const { list, loading, hasMore, loadInitial, loadMore, refresh } = useLogStream<OperationLogStreamItem>({
  api: OperationLogApi,
  searchForm,
  pageSize: 20,
})

const searchFields = computed<SearchField[]>(() => [
  {
    key: 'user_id',
    type: 'remote-select',
    label: t('operationLog.filter.userName'),
    fetchMethod: UsersListApi.list,
    labelField: (item: UserLookupOption) => `${item.username} (${item.email})`,
    valueField: 'id',
    placeholder: t('operationLog.filter.userName'),
    width: isMobile.value ? 200 : 220,
  },
  {
    key: 'action',
    type: 'input',
    label: t('operationLog.filter.action'),
    placeholder: t('operationLog.filter.action'),
    width: isMobile.value ? 180 : 220,
  },
  {
    key: 'date',
    type: 'date-range',
    label: t('operationLog.filter.date'),
    placeholder: t('operationLog.filter.date'),
    width: isMobile.value ? 260 : 300,
    props: { valueFormat: 'YYYY-MM-DD' },
  },
])

const canDelete = computed(() => userStore.can('devTools_operationLog_del'))

const { activeFilterCount, successCount, failureCount, successRate } = useAuditStreamMetrics({
  list,
  searchForm,
  isSuccess: (item) => item.is_success === CommonEnum.YES,
})

const payloadCount = computed(() =>
  list.value.filter((item) => item.request_data || item.response_data).length
)

const headerStats = computed(() => [
  {
    key: 'total',
    tone: 'primary' as const,
    label: t('operationLog.page.total'),
    value: list.value.length,
  },
  {
    key: 'success',
    tone: 'success' as const,
    label: t('operationLog.page.success'),
    value: successCount.value,
  },
  {
    key: 'failed',
    tone: 'danger' as const,
    label: t('operationLog.page.failed'),
    value: failureCount.value,
  },
  {
    key: 'payload',
    tone: 'warning' as const,
    label: t('operationLog.page.payload'),
    value: payloadCount.value,
  },
])

const streamStatusLabel = computed(() =>
  failureCount.value
    ? t('operationLog.page.failedHintRisk', { count: failureCount.value })
    : t('operationLog.page.failedHintClear')
)

const loadStatusLabel = computed(() =>
  hasMore.value
    ? t('operationLog.page.totalHintMore')
    : t('operationLog.page.totalHintDone')
)

const filterHint = computed(() =>
  activeFilterCount.value
    ? t('operationLog.page.filtersHintActive')
    : t('operationLog.page.filtersHintNone')
)

const handleDel = async (id: number | string) => {
  await OperationLogApi.del({ id: [id] })
  ElMessage.success(t('common.success.delete'))
  await refresh()
}

onMounted(loadInitial)
</script>

<template>
  <AuditStreamLayout
    :title="t('menu.system_operationLog')"
    :eyebrow="t('operationLog.page.eyebrow')"
    :description="t('operationLog.page.description')"
    :stats="headerStats"
    :filter-title="t('operationLog.page.filters')"
    :filter-hint="filterHint"
    :filter-active="activeFilterCount > 0"
    :timeline-title="t('operationLog.page.timeline')"
    :timeline-hint="t('operationLog.page.timelineHint')"
    :list="list"
    :loading="loading"
    :has-more="hasMore"
    :empty-text="t('operationLog.page.empty')"
    @load-more="loadMore"
  >
    <template #header-tags>
      <ElTag size="small" round effect="plain">
        {{ t('operationLog.page.loadedTag', { count: list.length }) }}
      </ElTag>
      <ElTag v-if="activeFilterCount" size="small" round effect="plain">
        {{ t('operationLog.page.filterTag', { count: activeFilterCount }) }}
      </ElTag>
    </template>

    <template #filter-meta>
      <ElTag size="small" round effect="plain">
        {{ t('operationLog.page.successHint', { rate: successRate }) }}
      </ElTag>
    </template>

    <template #search>
      <Search
        v-model="searchForm"
        :fields="searchFields"
        :collapse-count="isMobile ? 2 : 3"
        @query="refresh"
        @reset="refresh"
      />
    </template>

    <template #toolbar-right>
      <ElTag
        size="small"
        round
        :type="failureCount ? 'danger' : 'success'"
        :effect="failureCount ? 'light' : 'plain'"
      >
        {{ streamStatusLabel }}
      </ElTag>
      <ElText type="info" size="small">{{ loadStatusLabel }}</ElText>
    </template>

    <template #default="{ item }">
      <OperationLogEntry
        :item="item"
        :can-delete="canDelete"
        @delete="handleDel"
      />
    </template>
  </AuditStreamLayout>
</template>
