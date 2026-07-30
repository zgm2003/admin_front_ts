/* eslint-disable vue/one-component-per-file */
import { defineComponent, h, nextTick, reactive } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AiRunDetailResponse, AiRunInitResponse, AiRunListParams } from '@/api/ai/runs'
import { createApiError } from '@/modules/http/error'

const mocks = vi.hoisted(() => ({
  route: undefined as unknown as { query: Record<string, unknown> },
  replace: vi.fn(),
  listExecute: vi.fn(),
  loadPageInit: vi.fn(),
  loadDetail: vi.fn(),
  notifyError: vi.fn(),
  dispose: vi.fn(),
  searchFields: [] as Array<{ key: string; options?: unknown }>,
  searchModel: {} as Record<string, unknown>,
  tableColumns: [] as Array<{ key: string }>,
  actionRows: [] as Array<{ id: number }>,
}))

vi.mock('vue-router', () => ({
  useRoute: () => mocks.route,
  useRouter: () => ({ replace: mocks.replace }),
}))
vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))
vi.mock('element-plus', () => ({
  ElNotification: { error: mocks.notifyError },
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
      emits: ['query', 'reset'],
      setup(props) {
        return () => {
          mocks.searchFields = [...props.fields] as Array<{ key: string; options?: unknown }>
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
      setup(props, { slots }) {
        return () => {
          mocks.tableColumns = [...props.columns] as Array<{ key: string }>
          return h('div', { 'data-test': 'table' }, mocks.actionRows.map((row) => (
            h('div', { 'data-test': `run-action-${row.id}` }, slots['cell-actions']?.({ row }))
          )))
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
      loadDetail: mocks.loadDetail,
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
    mocks.actionRows = []
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
        user_feedback: 'liked',
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
      user_feedback: 'liked',
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

  it('does not notify when page initialization is canceled during navigation', async () => {
    mocks.loadPageInit.mockRejectedValueOnce(createApiError({
      kind: 'canceled',
      code: 'http.canceled',
      retryable: false,
      messageKey: 'http.canceled',
    }))
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

    expect(mocks.notifyError).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('notifies when the initial run list request fails', async () => {
    mocks.listExecute.mockRejectedValueOnce(new Error('查询AI运行记录失败'))
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

    expect(mocks.notifyError).toHaveBeenCalledWith({ message: '查询AI运行记录失败' })
    wrapper.unmount()
  })

  it('does not continue querying after URL navigation unmounts the current list', async () => {
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
    let finishNavigation!: () => void
    mocks.replace.mockReturnValueOnce(new Promise<void>((resolve) => { finishNavigation = resolve }))

    wrapper.findComponent({ name: 'SearchMock' }).vm.$emit('query')
    await nextTick()
    wrapper.unmount()
    finishNavigation()
    await flushPromises()

    expect(mocks.loadPageInit).toHaveBeenCalledTimes(1)
    expect(mocks.listExecute).toHaveBeenCalledTimes(1)
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
      'user_feedback',
    ]))
    expect(mocks.tableColumns.map(({ key }) => key)).toEqual(expect.arrayContaining([
      'billing_status',
      'billing_reason',
      'error_code',
      'liked',
    ]))
    expect(mocks.searchFields.find(({ key }) => key === 'user_feedback')?.options).toEqual([
      { label: 'aiRuns.feedback.liked', value: 'liked' },
      { label: 'aiRuns.feedback.unliked', value: 'unliked' },
    ])
    for (const column of mocks.tableColumns) {
      expect(column).not.toHaveProperty('align')
      expect(column).not.toHaveProperty('headerAlign')
      expect(column).not.toHaveProperty('elementProps.align')
      expect(column).not.toHaveProperty('elementProps.headerAlign')
    }
    wrapper.unmount()
  })

  it('clears stale detail and closes the dialog when a new detail request fails', async () => {
    let rejectSecondRequest!: (reason: unknown) => void
    mocks.actionRows = [{ id: 5 }, { id: 6 }]
    mocks.loadDetail
      .mockResolvedValueOnce({ id: 5 } as AiRunDetailResponse)
      .mockReturnValueOnce(new Promise<AiRunDetailResponse>((_resolve, reject) => {
        rejectSecondRequest = reject
      }))

    const DetailDialogStub = defineComponent({
      name: 'RunDetailDialog',
      props: {
        modelValue: { type: Boolean, required: true },
        detailData: { type: Object, default: null },
        loading: { type: Boolean, required: true },
      },
      setup(props) {
        return () => h('div', {
          'data-test': 'detail-dialog',
          'data-detail-id': String((props.detailData as AiRunDetailResponse | null)?.id ?? ''),
          'data-visible': String(props.modelValue),
        })
      },
    })
    const ButtonStub = defineComponent({
      name: 'ElButton',
      emits: ['click'],
      setup(_props, { emit, slots }) {
        return () => h('button', { onClick: () => emit('click') }, slots.default?.())
      },
    })
    const wrapper = mount(RunList, {
      global: {
        stubs: {
          RunDetailDialog: DetailDialogStub,
          ElText: true,
          ElButton: ButtonStub,
          ElTag: true,
        },
      },
    })
    await flushPromises()

    await wrapper.get('[data-test="run-action-5"] button').trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-test="detail-dialog"]').attributes('data-detail-id')).toBe('5')

    await wrapper.get('[data-test="run-action-6"] button').trigger('click')
    await nextTick()
    expect(wrapper.get('[data-test="detail-dialog"]').attributes('data-detail-id')).toBe('')

    rejectSecondRequest(new Error('AI运行详情无效'))
    await flushPromises()
    expect(wrapper.get('[data-test="detail-dialog"]').attributes('data-visible')).toBe('false')
    expect(mocks.notifyError).toHaveBeenCalledWith({ message: 'AI运行详情无效' })
    wrapper.unmount()
  })
})
