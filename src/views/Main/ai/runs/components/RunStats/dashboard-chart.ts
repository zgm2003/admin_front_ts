import {
  init,
  use,
  type ComposeOption,
  type EChartsType,
} from 'echarts/core'
import {
  BarChart,
  LineChart,
  type BarSeriesOption,
  type LineSeriesOption,
} from 'echarts/charts'
import {
  GridComponent,
  LegendComponent,
  TooltipComponent,
  type GridComponentOption,
  type LegendComponentOption,
  type TooltipComponentOption,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { AiRunDashboardResponse } from '@/api/ai/runs'

use([
  LineChart,
  BarChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  CanvasRenderer,
])

export type DashboardTrendMode = 'runs' | 'cost' | 'performance'
export interface DashboardChartLabels {
  totalRuns: string
  successRuns: string
  anomalousRuns: string
  actualAmount: string
  ttftP50: string
  ttftP95: string
  endToEndP50: string
  endToEndP95: string
  currencySymbol: string
}

type DashboardChartOption = ComposeOption<
  | LineSeriesOption
  | BarSeriesOption
  | GridComponentOption
  | TooltipComponentOption
  | LegendComponentOption
>
type Trend = AiRunDashboardResponse['trend']

export function createDashboardChart(element: HTMLElement): EChartsType {
  return init(element, undefined, { renderer: 'canvas' })
}

export function buildDashboardChartOption(
  mode: DashboardTrendMode,
  trend: Trend,
  labels: DashboardChartLabels,
): DashboardChartOption {
  const base: DashboardChartOption = {
    animationDuration: 240,
    grid: { top: 48, right: 20, bottom: 32, left: 56, containLabel: true },
    legend: { top: 8, type: 'scroll' },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      boundaryGap: mode === 'cost',
      data: trend.map(({ date }) => date),
      axisTick: { alignWithLabel: true },
    },
    yAxis: { type: 'value', minInterval: mode === 'runs' ? 1 : undefined },
  }

  if (mode === 'runs') {
    return {
      ...base,
      series: [
        {
          name: labels.totalRuns,
          type: 'bar',
          barMaxWidth: 34,
          data: trend.map(({ total_runs }) => total_runs),
        },
        {
          name: labels.successRuns,
          type: 'line',
          smooth: true,
          symbolSize: 6,
          data: trend.map(({ success_runs }) => success_runs),
        },
        {
          name: labels.anomalousRuns,
          type: 'line',
          smooth: true,
          symbolSize: 6,
          data: trend.map((item) => (
            item.failed_runs + item.timeout_runs + item.outcome_unknown_runs
          )),
        },
      ],
    }
  }

  if (mode === 'cost') {
    const amountData = trend.map(({ actual_amount }) => ({
      value: finiteCoordinate(actual_amount),
      rawAmount: actual_amount,
    }))
    return {
      ...base,
      tooltip: {
        trigger: 'axis',
        formatter: (rawParams: unknown) => costTooltip(rawParams, trend, labels),
      },
      series: [{
        name: labels.actualAmount,
        type: 'bar',
        barMaxWidth: 38,
        data: amountData,
      }],
    }
  }

  return {
    ...base,
    series: [
      performanceSeries(labels.ttftP50, trend, 'ttft', 'p50_ms'),
      performanceSeries(labels.ttftP95, trend, 'ttft', 'p95_ms'),
      performanceSeries(labels.endToEndP50, trend, 'end_to_end', 'p50_ms'),
      performanceSeries(labels.endToEndP95, trend, 'end_to_end', 'p95_ms'),
    ],
  }
}

function performanceSeries(
  name: string,
  trend: Trend,
  metric: 'ttft' | 'end_to_end',
  percentile: 'p50_ms' | 'p95_ms',
): LineSeriesOption {
  return {
    name,
    type: 'line',
    smooth: true,
    connectNulls: false,
    symbolSize: 5,
    data: trend.map((item) => {
      const value = item[metric]
      return value.sample_count === 0 || value.insufficient_sample
        ? null
        : value[percentile]
    }),
  }
}

function finiteCoordinate(value: string): number | null {
  const coordinate = Number(value)
  return Number.isFinite(coordinate) ? coordinate : null
}

function costTooltip(
  rawParams: unknown,
  trend: Trend,
  labels: DashboardChartLabels,
): string {
  const first = Array.isArray(rawParams) ? rawParams[0] : rawParams
  if (!first || typeof first !== 'object') return ''
  const dataIndex = Reflect.get(first, 'dataIndex')
  if (typeof dataIndex !== 'number' || !trend[dataIndex]) return ''
  const item = trend[dataIndex]
  return `${item.date}<br/>${labels.actualAmount}: ${labels.currencySymbol}${item.actual_amount}`
}
