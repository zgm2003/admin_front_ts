/* eslint-disable vue/one-component-per-file */
import { h, reactive } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AiRunInitResponse, AiRunListParams } from '@/api/ai/runs'

const mocks = vi.hoisted(() => ({
  route: undefined as unknown as { query: Record<string, unknown> },
  replace: vi.fn(),
  listExecute: vi.fn(),
  loadPageInit: vi.fn(),
  dispose: vi.fn(),
  searchFields: [] as Array<{ key: string }>,
  searchModel: {} as Record<string, unknown>,
  tableColumns: [] as Array<{ key: string }>,
}))

vi.mock('vue-router', () => ({
  useRoute: () => mocks.route,
  useRouter: () => ({ replace: mocks.replace }),
}))
vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))
vi.mock('element-plus', () => ({
  ElNotification: { error: vi.fn() },
}))
vi.mock('@/app/injection', () => ({
  useAppKernel: () => ({ realtime: {} }),
}))
vi.mock('@/components/Search', async () => {
  const { defineComponent } = await import('vue')
  return {
    Search: defineComponent({
      name: 'SearchMock',
      props: {
        modelValue: { type: Object, required: true },
        fields: { type: Array, required: true },
      },
      setup(props) {
        return () => {
          mocks.searchFields = [...props.fields] as Array<{ key: string }>
          mocks.searchModel = { ...props.modelValue }
          return h('div', { 'data-test': 'search' })
        }
      },
    }),
  }
})
vi.mock('@/components/Table', async () => {
  const { defineComponent } = await import('vue')
  return {
    AppTable: defineComponent({
      name: 'AppTableMock',
      props: { columns: { type: Array, required: true } },
      setup(props) {
        return () => {
          mocks.tableColumns = [...props.columns] as Array<{ key: string }>
          return h('div', { 'data-test': 'table' })
        }
      },
    }),
  }
})
vi.mock('@/features/ai-runs/workflow', async () => {
  const { shallowRef } = await import('vue')
  return {
    createAIRunsWorkflow: () => ({
      page: shallowRef({ current_page: 1, page_size: 20, total: 0, total_page: 0 }),
      list: {
        state: shallowRef({ kind: 'idle', data: [] }),
        execute: mocks.listExecute,
        refresh: vi.fn(),
        retry: vi.fn(),
        reset: vi.fn(),
        dispose: vi.fn(),
      },
      loadPageInit: mocks.loadPageInit,
      loadDetail: vi.fn(),
      dispose: mocks.dispose,
    }),
  }
})

const { default: RunList } = await import('@/views/Main/ai/runs/components/RunList/index.vue')

const pageInit = (): AiRunInitResponse => ({
  dict: {
    status_arr: [],
    platform_arr: [],
    agentArr: [],
    providerArr: [],
    model_arr: [{ value: 'gpt-5.5', label: 'GPT-5.5', historical: false }],
    billing_status_arr: [{ value: 'unbilled', label: 'Unbilled' }],
    billing_reason_arr: [{ value: 'unbilled_usage_incomplete', label: 'Incomplete' }],
  },
})

describe('AI run list drilldown filters', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.searchFields = []
    mocks.searchModel = {}
    mocks.tableColumns = []
    mocks.route = reactive({
      query: {
        tab: 'list',
        date_start: '2026-07-23',
        date_end: '2026-07-29',
        platform: 'admin',
        status: 'failed',
        model_id: 'gpt-5.5',
        agent_id: '2',
        provider_id: '3',
        user_id: '4',
        billing_status: 'unbilled',
        billing_reason: 'unbilled_usage_incomplete',
        error_code: 'provider_timeout',
        tool_code: 'search_web',
        run_anomaly: 'failed',
        anomaly_as_of: '2026-07-29T15:42:18+08:00',
      },
    })
    mocks.loadPageInit.mockResolvedValue(pageInit())
    mocks.listExecute.mockResolvedValue({
      list: [],
      page: { current_page: 1, page_size: 20, total: 0, total_page: 0 },
    })
    mocks.replace.mockResolvedValue(undefined)
  })

  it('restores all URL filters and performs exactly one initial list request', async () => {
    const wrapper = mount(RunList, {
      global: {
        stubs: {
          RunDetailDialog: true,
          ElText: true,
          ElButton: true,
          ElTag: true,
        },
      },
    })
    await flushPromises()

    const expectedFilters: AiRunListParams = {
      date_start: '2026-07-23',
      date_end: '2026-07-29',
      platform: 'admin',
      status: 'failed',
      model_id: 'gpt-5.5',
      agent_id: 2,
      provider_id: 3,
      user_id: 4,
      billing_status: 'unbilled',
      billing_reason: 'unbilled_usage_incomplete',
      error_code: 'provider_timeout',
      tool_code: 'search_web',
      run_anomaly: 'failed',
      anomaly_as_of: '2026-07-29T15:42:18+08:00',
    }
    const expectedSearchFilters = Object.fromEntries(
      Object.entries(expectedFilters).filter(([key]) => key !== 'date_start' && key !== 'date_end'),
    )
    expect(mocks.searchModel).toMatchObject({
      ...expectedSearchFilters,
      dateRange: ['2026-07-23', '2026-07-29'],
    })
    expect(mocks.listExecute).toHaveBeenCalledTimes(1)
    expect(mocks.listExecute).toHaveBeenCalledWith({
      ...expectedFilters,
      current_page: 1,
      page_size: 20,
    })
    expect(mocks.loadPageInit).toHaveBeenCalledWith({
      date_start: '2026-07-23',
      date_end: '2026-07-29',
    })
    wrapper.unmount()
  })

  it('exposes the new contract filters and billing facts without alignment overrides', async () => {
    const wrapper = mount(RunList, {
      global: {
        stubs: {
          RunDetailDialog: true,
          ElText: true,
          ElButton: true,
          ElTag: true,
        },
      },
    })
    await flushPromises()

    expect(mocks.searchFields.map(({ key }) => key)).toEqual(expect.arrayContaining([
      'model_id',
      'billing_status',
      'billing_reason',
      'error_code',
      'tool_code',
    ]))
    expect(mocks.tableColumns.map(({ key }) => key)).toEqual(expect.arrayContaining([
      'billing_status',
      'billing_reason',
      'error_code',
    ]))
    for (const column of mocks.tableColumns) {
      expect(column).not.toHaveProperty('align')
      expect(column).not.toHaveProperty('headerAlign')
      expect(column).not.toHaveProperty('elementProps.align')
      expect(column).not.toHaveProperty('elementProps.headerAlign')
    }
    wrapper.unmount()
  })
})
