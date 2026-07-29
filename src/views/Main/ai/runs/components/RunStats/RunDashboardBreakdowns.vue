<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AiRunDashboardResponse } from '@/api/ai/runs'
import { AppTable } from '@/components/Table'
import type { TableColumn } from '@/components/Table'
import {
  formatDashboardCount,
  formatDashboardDuration,
  formatDashboardMoney,
  formatDashboardRate,
  type DashboardDrilldownTarget,
} from './dashboard-presenter'

type Breakdowns = AiRunDashboardResponse['breakdowns']
type BreakdownTab = keyof Breakdowns
type BreakdownRow = Breakdowns[BreakdownTab][number]

const props = defineProps<{
  breakdowns: Breakdowns
  loading: boolean
}>()
const emit = defineEmits<{ drilldown: [target: DashboardDrilldownTarget] }>()
const { t } = useI18n()
const activeTab = ref<BreakdownTab>('models')

const tabs = computed<Array<{ name: BreakdownTab; label: string }>>(() => [
  { name: 'models', label: t('aiRuns.dashboard.breakdowns.models') },
  { name: 'providers', label: t('aiRuns.dashboard.breakdowns.providers') },
  { name: 'agents', label: t('aiRuns.dashboard.breakdowns.agents') },
  { name: 'users', label: t('aiRuns.dashboard.breakdowns.users') },
  { name: 'errors', label: t('aiRuns.dashboard.breakdowns.errors') },
  { name: 'tools', label: t('aiRuns.dashboard.breakdowns.tools') },
])

const rows = computed<BreakdownRow[]>(() => [...props.breakdowns[activeTab.value]] as BreakdownRow[])
const rowKey = computed(() => ({
  models: 'model_id',
  providers: 'provider_id',
  agents: 'agent_id',
  users: 'user_id',
  errors: 'error_code',
  tools: 'tool_code',
})[activeTab.value])

const columns = computed<TableColumn<BreakdownRow>[]>(() => {
  if (activeTab.value === 'errors') {
    return [
      { key: 'error_code', label: t('aiRuns.dashboard.breakdowns.errorCode'), minWidth: 220 },
      {
        key: 'count',
        label: t('aiRuns.dashboard.breakdowns.count'),
        width: 120,
        formatter: (_row, _column, value) => formatDashboardCount(Number(value)),
      },
      actionColumn(),
    ]
  }
  if (activeTab.value === 'tools') {
    return [
      { key: 'tool_name', label: t('aiRuns.dashboard.breakdowns.tool'), minWidth: 180 },
      { key: 'tool_code', label: t('aiRuns.dashboard.breakdowns.toolCode'), minWidth: 180 },
      countColumn('total_calls', 'aiRuns.dashboard.breakdowns.totalCalls'),
      rateColumn(),
      {
        key: 'duration',
        label: t('aiRuns.dashboard.breakdowns.durationP95'),
        minWidth: 150,
        formatter: (row) => {
          if (!('duration' in row)) return '-'
          const duration = formatDashboardDuration(row.duration)
          return duration.kind === 'value' ? duration.text : '-'
        },
      },
      actionColumn(),
    ]
  }
  return [
    {
      key: 'name',
      label: t(`aiRuns.dashboard.breakdowns.${activeTab.value.slice(0, -1)}`),
      minWidth: 180,
      formatter: (row) => attributionName(row),
    },
    countColumn('total_runs', 'aiRuns.dashboard.breakdowns.totalRuns'),
    rateColumn(),
    countColumn('total_tokens', 'aiRuns.dashboard.breakdowns.totalTokens'),
    {
      key: 'actual_amount',
      label: t('aiRuns.dashboard.breakdowns.actualAmount'),
      minWidth: 150,
      formatter: (_row, _column, value) => formatDashboardMoney(String(value)),
    },
    countColumn('run_anomaly_count', 'aiRuns.dashboard.breakdowns.runAnomalies'),
    countColumn('billing_anomaly_count', 'aiRuns.dashboard.breakdowns.billingAnomalies'),
    actionColumn(),
  ]
})

function countColumn(key: string, labelKey: string): TableColumn<BreakdownRow> {
  return {
    key,
    label: t(labelKey),
    minWidth: 120,
    formatter: (_row, _column, value) => formatDashboardCount(Number(value)),
  }
}

function rateColumn(): TableColumn<BreakdownRow> {
  return {
    key: 'success_rate',
    label: t('aiRuns.dashboard.breakdowns.successRate'),
    minWidth: 130,
    formatter: (_row, _column, value) => formatDashboardRate(Number(value)),
  }
}

function actionColumn(): TableColumn<BreakdownRow> {
  return {
    key: 'actions',
    label: t('common.actions.action'),
    width: 110,
    fixed: 'right',
  }
}

function attributionName(row: BreakdownRow): string {
  if ('model_display_name' in row) {
    return row.historical
      ? `${row.model_display_name} (${t('aiRuns.dashboard.breakdowns.historical')})`
      : row.model_display_name
  }
  if ('provider_name' in row) return row.provider_name
  if ('agent_name' in row) return row.agent_name
  if ('username' in row) return row.username
  return '-'
}

function stableKey(row: BreakdownRow): string {
  if ('model_id' in row) return row.model_id
  if ('provider_id' in row) return String(row.provider_id)
  if ('agent_id' in row) return String(row.agent_id)
  if ('user_id' in row) return String(row.user_id)
  if ('error_code' in row) return row.error_code
  return row.tool_code
}

function drilldownTarget(row: BreakdownRow): DashboardDrilldownTarget {
  if ('model_id' in row) return { kind: 'model', model_id: row.model_id }
  if ('provider_id' in row) return { kind: 'provider', provider_id: row.provider_id }
  if ('agent_id' in row) return { kind: 'agent', agent_id: row.agent_id }
  if ('user_id' in row) return { kind: 'user', user_id: row.user_id }
  if ('error_code' in row) return { kind: 'error', error_code: row.error_code }
  return { kind: 'tool', tool_code: row.tool_code }
}
</script>

<template>
  <section class="dashboard-breakdowns">
    <div class="dashboard-section-heading">
      <h3 class="dashboard-section-title">
        {{ t('aiRuns.dashboard.breakdowns.title') }}
      </h3>
    </div>
    <el-tabs
      v-model="activeTab"
      class="dashboard-breakdown-tabs"
    >
      <el-tab-pane
        v-for="tab in tabs"
        :key="tab.name"
        :name="tab.name"
        :label="tab.label"
      />
    </el-tabs>
    <AppTable
      :columns="columns"
      :data="rows"
      :loading="loading"
      :row-key="rowKey"
      :fixed-footer="false"
      :show-refresh="false"
      :show-column-setting="false"
    >
      <template #cell-actions="{ row }">
        <el-button
          text
          type="primary"
          :data-breakdown-action="stableKey(row)"
          @click="emit('drilldown', drilldownTarget(row))"
        >
          {{ t('aiRuns.dashboard.breakdowns.viewRuns') }}
        </el-button>
      </template>
    </AppTable>
  </section>
</template>
