<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { EChartsType } from 'echarts/core'
import type { AiRunDashboardResponse } from '@/api/ai/runs'
import type {
  DashboardChartLabels,
  DashboardTrendMode,
} from './dashboard-chart'

const props = defineProps<{ trend: AiRunDashboardResponse['trend'] }>()
const { t } = useI18n()
const activeMode = ref<DashboardTrendMode>('runs')
const chartElement = ref<HTMLElement | null>(null)
let chart: EChartsType | null = null
let resizeObserver: ResizeObserver | null = null
let renderSequence = 0

const labels = computed<DashboardChartLabels>(() => ({
  totalRuns: t('aiRuns.dashboard.trend.totalRuns'),
  successRuns: t('aiRuns.dashboard.trend.successRuns'),
  anomalousRuns: t('aiRuns.dashboard.trend.anomalousRuns'),
  actualAmount: t('aiRuns.dashboard.trend.actualAmount'),
  ttftP50: t('aiRuns.dashboard.trend.ttftP50'),
  ttftP95: t('aiRuns.dashboard.trend.ttftP95'),
  endToEndP50: t('aiRuns.dashboard.trend.endToEndP50'),
  endToEndP95: t('aiRuns.dashboard.trend.endToEndP95'),
  currencySymbol: '¥',
}))

async function renderChart() {
  const sequence = ++renderSequence
  await nextTick()
  if (props.trend.length === 0) {
    disposeChart()
    return
  }
  const element = chartElement.value
  if (!element) return
  const runtime = await import('./dashboard-chart')
  if (sequence !== renderSequence || !chartElement.value || props.trend.length === 0) return
  if (!chart) {
    chart = runtime.createDashboardChart(element)
    resizeObserver = new ResizeObserver(() => chart?.resize())
    resizeObserver.observe(element)
  }
  chart.setOption(runtime.buildDashboardChartOption(activeMode.value, props.trend, labels.value), true)
}

function disposeChart() {
  resizeObserver?.disconnect()
  resizeObserver = null
  chart?.dispose()
  chart = null
}

watch(
  [() => props.trend, activeMode, labels],
  () => { void renderChart() },
  { deep: true },
)
onMounted(() => { void renderChart() })
onUnmounted(() => {
  renderSequence++
  disposeChart()
})
</script>

<template>
  <section class="dashboard-trend">
    <div class="dashboard-section-heading">
      <h3 class="dashboard-section-title">
        {{ t('aiRuns.dashboard.trend.title') }}
      </h3>
    </div>
    <el-tabs
      v-model="activeMode"
      class="dashboard-trend-tabs"
    >
      <el-tab-pane
        :label="t('aiRuns.dashboard.trend.runs')"
        name="runs"
      />
      <el-tab-pane
        :label="t('aiRuns.dashboard.trend.cost')"
        name="cost"
      />
      <el-tab-pane
        :label="t('aiRuns.dashboard.trend.performance')"
        name="performance"
      />
    </el-tabs>
    <div
      v-if="trend.length"
      ref="chartElement"
      class="dashboard-trend-chart"
      role="img"
      :aria-label="t('aiRuns.dashboard.trend.chartLabel')"
    />
    <el-empty
      v-else
      :description="t('aiRuns.dashboard.trend.empty')"
    />
  </section>
</template>
