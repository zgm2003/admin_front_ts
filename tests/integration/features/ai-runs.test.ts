import { describe, expect, it, vi } from 'vitest'
import type {
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
import { deferred, page } from './support'

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
        dict: { status_arr: [], platform_arr: [], agentArr: [], providerArr: [] },
      })),
      list,
      detail: vi.fn()
        .mockImplementationOnce(() => detailA.promise)
        .mockImplementationOnce(() => detailB.promise),
      stats: vi.fn(async () => ({
        date_range: { start: null, end: null },
        summary: {
          total_runs: 0,
          success_rate: 0,
          fail_runs: 0,
          total_tokens: 0,
          total_prompt_tokens: 0,
          total_completion_tokens: 0,
          avg_duration_ms: 0,
        },
      })),
      statsByDate: vi.fn(async () => ({ list: [], page: page(1, 0) })),
      statsByAgent: vi.fn(async () => ({ list: [], page: page(1, 0) })),
      statsByUser: vi.fn(async () => ({ list: [], page: page(1, 0) })),
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
})
