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
      billing_status: 'unbilled',
      billing_reason: 'legacy_unpriced',
      held_amount: '0',
      actual_amount: '0',
      pricing: null,
      usage_items: [],
      provider_attempts: [],
      latency: {
        accept_ms: 10,
        queue_ms: 20,
        prepare_ms: 30,
        ttft_ms: 40,
        provider_total_ms: 100,
        settlement_ms: 5,
        end_to_end_ms: 165,
        claim_source: 'wake',
      },
      request_summary: {
        provider_attempt_count: 1,
        tool_call_count: 0,
        prepared_request_bytes: 491,
        message_count: 2,
      },
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
      liked: false,
      liked_at: null,
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
    harness.respondWith({
      window_days: 30,
      max_samples: 10000,
      list: [{
        provider_id: 3,
        provider_name: 'Provider',
        model_id: 'model',
        ttft: { sample_count: 20, insufficient_sample: false, p50_ms: 90, p95_ms: 180, p99_ms: 220 },
        provider_total: { sample_count: 20, insufficient_sample: false, p50_ms: 900, p95_ms: 1800, p99_ms: 2200 },
      }],
    })
    const latencyStats = await AiRunApi.latencyStats()
    expect(latencyStats.list[0]?.ttft.p95_ms).toBe(180)
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
      ['GET', '/api/admin/v1/ai-runs/stats/latency'],
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

    await expect(AiRunApi.pageInit()).rejects.toThrow(/http\.responseRequiredFieldMissing/)
  })

  it('fails closed when run detail omits the durable latency contract', async () => {
    const harness = installApiClientHarness({})
    cleanups.push(harness.uninstall)

    await expect(AiRunApi.detail({ id: 7 })).rejects.toThrow(/http\.responseRequiredFieldMissing/)
  })
})
