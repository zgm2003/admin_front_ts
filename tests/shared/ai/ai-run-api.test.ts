import { afterEach, describe, expect, it } from 'vitest'
import { AiRunApi } from '@/api/ai/runs'
import { installApiClientHarness } from '../../helpers/api-client'

const cleanups: Array<() => void> = []
afterEach(() => cleanups.splice(0).forEach((cleanup) => cleanup()))

describe('AI run API behavior', () => {
  it('executes the documented run monitor read operations', async () => {
    const harness = installApiClientHarness({
      dict: { status_arr: [], platform_arr: [], agentArr: [], providerArr: [] },
    })
    cleanups.push(harness.uninstall)
    await AiRunApi.pageInit()

    const emptyPage = { current_page: 1, page_size: 20, total: 0, total_page: 0 }
    harness.respondWith({ list: [], page: emptyPage })
    await AiRunApi.list({ current_page: 1, page_size: 20 })
    harness.respondWith({
      id: 7,
      platform: 'admin',
      user_id: 1,
      username: 'admin',
      request_id: 'request-7',
      conversation_id: null,
      conversation_title: '',
      agent_id: 2,
      agent_name: 'Agent',
      provider_id: 3,
      provider_name: 'Provider',
      model_id: 'model',
      model_display_name: 'Model',
      input_snapshot: 'prompt',
      status: 'success',
      status_name: 'Success',
      prompt_tokens: 1,
      completion_tokens: 2,
      total_tokens: 3,
      duration_ms: 10,
      duration_text: '10ms',
      error_message: '',
      started_at: '2026-07-19T00:00:00Z',
      finished_at: '2026-07-19T00:00:01Z',
      created_at: '2026-07-19T00:00:00Z',
      updated_at: '2026-07-19T00:00:01Z',
      events: [],
      user_message: null,
      assistant_message: null,
      tool_calls: [],
      knowledge_retrievals: [],
    })
    await AiRunApi.detail({ id: 7 })
    harness.respondWith({
      date_range: { start: null, end: null },
      summary: {
        total_runs: 0,
        fail_runs: 0,
        total_prompt_tokens: 0,
        total_completion_tokens: 0,
        total_tokens: 0,
        avg_duration_ms: 0,
        success_rate: 0,
      },
    })
    await AiRunApi.stats()
    harness.respondWith({ list: [], page: emptyPage })
    const statsParams = { current_page: 1, page_size: 20 }
    await AiRunApi.statsByDate(statsParams)
    await AiRunApi.statsByAgent(statsParams)
    await AiRunApi.statsByUser(statsParams)

    expect(harness.requests.map(({ method, path }) => [method, path])).toEqual([
      ['GET', '/api/admin/v1/ai-runs/page-init'],
      ['GET', '/api/admin/v1/ai-runs'],
      ['GET', '/api/admin/v1/ai-runs/7'],
      ['GET', '/api/admin/v1/ai-runs/stats'],
      ['GET', '/api/admin/v1/ai-runs/stats/by-date'],
      ['GET', '/api/admin/v1/ai-runs/stats/by-agent'],
      ['GET', '/api/admin/v1/ai-runs/stats/by-user'],
    ])
  })

  it('fails closed when page-init omits a required dictionary', async () => {
    const harness = installApiClientHarness({
      dict: { status_arr: [], platform_arr: [], agentArr: [] },
    })
    cleanups.push(harness.uninstall)

    await expect(AiRunApi.pageInit()).rejects.toThrow(/http\.responseSchemaInvalid/)
  })
})
