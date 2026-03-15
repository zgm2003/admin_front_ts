<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElTag, ElText } from 'element-plus'
import { UsersLoginLogApi } from '@/api/user/usersLoginLog'
import { UsersListApi } from '@/api/user/users'
import { AuditStreamLayout, useAuditStreamMetrics } from '@/components/AuditStreamLayout'
import { useLogStream, type LogStreamItem } from '@/components/LogStream'
import { Search } from '@/components/Search'
import type { SearchField } from '@/components/Search/types'
import { CommonEnum } from '@/enums'
import { useIsMobile } from '@/hooks/useResponsive'
import UsersLoginLogEntry from './components/UsersLoginLogEntry.vue'

interface DictOption {
  label: string
  value: number | string
}

interface UserLookupOption {
  id: number | string
  username?: string
  email?: string
}

interface UsersLoginLogInitResponse {
  dict: {
    platformArr: DictOption[]
    login_type_arr: DictOption[]
  }
}

interface UsersLoginLogStreamItem extends LogStreamItem {
  ip?: string
  is_success?: number
  login_account?: string
  login_type?: string
  login_type_name?: string
  platform?: string
  platform_name?: string
  reason?: string
  ua?: string
  user_name?: string
}

const { t } = useI18n()
const isMobile = useIsMobile()

const platformArr = ref<DictOption[]>([])
const loginTypeArr = ref<DictOption[]>([])
const searchForm = ref({
  user_id: '',
  login_account: '',
  login_type: '',
  ip: '',
  platform: '',
  is_success: '',
  date: [] as string[],
})

const { list, loading, hasMore, loadInitial, loadMore, refresh } = useLogStream<UsersLoginLogStreamItem>({
  api: UsersLoginLogApi,
  searchForm,
  pageSize: 20,
})

UsersLoginLogApi.init()
  .then((data: UsersLoginLogInitResponse) => {
    platformArr.value = data.dict.platformArr
    loginTypeArr.value = data.dict.login_type_arr
  })
  .catch(() => {})

const searchFields = computed<SearchField[]>(() => [
  {
    key: 'user_id',
    type: 'remote-select',
    label: t('usersLoginLog.filter.userName'),
    fetchMethod: UsersListApi.list,
    labelField: (item: UserLookupOption) => `${item.username} (${item.email})`,
    valueField: 'id',
    placeholder: t('usersLoginLog.filter.userName'),
    width: isMobile.value ? 200 : 220,
  },
  {
    key: 'login_account',
    type: 'input',
    label: t('usersLoginLog.filter.account'),
    placeholder: t('usersLoginLog.filter.account'),
    width: 180,
  },
  {
    key: 'login_type',
    type: 'select-v2',
    label: t('usersLoginLog.filter.loginType'),
    placeholder: t('usersLoginLog.filter.loginType'),
    width: isMobile.value ? 140 : 150,
    options: loginTypeArr.value,
  },
  {
    key: 'ip',
    type: 'input',
    label: t('usersLoginLog.filter.ip'),
    placeholder: t('usersLoginLog.filter.ip'),
    width: 140,
  },
  {
    key: 'platform',
    type: 'select-v2',
    label: t('usersLoginLog.filter.platform'),
    options: platformArr.value,
    placeholder: t('usersLoginLog.filter.platform'),
    width: 140,
  },
  {
    key: 'is_success',
    type: 'select-v2',
    label: t('usersLoginLog.filter.is_success'),
    options: [
      { label: t('common.success.login'), value: CommonEnum.YES },
      { label: t('common.fail.login'), value: CommonEnum.NO },
    ],
    placeholder: t('usersLoginLog.filter.is_success'),
    width: 120,
  },
  {
    key: 'date',
    type: 'date-range',
    label: t('usersLoginLog.filter.date'),
    placeholder: t('usersLoginLog.filter.date'),
    width: isMobile.value ? 280 : 300,
    props: { valueFormat: 'YYYY-MM-DD' },
  },
])

const { activeFilterCount, successCount, failureCount, successRate } = useAuditStreamMetrics({
  list,
  searchForm,
  isSuccess: (item) => item.is_success === CommonEnum.YES,
})

const headerStats = computed(() => [
  {
    key: 'total',
    tone: 'primary' as const,
    label: t('usersLoginLog.page.total'),
    value: list.value.length,
  },
  {
    key: 'success',
    tone: 'success' as const,
    label: t('usersLoginLog.page.success'),
    value: successCount.value,
  },
  {
    key: 'failed',
    tone: 'danger' as const,
    label: t('usersLoginLog.page.failed'),
    value: failureCount.value,
  },
  {
    key: 'filters',
    tone: 'warning' as const,
    label: t('usersLoginLog.page.filters'),
    value: activeFilterCount.value,
  },
])

const streamStatusLabel = computed(() =>
  failureCount.value
    ? t('usersLoginLog.page.failedHintRisk', { count: failureCount.value })
    : t('usersLoginLog.page.failedHintClear')
)

const loadStatusLabel = computed(() =>
  hasMore.value
    ? t('usersLoginLog.page.totalHintMore')
    : t('usersLoginLog.page.totalHintDone')
)

const filterHint = computed(() =>
  activeFilterCount.value
    ? t('usersLoginLog.page.filtersHintActive')
    : t('usersLoginLog.page.filtersHintNone')
)

onMounted(loadInitial)
</script>

<template>
  <AuditStreamLayout
    :title="t('menu.user_usersLoginLog')"
    :eyebrow="t('usersLoginLog.page.eyebrow')"
    :description="t('usersLoginLog.page.description')"
    :stats="headerStats"
    :filter-title="t('usersLoginLog.page.filters')"
    :filter-hint="filterHint"
    :filter-active="activeFilterCount > 0"
    :timeline-title="t('usersLoginLog.page.timeline')"
    :timeline-hint="t('usersLoginLog.page.timelineHint')"
    :list="list"
    :loading="loading"
    :has-more="hasMore"
    :empty-text="t('usersLoginLog.page.empty')"
    @load-more="loadMore"
  >
    <template #header-tags>
      <ElTag size="small" round effect="plain">
        {{ t('usersLoginLog.page.loadedTag', { count: list.length }) }}
      </ElTag>
      <ElTag v-if="activeFilterCount" size="small" round effect="plain">
        {{ t('usersLoginLog.page.filterTag', { count: activeFilterCount }) }}
      </ElTag>
    </template>

    <template #filter-meta>
      <ElTag size="small" round effect="plain">
        {{ t('usersLoginLog.page.successHint', { rate: successRate }) }}
      </ElTag>
    </template>

    <template #search>
      <Search
        v-model="searchForm"
        :fields="searchFields"
        :collapse-count="isMobile ? 2 : 6"
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
      <UsersLoginLogEntry :item="item" />
    </template>
  </AuditStreamLayout>
</template>
