/* eslint-disable vue/one-component-per-file */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AiRunDashboardResponse } from '@/api/ai/runs'

const mocks = vi.hoisted(() => ({
  registered: [] as Array<{ kind: string }>,
  init: vi.fn(),
  setOption: vi.fn(),
  resize: vi.fn(),
  dispose: vi.fn(),
  observe: vi.fn(),
  disconnect: vi.fn(),
  resizeCallback: undefined as ResizeObserverCallback | undefined,
}))

vi.mock('echarts/core', () => ({
  use: (modules: Array<{ kind: string }>) => { mocks.registered = modules },
  init: (...args: unknown[]) => {
    mocks.init(...args)
    return {
      setOption: mocks.setOption,
      resize: mocks.resize,
      dispose: mocks.dispose,
    }
  },
}))
vi.mock('echarts/charts', () => ({
  LineChart: { kind: 'line' },
  BarChart: { kind: 'bar' },
}))
vi.mock('echarts/components', () => ({
  GridComponent: { kind: 'grid' },
  TooltipComponent: { kind: 'tooltip' },
  LegendComponent: { kind: 'legend' },
}))
vi.mock('echarts/renderers', () => ({
  CanvasRenderer: { kind: 'canvas' },
}))
vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

const {
  buildDashboardChartOption,
} = await import('@/views/Main/ai/runs/components/RunStats/dashboard-chart')
const { default: RunDashboardTrend } = await import(
  '@/views/Main/ai/runs/components/RunStats/RunDashboardTrend.vue'
)

const TabsStub = defineComponent({
  name: 'ElTabs',
  props: { modelValue: { type: String, default: '' } },
  emits: ['update:modelValue'],
  setup(_props, { slots }) {
    return () => h('div', slots.default?.())
  },
})
const TabPaneStub = defineComponent({
  name: 'ElTabPane',
  setup(_props, { slots }) {
    return () => h('section', slots.default?.())
  },
})

const labels = {
  totalRuns: 'Total runs',
  successRuns: 'Success runs',
  anomalousRuns: 'Anomalous runs',
  actualAmount: 'Actual amount',
  ttftP50: 'TTFT P50',
  ttftP95: 'TTFT P95',
  endToEndP50: 'End-to-end P50',
  endToEndP95: 'End-to-end P95',
  currencySymbol: '¥',
}

function trend(): AiRunDashboardResponse['trend'] {
  return [{
    date: '2026-07-28', total_runs: 10, in_progress_runs: 1, success_runs: 6,
    failed_runs: 1, canceled_runs: 1, timeout_runs: 1, outcome_unknown_runs: 0,
    success_denominator: 8, success_rate: 75, actual_amount: '1.25000000',
    ttft: { sample_count: 20, insufficient_sample: false, p50_ms: 80, p95_ms: 160 },
    end_to_end: { sample_count: 20, insufficient_sample: false, p50_ms: 700, p95_ms: 1_400 },
  }, {
    date: '2026-07-29', total_runs: 4, in_progress_runs: 1, success_runs: 1,
    failed_runs: 1, canceled_runs: 0, timeout_runs: 0, outcome_unknown_runs: 1,
    success_denominator: 3, success_rate: 33.33, actual_amount: '0.00000001',
    ttft: { sample_count: 3, insufficient_sample: true, p50_ms: 0, p95_ms: 0 },
    end_to_end: { sample_count: 3, insufficient_sample: true, p50_ms: 0, p95_ms: 0 },
  }]
}

describe('AI run dashboard trend', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.resizeCallback = undefined
    vi.stubGlobal('ResizeObserver', class {
      constructor(callback: ResizeObserverCallback) {
        mocks.resizeCallback = callback
      }
      observe = mocks.observe
      disconnect = mocks.disconnect
      unobserve() {}
    })
  })

  it('switches run cost and performance trend options without refetching', async () => {
    const data = trend()
    const runOption = buildDashboardChartOption('runs', data, labels)
    const costOption = buildDashboardChartOption('cost', data, labels)
    const performanceOption = buildDashboardChartOption('performance', data, labels)

    expect(runOption.series).toHaveLength(3)
    expect(costOption.series).toHaveLength(1)
    expect(performanceOption.series).toHaveLength(4)
    expect(JSON.stringify(costOption.series)).toContain('1.25000000')
    expect(JSON.stringify(performanceOption.series)).toContain('null')

    const wrapper = mount(RunDashboardTrend, {
      props: { trend: data },
      global: { stubs: { ElTabs: TabsStub, ElTabPane: TabPaneStub, ElEmpty: true } },
    })
    await nextTick()
    const callsBeforeSwitch = mocks.setOption.mock.calls.length
    wrapper.findComponent(TabsStub).vm.$emit('update:modelValue', 'cost')
    await nextTick()
    wrapper.findComponent(TabsStub).vm.$emit('update:modelValue', 'performance')
    await nextTick()

    expect(mocks.setOption.mock.calls.length).toBe(callsBeforeSwitch + 2)
    expect(mocks.setOption.mock.calls.at(-1)?.[1]).toBe(true)
    expect(wrapper.emitted()).toEqual({})
    wrapper.unmount()
  })

  it('loads only line bar grid tooltip legend and canvas modules', () => {
    expect(mocks.registered.map(({ kind }) => kind)).toEqual([
      'line', 'bar', 'grid', 'tooltip', 'legend', 'canvas',
    ])
    const source = readFileSync(resolve(
      process.cwd(),
      'src/views/Main/ai/runs/components/RunStats/dashboard-chart.ts',
    ), 'utf8')
    expect(source).not.toMatch(/from ['"]echarts['"]/)
    expect(source).not.toMatch(/import\s+\*\s+as\s+echarts/)
  })

  it('resizes from ResizeObserver and disposes the chart on unmount', async () => {
    const wrapper = mount(RunDashboardTrend, {
      props: { trend: trend() },
      global: { stubs: { ElTabs: TabsStub, ElTabPane: TabPaneStub, ElEmpty: true } },
    })
    await nextTick()

    expect(mocks.init).toHaveBeenCalledTimes(1)
    expect(mocks.observe).toHaveBeenCalledTimes(1)
    mocks.resizeCallback?.([], {} as ResizeObserver)
    expect(mocks.resize).toHaveBeenCalledTimes(1)
    wrapper.unmount()
    expect(mocks.disconnect).toHaveBeenCalledTimes(1)
    expect(mocks.dispose).toHaveBeenCalledTimes(1)
  })

  it('does not initialize a chart for an empty trend', async () => {
    const wrapper = mount(RunDashboardTrend, {
      props: { trend: [] },
      global: { stubs: { ElTabs: TabsStub, ElTabPane: TabPaneStub, ElEmpty: true } },
    })
    await nextTick()
    expect(mocks.init).not.toHaveBeenCalled()
    expect(mocks.observe).not.toHaveBeenCalled()
    wrapper.unmount()
  })
})
