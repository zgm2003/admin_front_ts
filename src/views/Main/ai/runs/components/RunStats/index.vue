<script setup lang="ts">
import {computed, onMounted, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {AiRunApi} from '@/api/ai/runs'
import {UsersListApi} from '@/api/user/users'
import {Search} from '@/components/Search'
import type {SearchField} from '@/components/Search/types'

const {t} = useI18n()

// 字典数据
const dict = ref<any>({})
const loadDict = async () => {
  try {
    const res = await AiRunApi.init()
    dict.value = res.dict || {}
  } catch { /* ignore */
  }
}

// 筛选表单
const searchForm = ref({
  date_start: '',
  date_end: '',
  agent_id: '',
  user_id: ''
})

// 筛选字段配置
const searchFields = computed<SearchField[]>(() => [
  {
    key: 'dateRange',
    type: 'date-range',
    label: t('aiRuns.stats.dateRange'),
    startKey: 'date_start',
    endKey: 'date_end'
  },
  {
    key: 'agent_id',
    type: 'select-v2',
    label: t('aiRuns.stats.agent'),
    options: dict.value.agentArr || [],
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

// 概览数据
const summaryData = ref<any>(null)
const summaryLoading = ref(false)

const loadSummary = async () => {
  summaryLoading.value = true
  try {
    summaryData.value = await AiRunApi.stats({...searchForm.value})
  } catch { /* ignore */
  }
  summaryLoading.value = false
}

// 按日期统计
const dateData = ref<any[]>([])
const dateLoading = ref(false)
const dateHasMore = ref(false)
const datePage = ref(1)

const loadDateData = async (reset = false) => {
  if (reset) {
    datePage.value = 1
    dateData.value = []
  }
  dateLoading.value = true
  try {
    const res = await AiRunApi.statsByDate({
      ...searchForm.value,
      current_page: datePage.value,
      page_size: 10
    })
    dateData.value = reset ? res.list : [...dateData.value, ...res.list]
    dateHasMore.value = res.has_more
  } catch { /* ignore */
  }
  dateLoading.value = false
}

const loadMoreDate = () => {
  datePage.value++
  loadDateData()
}

// 按智能体统计
const agentData = ref<any[]>([])
const agentLoading = ref(false)
const agentHasMore = ref(false)
const agentPage = ref(1)

const loadAgentData = async (reset = false) => {
  if (reset) {
    agentPage.value = 1
    agentData.value = []
  }
  agentLoading.value = true
  try {
    const res = await AiRunApi.statsByAgent({
      ...searchForm.value,
      current_page: agentPage.value,
      page_size: 10
    })
    agentData.value = reset ? res.list : [...agentData.value, ...res.list]
    agentHasMore.value = res.has_more
  } catch { /* ignore */
  }
  agentLoading.value = false
}

const loadMoreAgent = () => {
  agentPage.value++
  loadAgentData()
}

// 按用户统计
const userData = ref<any[]>([])
const userLoading = ref(false)
const userHasMore = ref(false)
const userPage = ref(1)

const loadUserData = async (reset = false) => {
  if (reset) {
    userPage.value = 1
    userData.value = []
  }
  userLoading.value = true
  try {
    const res = await AiRunApi.statsByUser({
      ...searchForm.value,
      current_page: userPage.value,
      page_size: 10
    })
    userData.value = reset ? res.list : [...userData.value, ...res.list]
    userHasMore.value = res.has_more
  } catch { /* ignore */
  }
  userLoading.value = false
}

const loadMoreUser = () => {
  userPage.value++
  loadUserData()
}

// 统一搜索
const onSearch = () => {
  loadSummary()
  loadDateData(true)
  loadAgentData(true)
  loadUserData(true)
}

// 格式化数字
const formatNumber = (num: number) => {
  if (!num) return '0'
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toLocaleString()
}

onMounted(async () => {
  await loadDict()
  loadSummary()
  loadDateData(true)
  loadAgentData(true)
  loadUserData(true)
})
</script>

<template>
  <div class="run-stats">
    <!-- 筛选器 -->
    <Search v-model="searchForm" :fields="searchFields" @query="onSearch" @reset="onSearch"/>

    <!-- 概览卡片 -->
    <div class="stats-section" v-loading="summaryLoading">
      <h3 class="section-title">{{ t('aiRuns.stats.overview') }}</h3>
      <el-row :gutter="16">
        <el-col :xs="12" :sm="8" :md="4">
          <div class="stat-card">
            <div class="stat-value">{{ formatNumber(summaryData?.summary?.total_runs || 0) }}</div>
            <div class="stat-label">{{ t('aiRuns.stats.totalRuns') }}</div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="8" :md="4">
          <div class="stat-card">
            <div class="stat-value">{{ formatNumber(summaryData?.summary?.total_tokens || 0) }}</div>
            <div class="stat-label">{{ t('aiRuns.stats.totalTokens') }}</div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="8" :md="4">
          <div class="stat-card">
            <div class="stat-value">{{ formatNumber(summaryData?.summary?.total_prompt_tokens || 0) }}</div>
            <div class="stat-label">{{ t('aiRuns.stats.promptTokens') }}</div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="8" :md="4">
          <div class="stat-card">
            <div class="stat-value">{{ formatNumber(summaryData?.summary?.total_completion_tokens || 0) }}</div>
            <div class="stat-label">{{ t('aiRuns.stats.completionTokens') }}</div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="8" :md="4">
          <div class="stat-card">
            <div class="stat-value">{{ summaryData?.summary?.avg_latency_ms || 0 }}<span class="stat-unit">ms</span>
            </div>
            <div class="stat-label">{{ t('aiRuns.stats.avgLatency') }}</div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="8" :md="4">
          <div class="stat-card">
            <div class="stat-value">¥{{ (summaryData?.summary?.total_cost || 0).toFixed(4) }}</div>
            <div class="stat-label">{{ t('aiRuns.stats.totalCost') }}</div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 按日期统计 -->
    <div class="stats-section" v-if="dateData.length || dateLoading">
      <h3 class="section-title">{{ t('aiRuns.stats.byDate') }}</h3>
      <el-table :data="dateData" v-loading="dateLoading" stripe size="small">
        <el-table-column prop="date" :label="t('aiRuns.stats.date')"/>
        <el-table-column prop="total_runs" :label="t('aiRuns.stats.runs')"/>
        <el-table-column :label="t('aiRuns.stats.tokens')">
          <template #default="{row}">{{ formatNumber(row.total_tokens) }}</template>
        </el-table-column>
        <el-table-column :label="t('aiRuns.stats.input')">
          <template #default="{row}">{{ formatNumber(row.total_prompt_tokens) }}</template>
        </el-table-column>
        <el-table-column :label="t('aiRuns.stats.output')">
          <template #default="{row}">{{ formatNumber(row.total_completion_tokens) }}</template>
        </el-table-column>
        <el-table-column :label="t('aiRuns.stats.latency')">
          <template #default="{row}">{{ Math.round(row.avg_latency_ms) }}ms</template>
        </el-table-column>
      </el-table>
      <div class="load-more" v-if="dateHasMore">
        <el-button @click="loadMoreDate" :loading="dateLoading" text type="primary">
          {{ t('common.loadMore') }}
        </el-button>
      </div>
    </div>

    <!-- 按智能体统计 -->
    <div class="stats-section" v-if="agentData.length || agentLoading">
      <h3 class="section-title">{{ t('aiRuns.stats.byAgent') }}</h3>
      <el-table :data="agentData" v-loading="agentLoading" stripe size="small">
        <el-table-column prop="agent_name" :label="t('aiRuns.stats.agent')"/>
        <el-table-column prop="total_runs" :label="t('aiRuns.stats.runs')"/>
        <el-table-column :label="t('aiRuns.stats.tokens')">
          <template #default="{row}">{{ formatNumber(row.total_tokens) }}</template>
        </el-table-column>
        <el-table-column :label="t('aiRuns.stats.input')">
          <template #default="{row}">{{ formatNumber(row.total_prompt_tokens) }}</template>
        </el-table-column>
        <el-table-column :label="t('aiRuns.stats.output')">
          <template #default="{row}">{{ formatNumber(row.total_completion_tokens) }}</template>
        </el-table-column>
        <el-table-column :label="t('aiRuns.stats.latency')">
          <template #default="{row}">{{ Math.round(row.avg_latency_ms) }}ms</template>
        </el-table-column>
      </el-table>
      <div class="load-more" v-if="agentHasMore">
        <el-button @click="loadMoreAgent" :loading="agentLoading" text type="primary">
          {{ t('common.loadMore') }}
        </el-button>
      </div>
    </div>

    <!-- 按用户统计 -->
    <div class="stats-section" v-if="userData.length || userLoading">
      <h3 class="section-title">{{ t('aiRuns.stats.byUser') }}</h3>
      <el-table :data="userData" v-loading="userLoading" stripe size="small">
        <el-table-column prop="username" :label="t('aiRuns.stats.user')"/>
        <el-table-column prop="total_runs" :label="t('aiRuns.stats.runs')"/>
        <el-table-column :label="t('aiRuns.stats.tokens')">
          <template #default="{row}">{{ formatNumber(row.total_tokens) }}</template>
        </el-table-column>
        <el-table-column :label="t('aiRuns.stats.input')">
          <template #default="{row}">{{ formatNumber(row.total_prompt_tokens) }}</template>
        </el-table-column>
        <el-table-column :label="t('aiRuns.stats.output')">
          <template #default="{row}">{{ formatNumber(row.total_completion_tokens) }}</template>
        </el-table-column>
        <el-table-column :label="t('aiRuns.stats.latency')">
          <template #default="{row}">{{ Math.round(row.avg_latency_ms) }}ms</template>
        </el-table-column>
      </el-table>
      <div class="load-more" v-if="userHasMore">
        <el-button @click="loadMoreUser" :loading="userLoading" text type="primary">
          {{ t('common.loadMore') }}
        </el-button>
      </div>
    </div>

    <!-- 空状态 -->
    <el-empty v-if="!summaryLoading && !summaryData?.summary?.total_runs" :description="t('aiRuns.stats.noData')"/>
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

.stat-unit {
  font-size: 14px;
  font-weight: normal;
  margin-left: 2px;
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

/* 移动端适配 */
@media (max-width: 768px) {
  .stat-card {
    padding: 12px 8px;
    margin: 0 8px 12px;
  }

  .stat-value {
    font-size: 18px;
  }

  .stat-label {
    font-size: 12px;
  }
}
</style>
