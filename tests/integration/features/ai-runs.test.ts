import { describe, expect, it, vi } from 'vitest'
import type {
  AiRunDashboardParams,
  AiRunDashboardResponse,
  AiRunDetailResponse,
  AiRunItem,
  AiRunListResponse,
} from '@/api/ai/runs'
import {
  createAIRunsWorkflow,
  type AIRunsWorkflowApi,
} from '@/features/ai-runs/workflow'
import {
  groupRunUsageItems,
  runBillingSummary,
} from '@/views/Main/ai/runs/components/RunList/detail-dialog'
import { parseRunInputSnapshot } from '@/views/Main/ai/runs/components/RunList/input-snapshot'
import { createAiRunDashboardFixture } from '../../helpers/ai-run-dashboard'
import { deferred, eventBase, FakeFeatureRealtime, page } from './support'
import {
  parseRunListQuery,
  serializeRunListQuery,
} from '@/views/Main/ai/runs/components/RunStats/dashboard-presenter'

const run = (id: number): AiRunItem => ({
  id,
  request_id: `request-${id}`,
  user_id: 1,
  agent_id: 2,
  agent_name: 'Agent',
  provider_id: 3,
  provider_name: 'Provider',
  platform: 'admin',
  input_snapshot: '',
  conversation_id: null,
  conversation_title: '',
  status: 'success',
  status_name: 'Success',
  model_id: 'model',
  model_display_name: 'Model',
  billing_status: 'unbilled',
  billing_reason: 'legacy_unpriced',
  error_code: '',
  prompt_tokens: 1,
  completion_tokens: 1,
  total_tokens: 2,
  duration_ms: 1,
  duration_text: '1ms',
  error_message: '',
  created_at: '2026-07-19 00:00:00',
})

const detail = (id: number): AiRunDetailResponse => ({
  ...run(id),
  username: 'admin',
  user_message: null,
  assistant_message: null,
  events: [],
  knowledge_retrievals: [],
  tool_calls: [],
  billing_status: 'unbilled',
  billing_reason: 'legacy_unpriced',
  held_amount: '0',
  actual_amount: '0',
  pricing: null,
  usage_items: [],
  provider_attempts: [],
  liked: false,
  liked_at: null,
  started_at: '2026-07-19 00:00:00',
  finished_at: '2026-07-19 00:00:01',
  updated_at: '2026-07-19 00:00:01',
})

