/* eslint-disable vue/one-component-per-file */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineComponent, h, nextTick, shallowRef } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AiRunDashboardResponse, AiRunInitResponse } from '@/api/ai/runs'
import { createApiError } from '@/modules/http/error'
import { createAiRunDashboardFixture } from '../../helpers/ai-run-dashboard'
const mocks = vi.hoisted(() => ({
  workflow: undefined as unknown as Record<string, unknown>,
  tableColumns: [] as Array<Record<string, unknown>>,
  tableData: [] as Array<Record<string, unknown>>,
}))
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string, params?: Record<string, unknown>) => params
      ? `${key}:${JSON.stringify(params)}`
      : key,
  }),
}))
vi.mock('@/app/injection', () => ({
  useAppKernel: () => ({ realtime: {} }),
}))
vi.mock('@/features/ai-runs/workflow', () => ({
  createAIRunsWorkflow: () => mocks.workflow,
}))
vi.mock('@/components/Search', async () => {
  const { defineComponent, h } = await import('vue')
  return {
    Search: defineComponent({
      name: 'SearchMock',
      props: {
        modelValue: { type: Object, default: () => ({}) },
        fields: { type: Array, default: () => [] },
      },
      emits: ['update:modelValue', 'query', 'reset'],
      setup() {
        return () => h('div', { 'data-test': 'dashboard-filters' })
      },
    }),
  }
})
vi.mock('@/components/Table', async () => {
  const { defineComponent, h } = await import('vue')
  return {
    AppTable: defineComponent({
      name: 'AppTableMock',
      props: {
        columns: { type: Array, default: () => [] },
        data: { type: Array, default: () => [] },
      },
      setup(props, { slots }) {
        return () => {
          mocks.tableColumns = [...props.columns] as Array<Record<string, unknown>>
          mocks.tableData = [...props.data] as Array<Record<string, unknown>>
          return h('div', { 'data-test': 'breakdown-table' }, props.data.flatMap((row) => (
            slots['cell-actions']?.({ row }) ?? []
          )))
        }
      },
    }),
  }
})

const { default: RunDashboardSummary } = await import(
  '@/views/Main/ai/runs/components/RunStats/RunDashboardSummary.vue'
)
const { default: RunDashboardDiagnostics } = await import(
  '@/views/Main/ai/runs/components/RunStats/RunDashboardDiagnostics.vue'
)
const { default: RunDashboardBreakdowns } = await import(
  '@/views/Main/ai/runs/components/RunStats/RunDashboardBreakdowns.vue'
)
const { default: RunDashboardFilters } = await import(
  '@/views/Main/ai/runs/components/RunStats/RunDashboardFilters.vue'
)
const { default: RunDashboardPage } = await import(
  '@/views/Main/ai/runs/components/RunStats/index.vue'
)
const ButtonStub = defineComponent({
  name: 'ElButton',
  emits: ['click'],
  setup(_props, { emit, slots, attrs }) {
    return () => h('button', { ...attrs, onClick: () => emit('click') }, slots.default?.())
  },
})
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
const ResultStub = defineComponent({
  name: 'ElResult',
  setup(_props, { slots }) {
    return () => h('div', [slots.default?.(), slots.extra?.()])
  },
})

const globalStubs = {
  ElButton: ButtonStub,
  ElTabs: TabsStub,
  ElTabPane: TabPaneStub,
  ElAlert: true, ElEmpty: true, ElResult: ResultStub,
  ElSkeleton: true, ElSkeletonItem: true, ElTag: true,
}

function populatedDashboard(): AiRunDashboardResponse {
  return createAiRunDashboardFixture({
    summary: {
      total_runs: 20,
      terminal_runs: 14,
      in_progress_runs: 6,
      success_runs: 7,
      failed_runs: 2,
      timeout_runs: 1,
      outcome_unknown_runs: 1,
      canceled_runs: 3,
      success_denominator: 11,
      success_rate: 63.64,
      prompt_tokens: 1_000,
      completion_tokens: 500,
      total_tokens: 1_500,
    },
    performance: {
      ttft: { sample_count: 20, insufficient_sample: false, p50_ms: 90, p95_ms: 180 },
      end_to_end: { sample_count: 20, insufficient_sample: false, p50_ms: 800, p95_ms: 1_600 },
    },
    billing: {
      settled_runs: 12,
      actual_amount: '12.34000000',
      released_runs: 2,
      released_amount: '1.25000000',
      unbilled_runs: 1,
    },
    anomalies: {
      run_total: 4,
      billing_total: 2,
      run_items: [{ code: 'failed', count: 2 }, { code: 'timeout', count: 1 }],
      billing_items: [{ code: 'state_inconsistent', count: 2 }],
    },
    breakdowns: {
      models: [{
        model_id: 'gpt-5.5', model_display_name: 'GPT-5.5', historical: false,
        total_runs: 20, success_runs: 7, success_denominator: 11, success_rate: 63.64,
        total_tokens: 1_500, actual_amount: '12.34000000', run_anomaly_count: 4,
        billing_anomaly_count: 2,
      }],
      providers: [{
        provider_id: 3, provider_name: 'OpenAI', total_runs: 20, success_runs: 7,
        success_denominator: 11, success_rate: 63.64, total_tokens: 1_500,
        actual_amount: '12.34000000', run_anomaly_count: 4, billing_anomaly_count: 2,
      }],
      agents: [{
        agent_id: 2, agent_name: 'Support', total_runs: 20, success_runs: 7,
        success_denominator: 11, success_rate: 63.64, total_tokens: 1_500,
        actual_amount: '12.34000000', run_anomaly_count: 4, billing_anomaly_count: 2,
      }],
      users: [{
        user_id: 4, username: 'admin', total_runs: 20, success_runs: 7,
        success_denominator: 11, success_rate: 63.64, total_tokens: 1_500,
        actual_amount: '12.34000000', run_anomaly_count: 4, billing_anomaly_count: 2,
      }],
      errors: [{ error_code: 'provider_timeout', count: 2 }],
      tools: [{
        tool_code: 'search_web', tool_name: 'Search web', total_calls: 5,
        success_calls: 3, failed_calls: 1, timeout_calls: 1,
        success_denominator: 5, success_rate: 60,
        duration: { sample_count: 5, insufficient_sample: true, p50_ms: 200, p95_ms: 500 },
      }],
    },
  })
}

