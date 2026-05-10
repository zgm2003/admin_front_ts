<script setup lang="ts">
import {computed, onMounted, ref, shallowRef} from 'vue'
import {useI18n} from 'vue-i18n'
import {
  AiRunApi,
  type AiRunInitResponse,
  type AiRunStatsByAgentItem,
  type AiRunStatsByDateItem,
  type AiRunStatsListParams,
  type AiRunStatsMetricItem,
  type AiRunStatsSummaryResponse,
} from '@/api/ai/runs'
import type { PaginatedResponse, RequestPayload } from '@/types/common'
import {UsersListApi} from '@/api/user/users'
import {Search} from '@/components/Search'
import type {SearchField} from '@/components/Search/types'

const {t} = useI18n()
const TOP_LIMIT = 10

// 字典数据
const dict = ref<AiRunInitResponse['dict']>({
  status_arr: [],
  agentArr: [],
  providerArr: [],
})
const loadDict = async () => {
  try {
    const res = await AiRunApi.init()
    dict.value = res.dict
  } catch { /* ignore */ }
}

// 筛选表单 — dateRange 是数组 [start, end]，Search 组件 date-range 类型绑定到单个 key
interface RunStatsSearchForm {
  dateRange: string[]
  agent_id: number | ''
  provider_id: number | ''
  user_id: number | ''
}

const searchForm = ref({
  dateRange: [] as string[],
  agent_id: '' as number | '',
  provider_id: '' as number | '',
  user_id: '' as number | '',
} satisfies RunStatsSearchForm)

interface RunStatsQueryParams extends RequestPayload {
  date_start: string
  date_end: string
  agent_id: number | ''
  provider_id: number | ''
  user_id: number | ''
  current_page?: number
  page_size?: number
}

// 将 dateRange 数组拆分为后端需要的 date_start / date_end
const buildParams = (extra: Partial<RunStatsQueryParams> = {}): RunStatsQueryParams => {
  const [date_start, date_end] = searchForm.value.dateRange
  return {
    date_start: date_start ?? '',
    date_end: date_end ?? '',
    agent_id: searchForm.value.agent_id,
    provider_id: searchForm.value.provider_id,
    user_id: searchForm.value.user_id,
    ...extra
  }
}

// 筛选字段配置
const searchFields = computed<SearchField[]>(() => [
  {
    key: 'dateRange',
    type: 'date-range',
    label: t('aiRuns.stats.dateRange'),
  },
  {
    key: 'agent_id',
    type: 'select-v2',
    label: t('aiRuns.stats.agent'),
    options: dict.value.agentArr,
    clearable: true
  },
  {
    key: 'provider_id',
    type: 'select-v2',
    label: t('aiRuns.stats.provider'),
    options: dict.value.providerArr,
    clearable: true
  },
  {
    key: 'user_id',
    type: 'remote-select',
    label: t('aiRuns.stats.user'),
    fetchMethod: UsersListApi.list,
    labelField: 'username',
    valueField: 'id',
    placeholder: t('aiRuns.stats.user'),
    width: 180
  }
])

// ==================== 概览 ====================
const summaryData = ref<AiRunStatsSummaryResponse | null>(null)
const summaryLoading = ref(false)

const loadSummary = async () => {
  summaryLoading.value = true
  try {
    summaryData.value = await AiRunApi.stats(buildParams())
  } catch { /* ignore */ }
  summaryLoading.value = false
}

// ==================== TopN 加载器 ====================
interface TopState<T> {
  data: T[]
  loading: boolean
}

function createTopLoader<T extends AiRunStatsMetricItem>(
  apiFn: (params: AiRunStatsListParams) => Promise<PaginatedResponse<T>>
) {
  const state = shallowRef<TopState<T>>({
    data: [],
    loading: false,
  })

  const load = async (): Promise<void> => {
    state.value = {
      ...state.value,
      loading: true,
    }

    try {
      const params: AiRunStatsListParams = {
        ...buildParams(),
        current_page: 1,
        page_size: TOP_LIMIT,
      }
      const res = await apiFn(params)
      state.value = {
        ...state.value,
        data: res.list,
      }
    } catch {
      // request interceptor handles notification
    } finally {
      state.value = {
        ...state.value,
        loading: false,
      }
    }
  }

  return { state, load }
}

const dateLoader = createTopLoader<AiRunStatsByDateItem>(AiRunApi.statsByDate)
const agentLoader = createTopLoader<AiRunStatsByAgentItem>(AiRunApi.statsByAgent)

// 统一搜索
const onSearch = () => {
  void loadSummary()
  void dateLoader.load()
  void agentLoader.load()
}

// 格式化数字
const formatNumber = (num: number) => {
  if (!num) return '0'
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toLocaleString()
}

// 概览卡片配置
interface SummaryCard {
  value: string
  label: string
  color: string
  detail?: string
}

