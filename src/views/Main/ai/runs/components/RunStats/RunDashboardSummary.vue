<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AiRunDashboardResponse, AiRunStatus } from '@/api/ai/runs'
import {
  formatDashboardCount,
  formatDashboardDuration,
  formatDashboardMoney,
  formatDashboardRate,
  type DashboardDrilldownTarget,
} from './dashboard-presenter'

const props = defineProps<{
  summary: AiRunDashboardResponse['summary']
  performance: AiRunDashboardResponse['performance']
  billing: AiRunDashboardResponse['billing']
  anomalies: AiRunDashboardResponse['anomalies']
}>()
const emit = defineEmits<{ drilldown: [target: DashboardDrilldownTarget] }>()
const { t } = useI18n()

const ttft = computed(() => formatDashboardDuration(props.performance.ttft))
const metrics = computed(() => [
  {
    key: 'total-runs',
    label: t('aiRuns.dashboard.summary.totalRuns'),
    value: formatDashboardCount(props.summary.total_runs),
    detail: t('aiRuns.dashboard.summary.terminalDetail', {
      terminal: formatDashboardCount(props.summary.terminal_runs),
      inProgress: formatDashboardCount(props.summary.in_progress_runs),
    }),
  },
  {
    key: 'success-rate',
    label: t('aiRuns.dashboard.summary.successRate'),
    value: formatDashboardRate(props.summary.success_rate),
    detail: `${formatDashboardCount(props.summary.success_runs)} / ${formatDashboardCount(props.summary.success_denominator)}`,
  },
  {
    key: 'actual-amount',
    label: t('aiRuns.dashboard.billing.actualAmount'),
    value: formatDashboardMoney(props.billing.actual_amount),
    detail: t('aiRuns.dashboard.billing.settledRuns', {
      count: formatDashboardCount(props.billing.settled_runs),
    }),
  },
  {
    key: 'ttft-p95',
    label: t('aiRuns.dashboard.performance.ttftP95'),
    value: ttft.value.kind === 'value' ? ttft.value.text : '-',
    detail: ttft.value.kind === 'value'
      ? t('aiRuns.dashboard.performance.sampleCount', { count: ttft.value.sampleCount })
      : t('aiRuns.dashboard.performance.insufficientSample', { count: ttft.value.sampleCount }),
  },
  {
    key: 'run-anomalies',
    label: t('aiRuns.dashboard.summary.runAnomalies'),
    value: formatDashboardCount(props.anomalies.run_total),
    detail: t('aiRuns.dashboard.summary.inspectBelow'),
  },
  {
    key: 'billing-anomalies',
    label: t('aiRuns.dashboard.summary.billingAnomalies'),
    value: formatDashboardCount(props.anomalies.billing_total),
    detail: t('aiRuns.dashboard.summary.inspectBelow'),
  },
])

const statuses = computed<Array<{ status: AiRunStatus; count: number }>>(() => [
  { status: 'running', count: props.summary.in_progress_runs },
  { status: 'success', count: props.summary.success_runs },
  { status: 'failed', count: props.summary.failed_runs },
  { status: 'canceled', count: props.summary.canceled_runs },
  { status: 'timeout', count: props.summary.timeout_runs },
  { status: 'outcome_unknown', count: props.summary.outcome_unknown_runs },
])

function statusShare(count: number): string {
  if (props.summary.total_runs === 0) return '0%'
  return formatDashboardRate((count / props.summary.total_runs) * 100)
}
</script>

<template>
  <section class="dashboard-summary">
    <div class="dashboard-metric-strip">
      <div
        v-for="metric in metrics"
        :key="metric.key"
        class="dashboard-metric"
        :data-metric="metric.key"
      >
        <span class="dashboard-metric__label">{{ metric.label }}</span>
        <strong class="dashboard-metric__value">{{ metric.value }}</strong>
        <span class="dashboard-metric__detail">{{ metric.detail }}</span>
      </div>
    </div>

    <div class="dashboard-statuses">
      <h3 class="dashboard-section-title">
        {{ t('aiRuns.dashboard.status.title') }}
      </h3>
      <div class="dashboard-status-grid">
        <button
          v-for="item in statuses"
          :key="item.status"
          type="button"
          class="dashboard-status"
          :data-drilldown-status="item.status"
          @click="emit('drilldown', { kind: 'status', status: item.status })"
        >
          <span>{{ t(`aiRuns.dashboard.status.${item.status}`) }}</span>
          <strong>{{ formatDashboardCount(item.count) }}</strong>
          <small>{{ statusShare(item.count) }}</small>
        </button>
      </div>
    </div>
  </section>
</template>