const pageInit = (): AiRunInitResponse => ({
  dict: {
    status_arr: [], platform_arr: [], agentArr: [], providerArr: [], model_arr: [],
    billing_status_arr: [], billing_reason_arr: [],
  },
})

function installWorkflow(
  state: Record<string, unknown>,
  lastDashboard: AiRunDashboardResponse | null,
) {
  mocks.workflow = {
    dashboard: {
      state: shallowRef(state),
      retry: vi.fn(async () => lastDashboard ?? createAiRunDashboardFixture()),
    },
    lastDashboard: shallowRef(lastDashboard),
    loadDashboard: vi.fn(async () => lastDashboard ?? createAiRunDashboardFixture()),
    loadPageInit: vi.fn(async () => pageInit()),
    dispose: vi.fn(),
  }
  return mocks.workflow as {
    dashboard: { state: ReturnType<typeof shallowRef>; retry: ReturnType<typeof vi.fn> }
    lastDashboard: ReturnType<typeof shallowRef<AiRunDashboardResponse | null>>
    loadDashboard: ReturnType<typeof vi.fn>
    loadPageInit: ReturnType<typeof vi.fn>
    dispose: ReturnType<typeof vi.fn>
  }
}

describe('AI run dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.tableColumns = []
    mocks.tableData = []
    installWorkflow({ kind: 'idle', data: [] }, null)
  })

  it('shares dashboard styles with child markup', () => { expect('__scopeId' in RunDashboardPage).toBe(false) })

  it('renders six core metrics from one dashboard response', () => {
    const dashboard = populatedDashboard()
    const wrapper = mount(RunDashboardSummary, {
      props: {
        summary: dashboard.summary,
        performance: dashboard.performance,
        billing: dashboard.billing,
        anomalies: dashboard.anomalies,
      },
      global: { stubs: globalStubs },
    })

    expect(wrapper.findAll('[data-metric]')).toHaveLength(6)
    expect(wrapper.get('[data-metric="total-runs"]').text()).toContain('20')
    expect(wrapper.get('[data-metric="success-rate"]').text()).toContain('63.64%')
    expect(wrapper.get('[data-metric="actual-amount"]').text()).toContain('¥12.34000000')
    expect(wrapper.get('[data-metric="ttft-p95"]').text()).toContain('180 ms')
    expect(wrapper.get('[data-metric="run-anomalies"]').text()).toContain('4')
    expect(wrapper.get('[data-metric="billing-anomalies"]').text()).toContain('2')
  })

  it('shows the success numerator denominator and every run status', async () => {
    const dashboard = populatedDashboard()
    const wrapper = mount(RunDashboardSummary, {
      props: {
        summary: dashboard.summary,
        performance: dashboard.performance,
        billing: dashboard.billing,
        anomalies: dashboard.anomalies,
      },
      global: { stubs: globalStubs },
    })

    expect(wrapper.get('[data-metric="success-rate"]').text()).toContain('7 / 11')
    expect(wrapper.findAll('[data-drilldown-status]')).toHaveLength(6)
    await wrapper.get('[data-drilldown-status="success"]').trigger('click')
    expect(wrapper.emitted('drilldown')?.[0]).toEqual([{ kind: 'status', status: 'success' }])
  })

  it('keeps run anomalies and billing anomalies separate', async () => {
    const wrapper = mount(RunDashboardDiagnostics, {
      props: { anomalies: populatedDashboard().anomalies },
      global: { stubs: globalStubs },
    })

    expect(wrapper.get('[data-diagnostic-group="run"]').text()).toContain('failed')
    expect(wrapper.get('[data-diagnostic-group="billing"]').text()).toContain('state_inconsistent')
    await wrapper.get('[data-run-anomaly="failed"]').trigger('click')
    await wrapper.get('[data-billing-anomaly="state_inconsistent"]').trigger('click')
    expect(wrapper.emitted('drilldown')).toEqual([
      [{ kind: 'run_anomaly', code: 'failed' }],
      [{ kind: 'billing_anomaly', code: 'state_inconsistent' }],
    ])
  })

  it('uses one AppTable for all six breakdown tabs without alignment overrides', async () => {
    const dashboard = populatedDashboard()
    const wrapper = mount(RunDashboardBreakdowns, {
      props: { breakdowns: dashboard.breakdowns, loading: false },
      global: { stubs: globalStubs },
    })
    const tabs = wrapper.findComponent(TabsStub)

    for (const tab of ['models', 'providers', 'agents', 'users', 'errors', 'tools']) {
      tabs.vm.$emit('update:modelValue', tab)
      await nextTick()
      expect(mocks.tableData).toEqual(dashboard.breakdowns[tab as keyof typeof dashboard.breakdowns])
      for (const column of mocks.tableColumns) {
        expect(column).not.toHaveProperty('align')
        expect(column).not.toHaveProperty('headerAlign')
        expect(column).not.toHaveProperty('elementProps.align')
        expect(column).not.toHaveProperty('elementProps.headerAlign')
      }
      expect(mocks.tableColumns.find(({ key }) => key === 'actions')).toMatchObject({ width: 140, fixed: 'right' })
    }
    expect(wrapper.findAllComponents({ name: 'AppTableMock' })).toHaveLength(1)

    const css = readFileSync(resolve(
      process.cwd(),
      'src/views/Main/ai/runs/components/RunStats/styles.css',
    ), 'utf8')
    expect(css).not.toMatch(/dashboard-breakdowns[^}]+(?:text-align|justify-content)\s*:\s*center/s)
  })

  it('retains the last successful data and marks refresh failure as stale', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-29T15:42:18+08:00'))
    const dashboard = populatedDashboard()
    const error = createApiError({
      kind: 'network', code: 'http.network', retryable: true, messageKey: 'http.network',
    })
    const workflow = installWorkflow({ kind: 'error', data: [dashboard], error }, dashboard)
    const wrapper = mount(RunDashboardPage, { global: { stubs: globalStubs } })
    await flushPromises()

    expect(wrapper.get('[data-dashboard-state="stale"]').exists()).toBe(true)
    expect(wrapper.get('[data-metric="total-runs"]').text()).toContain('20')
    expect(wrapper.text()).toContain(dashboard.generated_at)

    workflow.dashboard.state.value = { kind: 'loading', data: [], requestId: 2 }
    await nextTick()
    expect(wrapper.text()).toContain('aiRuns.dashboard.states.refreshing')

    workflow.loadDashboard.mockRejectedValueOnce(error)
    wrapper.findComponent(RunDashboardFilters).vm.$emit('query', {
      date_start: '2026-07-01',
      date_end: '2026-07-07',
      model_id: 'gpt-5.6',
    })
    await flushPromises()
    await wrapper.get('[data-drilldown-status="success"]').trigger('click')
    expect(wrapper.emitted('drilldown')?.at(-1)?.[0]).toMatchObject({
      date_start: '2026-07-23',
      date_end: '2026-07-29',
      status: 'success',
    })
    wrapper.unmount()
  })

  it('shows a retryable first-load error and a truthful empty state', async () => {
    const error = createApiError({
      kind: 'network', code: 'http.network', retryable: true, messageKey: 'http.network',
    })
    const failedWorkflow = installWorkflow({ kind: 'error', data: [], error }, null)
    const failed = mount(RunDashboardPage, { global: { stubs: globalStubs } })
    await flushPromises()
    expect(failed.get('[data-dashboard-state="error"]').exists()).toBe(true)
    await failed.get('[data-action="retry"]').trigger('click')
    expect(failedWorkflow.dashboard.retry).toHaveBeenCalledTimes(1)
    failed.unmount()

    const emptyDashboard = createAiRunDashboardFixture()
    installWorkflow({ kind: 'success', data: [emptyDashboard] }, emptyDashboard)
    const empty = mount(RunDashboardPage, { global: { stubs: globalStubs } })
    await flushPromises()
    expect(empty.get('[data-dashboard-state="empty"]').exists()).toBe(true)
    expect(empty.get('[data-metric="ttft-p95"]').text()).toContain('-')
    empty.unmount()
  })

  it('emits stable drilldown targets from attribution rows', async () => {
    const wrapper = mount(RunDashboardBreakdowns, {
      props: { breakdowns: populatedDashboard().breakdowns, loading: false },
      global: { stubs: globalStubs },
    })
    await wrapper.get('[data-breakdown-action="gpt-5.5"]').trigger('click')
    expect(wrapper.emitted('drilldown')?.[0]).toEqual([{
      kind: 'model', model_id: 'gpt-5.5',
    }])
  })
})
