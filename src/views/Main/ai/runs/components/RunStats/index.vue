<script setup lang="ts">
import {ref, onMounted} from 'vue'
import {useI18n} from 'vue-i18n'
import {AiRunApi} from '@/api/ai/runs'

const {t} = useI18n()

// 统计数据
const statsData = ref<any>(null)
const statsLoading = ref(false)
const statsDateRange = ref<[string, string] | null>(null)

const loadStats = async () => {
  statsLoading.value = true
  try {
    const params: any = {}
    if (statsDateRange.value) {
      params.date_start = statsDateRange.value[0]
      params.date_end = statsDateRange.value[1]
    }
    const data = await AiRunApi.stats(params)
    statsData.value = data
  } catch { /* ignore */ }
  statsLoading.value = false
}

const onDateChange = () => {
  loadStats()
}

// 格式化数字
const formatNumber = (num: number) => {
  if (!num) return '0'
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toLocaleString()
}

onMounted(() => {
  loadStats()
})
</script>

<template>
  <div class="run-stats" v-loading="statsLoading">
    <!-- 筛选器 -->
    <div class="stats-filter">
      <el-date-picker
        v-model="statsDateRange"
        type="daterange"
        :range-separator="t('common.to')"
        :start-placeholder="t('aiRuns.stats.startDate')"
        :end-placeholder="t('aiRuns.stats.endDate')"
        value-format="YYYY-MM-DD"
        @change="onDateChange"
        clearable
      />
    </div>

    <!-- 概览卡片 -->
    <div class="stats-section">
      <h3 class="section-title">{{ t('aiRuns.stats.overview') }}</h3>
      <el-row :gutter="16">
        <el-col :xs="12" :sm="8" :md="4">
          <div class="stat-card">
            <div class="stat-value">{{ formatNumber(statsData?.summary?.total_runs || 0) }}</div>
            <div class="stat-label">{{ t('aiRuns.stats.totalRuns') }}</div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="8" :md="4">
          <div class="stat-card">
            <div class="stat-value">{{ formatNumber(statsData?.summary?.total_tokens || 0) }}</div>
            <div class="stat-label">{{ t('aiRuns.stats.totalTokens') }}</div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="8" :md="4">
          <div class="stat-card">
            <div class="stat-value">{{ formatNumber(statsData?.summary?.total_prompt_tokens || 0) }}</div>
            <div class="stat-label">{{ t('aiRuns.stats.promptTokens') }}</div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="8" :md="4">
          <div class="stat-card">
            <div class="stat-value">{{ formatNumber(statsData?.summary?.total_completion_tokens || 0) }}</div>
            <div class="stat-label">{{ t('aiRuns.stats.completionTokens') }}</div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="8" :md="4">
          <div class="stat-card">
            <div class="stat-value">{{ statsData?.summary?.avg_latency_ms || 0 }}<span class="stat-unit">ms</span></div>
            <div class="stat-label">{{ t('aiRuns.stats.avgLatency') }}</div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="8" :md="4">
          <div class="stat-card">
            <div class="stat-value">¥{{ (statsData?.summary?.total_cost || 0).toFixed(4) }}</div>
            <div class="stat-label">{{ t('aiRuns.stats.totalCost') }}</div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 按日期统计 -->
    <div class="stats-section" v-if="statsData?.by_date?.length">
      <h3 class="section-title">{{ t('aiRuns.stats.byDate') }}</h3>
      <el-table :data="statsData.by_date" stripe size="small" max-height="300">
        <el-table-column prop="date" :label="t('aiRuns.stats.date')" fixed min-width="100" />
        <el-table-column prop="total_runs" :label="t('aiRuns.stats.runs')" min-width="70" />
        <el-table-column :label="t('aiRuns.stats.tokens')" min-width="80">
          <template #default="{row}">{{ formatNumber(row.total_tokens) }}</template>
        </el-table-column>
        <el-table-column :label="t('aiRuns.stats.input')" min-width="70">
          <template #default="{row}">{{ formatNumber(row.total_prompt_tokens) }}</template>
        </el-table-column>
        <el-table-column :label="t('aiRuns.stats.output')" min-width="70">
          <template #default="{row}">{{ formatNumber(row.total_completion_tokens) }}</template>
        </el-table-column>
        <el-table-column :label="t('aiRuns.stats.latency')" min-width="80">
          <template #default="{row}">{{ Math.round(row.avg_latency_ms) }}ms</template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 按智能体统计 -->
    <div class="stats-section" v-if="statsData?.by_agent?.length">
      <h3 class="section-title">{{ t('aiRuns.stats.byAgent') }}</h3>
      <el-table :data="statsData.by_agent" stripe size="small" max-height="300">
        <el-table-column prop="agent_name" :label="t('aiRuns.stats.agent')" fixed min-width="100" />
        <el-table-column prop="total_runs" :label="t('aiRuns.stats.runs')" min-width="70" />
        <el-table-column :label="t('aiRuns.stats.tokens')" min-width="80">
          <template #default="{row}">{{ formatNumber(row.total_tokens) }}</template>
        </el-table-column>
        <el-table-column :label="t('aiRuns.stats.input')" min-width="70">
          <template #default="{row}">{{ formatNumber(row.total_prompt_tokens) }}</template>
        </el-table-column>
        <el-table-column :label="t('aiRuns.stats.output')" min-width="70">
          <template #default="{row}">{{ formatNumber(row.total_completion_tokens) }}</template>
        </el-table-column>
        <el-table-column :label="t('aiRuns.stats.latency')" min-width="80">
          <template #default="{row}">{{ Math.round(row.avg_latency_ms) }}ms</template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 按用户统计 -->
    <div class="stats-section" v-if="statsData?.by_user?.length">
      <h3 class="section-title">{{ t('aiRuns.stats.byUser') }}</h3>
      <el-table :data="statsData.by_user" stripe size="small" max-height="300">
        <el-table-column prop="username" :label="t('aiRuns.stats.user')" fixed min-width="80" />
        <el-table-column prop="total_runs" :label="t('aiRuns.stats.runs')" min-width="70" />
        <el-table-column :label="t('aiRuns.stats.tokens')" min-width="80">
          <template #default="{row}">{{ formatNumber(row.total_tokens) }}</template>
        </el-table-column>
        <el-table-column :label="t('aiRuns.stats.input')" min-width="70">
          <template #default="{row}">{{ formatNumber(row.total_prompt_tokens) }}</template>
        </el-table-column>
        <el-table-column :label="t('aiRuns.stats.output')" min-width="70">
          <template #default="{row}">{{ formatNumber(row.total_completion_tokens) }}</template>
        </el-table-column>
        <el-table-column :label="t('aiRuns.stats.latency')" min-width="80">
          <template #default="{row}">{{ Math.round(row.avg_latency_ms) }}ms</template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 空状态 -->
    <el-empty v-if="!statsLoading && !statsData?.summary?.total_runs" :description="t('aiRuns.stats.noData')" />
  </div>
</template>

<style scoped>
.run-stats {
  padding: 16px;
  height: 100%;
  overflow-y: auto;
}

.stats-filter {
  margin-bottom: 20px;
}

.stats-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0 0 12px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.stat-card {
  padding: 16px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
  text-align: center;
  margin-bottom: 12px;
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

/* 移动端适配 */
@media (max-width: 768px) {
  .run-stats {
    padding: 12px;
  }
  
  .stats-filter :deep(.el-date-editor) {
    width: 100% !important;
  }
  
  .stat-card {
    padding: 12px 8px;
  }
  
  .stat-value {
    font-size: 18px;
  }
  
  .stat-label {
    font-size: 12px;
  }
  
  .stats-section :deep(.el-table) {
    font-size: 12px;
  }
}
</style>