describe('AI runs workflow', () => {
  it('keeps billing and usage readable when an input snapshot falls back to raw text', () => {
    const malformedSnapshot = '{"content":"keep the whole object","meta_json":"{bad json"}'
    const runDetail: AiRunDetailResponse = {
      ...detail(3),
      input_snapshot: malformedSnapshot,
      billing_status: 'settled',
      billing_reason: 'settled_complete_usage',
      held_amount: '0.02',
      actual_amount: '0.01',
      usage_items: [{
        amount: '0.01',
        attempt_no: 1,
        billable: true,
        category: 'input',
        quantity: 120,
        tier_key: 'default',
        unit: 'token',
        unit_price: '0.01',
        unit_scale: 1000,
      }],
    }

    expect(parseRunInputSnapshot(runDetail.input_snapshot)).toEqual({
      kind: 'raw',
      text: malformedSnapshot,
    })
    expect(runBillingSummary(runDetail)).toEqual({
      runStatus: 'success',
      billingStatus: 'settled',
      billingReason: 'settled_complete_usage',
      heldAmount: '0.02',
      actualAmount: '0.01',
    })
    expect(groupRunUsageItems(runDetail.usage_items)).toEqual([{
      category: 'input',
      items: runDetail.usage_items,
    }])
  })

  it('keeps the latest detail and preserves list data on failed refresh', async () => {
    const detailA = deferred<AiRunDetailResponse>()
    const detailB = deferred<AiRunDetailResponse>()
    const list = vi.fn()
      .mockResolvedValueOnce({ list: [run(1)], page: page() } satisfies AiRunListResponse)
      .mockRejectedValueOnce(new Error('refresh failed'))
    const api: AIRunsWorkflowApi = {
      pageInit: vi.fn(async () => ({
        dict: {
          status_arr: [], platform_arr: [], agentArr: [], providerArr: [], model_arr: [],
          billing_status_arr: [], billing_reason_arr: [],
        },
      })),
      list,
      detail: vi.fn()
        .mockImplementationOnce(() => detailA.promise)
        .mockImplementationOnce(() => detailB.promise),
      dashboard: vi.fn(async () => createAiRunDashboardFixture()),
    }
    const workflow = createAIRunsWorkflow({ api })
    await workflow.list.execute({ current_page: 1, page_size: 20 })
    await expect(workflow.list.refresh()).rejects.toMatchObject({ kind: 'internal' })
    expect(workflow.list.state.value).toMatchObject({ kind: 'error', data: [run(1)] })

    const first = workflow.loadDetail(1)
    const second = workflow.loadDetail(2)
    detailB.resolve(detail(2))
    await second
    detailA.resolve(detail(1))
    await first
    expect(workflow.detail.state.value).toEqual({ kind: 'success', data: [detail(2)] })
    workflow.dispose()
  })

  it('keeps the last successful dashboard visible while a new query is loading or fails', async () => {
    const firstDashboard = createAiRunDashboardFixture({
      summary: { ...createAiRunDashboardFixture().summary, total_runs: 7 },
    })
    const nextDashboard = deferred<AiRunDashboardResponse>()
    const dashboard = vi.fn()
      .mockResolvedValueOnce(firstDashboard)
      .mockImplementationOnce(() => nextDashboard.promise)
    const workflow = createAIRunsWorkflow({ api: workflowApi({ dashboard }) })

    await workflow.loadDashboard({ date_start: '2026-07-23', date_end: '2026-07-29' })
    const pending = workflow.loadDashboard({ date_start: '2026-07-16', date_end: '2026-07-22' })
    expect(workflow.lastDashboard.value).toEqual(firstDashboard)
    nextDashboard.reject(new Error('dashboard failed'))
    await expect(pending).rejects.toMatchObject({ kind: 'internal' })
    expect(workflow.lastDashboard.value).toEqual(firstDashboard)
    workflow.dispose()
  })

  it('aborts a superseded dashboard query and commits only the latest response', async () => {
    const first = deferred<AiRunDashboardResponse>()
    const second = deferred<AiRunDashboardResponse>()
    const signals: AbortSignal[] = []
    const dashboard = vi.fn((_params: AiRunDashboardParams, options: { signal?: AbortSignal }) => {
      signals.push(options.signal!)
      return signals.length === 1 ? first.promise : second.promise
    })
    const workflow = createAIRunsWorkflow({ api: workflowApi({ dashboard }) })

    const firstRequest = workflow.loadDashboard({ date_start: '2026-07-23', date_end: '2026-07-29' })
    const secondRequest = workflow.loadDashboard({ date_start: '2026-07-22', date_end: '2026-07-28' })
    expect(signals[0]?.aborted).toBe(true)
    const latest = createAiRunDashboardFixture({ generated_at: '2026-07-29T16:00:00+08:00' })
    second.resolve(latest)
    await secondRequest
    first.resolve(createAiRunDashboardFixture({ generated_at: '2026-07-29T15:00:00+08:00' }))
    await firstRequest

    expect(workflow.lastDashboard.value).toEqual(latest)
    workflow.dispose()
  })

  it('debounces terminal realtime events for current ranges and ignores historical ranges', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-29T12:00:00+08:00'))
    try {
      const realtime = new FakeFeatureRealtime()
      const dashboard = vi.fn(async () => createAiRunDashboardFixture())
      const workflow = createAIRunsWorkflow({ api: workflowApi({ dashboard }), realtime })
      await workflow.loadDashboard({ date_start: '2026-07-23', date_end: '2026-07-29' })

      for (let sequence = 1; sequence <= 3; sequence++) {
        await realtime.emit({
          ...eventBase,
          event_id: `01J0000000000000000000000${sequence}`,
          type: 'ai.response.completed.v1',
          sequence,
          durability: 'durable',
          data: { conversation_id: 7, request_id: `request-${sequence}`, assistant_message_id: sequence },
        })
      }
      await vi.advanceTimersByTimeAsync(249)
      expect(dashboard).toHaveBeenCalledTimes(1)
      await vi.advanceTimersByTimeAsync(1)
      expect(dashboard).toHaveBeenCalledTimes(2)

      await workflow.loadDashboard({ date_start: '2026-07-22', date_end: '2026-07-28' })
      await realtime.emit({
        ...eventBase,
        event_id: '01J00000000000000000000004',
        type: 'ai.response.completed.v1',
        sequence: 4,
        durability: 'durable',
        data: { conversation_id: 7, request_id: 'request-4', assistant_message_id: 4 },
      })
      await vi.advanceTimersByTimeAsync(250)
      expect(dashboard).toHaveBeenCalledTimes(3)
      workflow.dispose()
    }
    finally {
      vi.useRealTimers()
    }
  })

  it('caches page-init by date pair and reloads only when the pair changes', async () => {
    const pageInit = vi.fn(async () => workflowPageInit())
    const workflow = createAIRunsWorkflow({ api: workflowApi({ pageInit }) })
    await workflow.loadPageInit({ date_start: '2026-07-23', date_end: '2026-07-29' })
    await workflow.loadPageInit({ date_start: '2026-07-23', date_end: '2026-07-29' })
    await workflow.loadPageInit({ date_start: '2026-07-16', date_end: '2026-07-22' })
    expect(pageInit).toHaveBeenCalledTimes(2)
    workflow.dispose()
  })

  it('restores a dashboard drilldown URL into exactly one list request', async () => {
    const list = vi.fn(async () => ({ list: [], page: page(1, 0) }))
    const workflow = createAIRunsWorkflow({ api: workflowApi({ list }) })
    const query = serializeRunListQuery({
      date_start: '2026-07-23',
      date_end: '2026-07-29',
      platform: 'admin',
      model_id: 'gpt-5.5',
      agent_id: 2,
      provider_id: 3,
      user_id: 4,
      billing_anomaly: 'state_inconsistent',
      anomaly_as_of: '2026-07-29T15:42:18+08:00',
    })

    await workflow.list.execute({
      ...parseRunListQuery(query),
      current_page: 1,
      page_size: 20,
    })

    expect(list).toHaveBeenCalledTimes(1)
    expect(list).toHaveBeenCalledWith({
      date_start: '2026-07-23',
      date_end: '2026-07-29',
      platform: 'admin',
      model_id: 'gpt-5.5',
      agent_id: 2,
      provider_id: 3,
      user_id: 4,
      billing_anomaly: 'state_inconsistent',
      anomaly_as_of: '2026-07-29T15:42:18+08:00',
      current_page: 1,
      page_size: 20,
    }, expect.objectContaining({ signal: expect.any(AbortSignal) }))
    workflow.dispose()
  })
})

function workflowPageInit() {
  return {
    dict: {
      status_arr: [], platform_arr: [], agentArr: [], providerArr: [], model_arr: [],
      billing_status_arr: [], billing_reason_arr: [],
    },
  }
}

function workflowApi(overrides: Partial<AIRunsWorkflowApi> = {}): AIRunsWorkflowApi {
  return {
    pageInit: vi.fn(async () => workflowPageInit()),
    list: vi.fn(async () => ({ list: [], page: page(1, 0) })),
    detail: vi.fn(async ({ id }) => detail(Number(id))),
    dashboard: vi.fn(async () => createAiRunDashboardFixture()),
    ...overrides,
  }
}
