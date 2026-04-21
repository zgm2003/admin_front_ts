<script setup lang="ts">
import {computed, onMounted, ref, shallowRef} from 'vue'
import {useI18n} from 'vue-i18n'
import {
  AiRunApi,
  type AiRunInitResponse,
  type AiRunStatsByAgentItem,
  type AiRunStatsByDateItem,
  type AiRunStatsByUserItem,
  type AiRunStatsListResponse,
  type AiRunStatsMetricItem,
  type AiRunStatsSummaryResponse,
} from '@/api/ai/runs'
import type { RequestPayload } from '@/types/common'
import {UsersListApi} from '@/api/user/users'
import {Search} from '@/components/Search'
import type {SearchField} from '@/components/Search/types'

const {t} = useI18n()

// 字典数据
const dict = ref<AiRunInitResponse['dict']>({
  run_status_arr: [],
  agentArr: [],
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
  user_id: number | ''
}

const searchForm = ref({
  dateRange: [] as string[],
  agent_id: '' as number | '',
  user_id: '' as number | '',
} satisfies RunStatsSearchForm)

interface RunStatsQueryParams extends RequestPayload {
  date_start: string
  date_end: string
  agent_id: number | ''
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

// ==================== 通用分页加载器 ====================
interface PagedState<T> {
  data: T[]
  loading: boolean
  hasMore: boolean
  page: number
}

function createPagedLoader<T extends AiRunStatsMetricItem>(
  apiFn: (params: RunStatsQueryParams) => Promise<AiRunStatsListResponse<T>>
) {
  const state = shallowRef<PagedState<T>>({
    data: [],
    loading: false,
    hasMore: false,
    page: 1,
  })

  const load = async (reset = false): Promise<void> => {
    if (reset) {
      state.value = {
        ...state.value,
        page: 1,
        data: [],
        hasMore: false,
      }
    }

    state.value = {
      ...state.value,
      loading: true,
    }

    try {
      const res = await apiFn(buildParams({
        current_page: state.value.page,
        page_size: 10
      }))
      state.value = {
        ...state.value,
        data: reset ? res.list : [...state.value.data, ...res.list],
        hasMore: res.has_more,
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

  const loadMore = (): void => {
    state.value = {
      ...state.value,
      page: state.value.page + 1,
    }
    void load()
  }

  return { state, load, loadMore }
}

const dateLoader = createPagedLoader<AiRunStatsByDateItem>(AiRunApi.statsByDate)
const agentLoader = createPagedLoader<AiRunStatsByAgentItem>(AiRunApi.statsByAgent)
const userLoader = createPagedLoader<AiRunStatsByUserItem>(AiRunApi.statsByUser)

// 统一搜索
const onSearch = () => {
  void loadSummary()
  void dateLoader.load(true)
  void agentLoader.load(true)
  void userLoader.load(true)
}

// 格式化数字
const formatNumber = (num: number) => {
  if (!num) return '0'
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toLocaleString()
}

// 概览卡片配置
const summaryCards = computed(() => {
  if (!summaryData.value) return []
  const s = summaryData.value.summary
  return [
    { value: formatNumber(s.total_runs), label: t('aiRuns.stats.totalRuns'), color: '' },
    { value: `${s.success_rate}%`, label: t('aiRuns.stats.successRate'), color: 'var(--el-color-success)' },
    { value: formatNumber(s.fail_runs), label: t('aiRuns.stats.failRuns'), color: 'var(--el-color-danger)' },
    { value: formatNumber(s.total_tokens), label: t('aiRuns.stats.totalTokens'), color: '' },
    { value: formatNumber(s.total_prompt_tokens), label: t('aiRuns.stats.promptTokens'), color: '' },
    { value: formatNumber(s.total_completion_tokens), label: t('aiRuns.stats.completionTokens'), color: '' },
    { value: `${s.avg_latency_ms}ms`, label: t('aiRuns.stats.avgLatency'), color: '' },
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
  { prop: 'total_prompt_tokens', label: t('aiRuns.stats.input'), formatter: formatMetricColumn },
  { prop: 'total_completion_tokens', label: t('aiRuns.stats.output'), formatter: formatMetricColumn },
  { prop: 'avg_latency_ms', label: t('aiRuns.stats.latency'), formatter: formatLatencyColumn },
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
      <el-row :gutter="16" v-if="summaryCards.length">
        <el-col v-for="(card, i) in summaryCards" :key="i" :xs="12" :sm="8" :md="6" :lg="4">
          <div class="stat-card">
            <div class="stat-value" :style="card.color ? { color: card.color } : {}">{{ card.value }}</div>
            <div class="stat-label">{{ card.label }}</div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 按日期统计 -->
    <div class="stats-section" v-if="dateLoader.state.value.data.length || dateLoader.state.value.loading">
      <h3 class="section-title">{{ t('aiRuns.stats.byDate') }}</h3>
      <el-table :data="dateLoader.state.value.data" v-loading="dateLoader.state.value.loading" stripe size="small">
        <el-table-column v-for="col in statsColumns('date', t('aiRuns.stats.date'))" :key="col.prop"
          :prop="col.prop" :label="col.label" :formatter="col.formatter" />
      </el-table>
      <div class="load-more" v-if="dateLoader.state.value.hasMore">
        <el-button @click="dateLoader.loadMore()" :loading="dateLoader.state.value.loading" text type="primary">
          {{ t('common.loadMore') }}
        </el-button>
      </div>
    </div>

    <!-- 按智能体统计 -->
    <div class="stats-section" v-if="agentLoader.state.value.data.length || agentLoader.state.value.loading">
      <h3 class="section-title">{{ t('aiRuns.stats.byAgent') }}</h3>
      <el-table :data="agentLoader.state.value.data" v-loading="agentLoader.state.value.loading" stripe size="small">
        <el-table-column v-for="col in statsColumns('agent_name', t('aiRuns.stats.agent'))" :key="col.prop"
          :prop="col.prop" :label="col.label" :formatter="col.formatter" />
      </el-table>
      <div class="load-more" v-if="agentLoader.state.value.hasMore">
        <el-button @click="agentLoader.loadMore()" :loading="agentLoader.state.value.loading" text type="primary">
          {{ t('common.loadMore') }}
        </el-button>
      </div>
    </div>

    <!-- 按用户统计 -->
    <div class="stats-section" v-if="userLoader.state.value.data.length || userLoader.state.value.loading">
      <h3 class="section-title">{{ t('aiRuns.stats.byUser') }}</h3>
      <el-table :data="userLoader.state.value.data" v-loading="userLoader.state.value.loading" stripe size="small">
        <el-table-column v-for="col in statsColumns('username', t('aiRuns.stats.user'))" :key="col.prop"
          :prop="col.prop" :label="col.label" :formatter="col.formatter" />
      </el-table>
      <div class="load-more" v-if="userLoader.state.value.hasMore">
        <el-button @click="userLoader.loadMore()" :loading="userLoader.state.value.loading" text type="primary">
          {{ t('common.loadMore') }}
        </el-button>
      </div>
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
  margin: 0 0 12px 0;
  padding: 0 16px 8px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.stat-card {
  padding: 16px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
  text-align: center;
  margin: 0 16px 12px;
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

.load-more {
  text-align: center;
  padding: 12px 0;
}

@media (max-width: 768px) {
  .stat-card { padding: 12px 8px; margin: 0 8px 12px; }
  .stat-value { font-size: 18px; }
  .stat-label { font-size: 12px; }
}
</style>
