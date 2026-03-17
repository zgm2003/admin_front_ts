<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElTag, ElText } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { AuditStreamLayout, useAuditStreamMetrics } from '@/components/AuditStreamLayout'
import { useLogStream, type LogStreamItem } from '@/components/LogStream'
import { Search } from '@/components/Search'
import type { SearchField } from '@/components/Search/types'
import { UsersLoginLogApi } from '@/api/user/usersLoginLog'
import { UsersListApi } from '@/api/user/users'
import { CommonEnum } from '@/enums'
import { useIsMobile } from '@/hooks/useResponsive'
import type { DictOption } from '@/types/common'
import type { UserListItem, UserLoginLogInitResponse, UserLoginLogItem, UserLoginType } from '@/types/user'
import UsersLoginLogEntry from './components/UsersLoginLogEntry.vue'

type UsersLoginLogStreamItem = UserLoginLogItem & LogStreamItem

const { t } = useI18n()
const isMobile = useIsMobile()

const platformArr = ref<DictOption<string>[]>([])
const loginTypeArr = ref<DictOption<UserLoginType>[]>([])
const searchForm = ref({
  user_id: '',
  login_account: '',
  login_type: '' as UserLoginType | '',
  ip: '',
  platform: '',
  is_success: '' as number | '',
  date: [] as string[],
})

const { list, loading, hasMore, loadInitial, loadMore, refresh } = useLogStream<UsersLoginLogStreamItem>({
  api: UsersLoginLogApi,
  searchForm,
  pageSize: 20,
})

UsersLoginLogApi.init()
  .then((data: UserLoginLogInitResponse) => {
    platformArr.value = data.dict.platformArr
    loginTypeArr.value = data.dict.login_type_arr
  })
  .catch(() => {
    // request interceptor handles notification
  })

const searchFields = computed<SearchField[]>(() => [
  {
    key: 'user_id',
    type: 'remote-select',
    label: t('usersLoginLog.filter.userName'),
    fetchMethod: UsersListApi.list,
    labelField: (item: UserListItem) => `${item.username} (${item.email})`,
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
