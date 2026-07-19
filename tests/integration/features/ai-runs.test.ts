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
  started_at: '2026-07-19 00:00:00',
  finished_at: '2026-07-19 00:00:01',
  updated_at: '2026-07-19 00:00:01',
})

describe('AI runs workflow', () => {
  it('keeps the latest detail and preserves list data on failed refresh', async () => {
    const detailA = deferred<AiRunDetailResponse>()
    const detailB = deferred<AiRunDetailResponse>()
    const list = vi.fn()
      .mockResolvedValueOnce({ list: [run(1)], page: page() } satisfies AiRunListResponse)
      .mockRejectedValueOnce(new Error('refresh failed'))
    const api: AIRunsWorkflowApi = {
      list,
      detail: vi.fn()
        .mockImplementationOnce(() => detailA.promise)
        .mockImplementationOnce(() => detailB.promise),
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