const summaryCards = computed<SummaryCard[]>(() => {
  if (!summaryData.value) return []
  const s = summaryData.value.summary
  return [
    { value: formatNumber(s.total_runs), label: t('aiRuns.stats.totalRuns'), color: '' },
    { value: `${s.success_rate}%`, label: t('aiRuns.stats.successRate'), color: 'var(--el-color-success)' },
    { value: formatNumber(s.fail_runs), label: t('aiRuns.stats.failRuns'), color: 'var(--el-color-danger)' },
    {
      value: formatNumber(s.total_tokens),
      label: t('aiRuns.stats.totalTokens'),
      detail: t('aiRuns.stats.tokenSplit', {
        input: formatNumber(s.total_prompt_tokens),
        output: formatNumber(s.total_completion_tokens),
      }),
      color: ''
    },
    { value: `${s.avg_duration_ms}ms`, label: t('aiRuns.stats.avgLatency'), color: '' },
  ]
})

const hasSummaryData = computed(() => {
  return summaryData.value !== null && summaryData.value.summary.total_runs > 0
})

// 统计表格列定义（三个表共用）
type StatsFormatter = (_row: unknown, _column: unknown, value: number) => string

const formatMetricColumn: StatsFormatter = (_row, _column, value) => formatNumber(value)
const formatLatencyColumn: StatsFormatter = (_row, _column, value) => {
  return value ? `${Math.round(value)}ms` : '-'
}

const statsColumns = (nameKey: string, nameLabel: string) => [
  { prop: nameKey, label: nameLabel },
  { prop: 'total_runs', label: t('aiRuns.stats.runs') },
  { prop: 'total_tokens', label: t('aiRuns.stats.tokens'), formatter: formatMetricColumn },
  { prop: 'avg_duration_ms', label: t('aiRuns.stats.latency'), formatter: formatLatencyColumn },
]

onMounted(async () => {
  await loadDict()
  onSearch()
})
</script>

<template>
  <div class="run-stats">
    <!-- 筛选器 -->
    <Search v-model="searchForm" :fields="searchFields" @query="onSearch" @reset="onSearch"/>

    <!-- 概览卡片 -->
    <div class="stats-section" v-loading="summaryLoading">
      <h3 class="section-title">{{ t('aiRuns.stats.overview') }}</h3>
      <p class="section-subtitle">{{ t('aiRuns.stats.keyOnlyTip') }}</p>
      <div v-if="summaryCards.length" class="summary-grid">
        <div v-for="(card, i) in summaryCards" :key="i" class="stat-card">
          <div class="stat-value" :style="card.color ? { color: card.color } : {}">{{ card.value }}</div>
          <div class="stat-label">{{ card.label }}</div>
          <div v-if="card.detail" class="stat-detail">{{ card.detail }}</div>
        </div>
      </div>
    </div>

    <!-- 按日期统计 -->
    <div class="stats-section" v-if="dateLoader.state.value.data.length || dateLoader.state.value.loading">
      <h3 class="section-title">{{ t('aiRuns.stats.recentDates') }}</h3>
      <el-table :data="dateLoader.state.value.data" v-loading="dateLoader.state.value.loading" stripe size="small">
        <el-table-column v-for="col in statsColumns('date', t('aiRuns.stats.date'))" :key="col.prop"
          :prop="col.prop" :label="col.label" :formatter="col.formatter" />
      </el-table>
    </div>

    <!-- 按智能体统计 -->
    <div class="stats-section" v-if="agentLoader.state.value.data.length || agentLoader.state.value.loading">
      <h3 class="section-title">{{ t('aiRuns.stats.topAgents') }}</h3>
      <el-table :data="agentLoader.state.value.data" v-loading="agentLoader.state.value.loading" stripe size="small">
        <el-table-column v-for="col in statsColumns('agent_name', t('aiRuns.stats.agent'))" :key="col.prop"
          :prop="col.prop" :label="col.label" :formatter="col.formatter" />
      </el-table>
    </div>

    <!-- 空状态 -->
    <el-empty v-if="!summaryLoading && !hasSummaryData" :description="t('aiRuns.stats.noData')"/>
  </div>
</template>

<style scoped>
.run-stats {
  padding: 16px 0;
  height: 100%;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
}

.stats-section {
  margin-bottom: 24px;
  overflow: hidden;
  flex-shrink: 0;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0;
  padding: 0 16px 8px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.section-subtitle {
  margin: 10px 16px 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
  padding: 0 16px 12px;
}

.stat-card {
  min-height: 92px;
  padding: 16px 12px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: var(--el-color-primary);
  line-height: 1.2;
}

.stat-label {
  margin-top: 6px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.stat-detail {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 768px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    padding: 0 8px 12px;
  }
  .section-subtitle {
    margin-left: 8px;
    margin-right: 8px;
  }
  .stat-card { padding: 12px 8px; }
  .stat-value { font-size: 18px; }
  .stat-label { font-size: 12px; }
}
</style>
