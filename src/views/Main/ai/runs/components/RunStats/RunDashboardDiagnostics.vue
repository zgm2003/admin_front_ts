<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { AiRunDashboardResponse } from '@/api/ai/runs'
import {
  formatDashboardCount,
  type DashboardBillingAnomalyCode,
  type DashboardDrilldownTarget,
  type DashboardRunAnomalyCode,
} from './dashboard-presenter'

defineProps<{ anomalies: AiRunDashboardResponse['anomalies'] }>()
const emit = defineEmits<{ drilldown: [target: DashboardDrilldownTarget] }>()
const { t } = useI18n()

const runCodes = new Set<string>(['failed', 'timeout', 'outcome_unknown', 'stale_running'])
const billingCodes = new Set<string>([
  'state_inconsistent',
  'open_overdue',
  'pricing_snapshot_missing',
  'legacy_unpriced',
  'unbilled_usage_incomplete',
  'unbilled_over_hold',
])

function emitRunAnomaly(code: string) {
  if (!runCodes.has(code)) return
  emit('drilldown', { kind: 'run_anomaly', code: code as DashboardRunAnomalyCode })
}

function emitBillingAnomaly(code: string) {
  if (!billingCodes.has(code)) return
  emit('drilldown', { kind: 'billing_anomaly', code: code as DashboardBillingAnomalyCode })
}
</script>

<template>
  <section class="dashboard-diagnostics">
    <div
      class="dashboard-diagnostic-group"
      data-diagnostic-group="run"
    >
      <div class="dashboard-section-heading">
        <h3 class="dashboard-section-title">
          {{ t('aiRuns.dashboard.runAnomalies.title') }}
        </h3>
        <span>{{ formatDashboardCount(anomalies.run_total) }}</span>
      </div>
      <div
        v-if="anomalies.run_items.length"
        class="dashboard-diagnostic-list"
      >
        <button
          v-for="item in anomalies.run_items"
          :key="item.code"
          type="button"
          class="dashboard-diagnostic-row"
          :disabled="!runCodes.has(item.code)"
          :data-run-anomaly="item.code"
          @click="emitRunAnomaly(item.code)"
        >
          <span>{{ t(`aiRuns.dashboard.runAnomalies.${item.code}`) }}</span>
          <strong>{{ formatDashboardCount(item.count) }}</strong>
        </button>
      </div>
      <p
        v-else
        class="dashboard-none"
      >
        {{ t('aiRuns.dashboard.states.noRunAnomalies') }}
      </p>
    </div>

    <div
      class="dashboard-diagnostic-group"
      data-diagnostic-group="billing"
    >
      <div class="dashboard-section-heading">
        <h3 class="dashboard-section-title">
          {{ t('aiRuns.dashboard.billingAnomalies.title') }}
        </h3>
        <span>{{ formatDashboardCount(anomalies.billing_total) }}</span>
      </div>
      <div
        v-if="anomalies.billing_items.length"
        class="dashboard-diagnostic-list"
      >
        <button
          v-for="item in anomalies.billing_items"
          :key="item.code"
          type="button"
          class="dashboard-diagnostic-row"
          :disabled="!billingCodes.has(item.code)"
          :data-billing-anomaly="item.code"
          @click="emitBillingAnomaly(item.code)"
        >
          <span>{{ t(`aiRuns.dashboard.billingAnomalies.${item.code}`) }}</span>
          <strong>{{ formatDashboardCount(item.count) }}</strong>
        </button>
      </div>
      <p
        v-else
        class="dashboard-none"
      >
        {{ t('aiRuns.dashboard.states.noBillingAnomalies') }}
      </p>
    </div>
  </section>
</template>
