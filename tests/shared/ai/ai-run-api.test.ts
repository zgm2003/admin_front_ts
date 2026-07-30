import { afterEach, describe, expect, it } from 'vitest'
import { AiRunApi } from '@/api/ai/runs'
import { installApiClientHarness } from '../../helpers/api-client'
import { createAiRunDashboardFixture } from '../../helpers/ai-run-dashboard'

const cleanups: Array<() => void> = []
afterEach(() => cleanups.splice(0).forEach((cleanup) => cleanup()))

describe('AI run API behavior', () => {
  it('serializes every dashboard filter into one GET request', async () => {
    const harness = installApiClientHarness(createAiRunDashboardFixture())
    cleanups.push(harness.uninstall)

    await AiRunApi.dashboard({
      date_start: '2026-07-23',
      date_end: '2026-07-29',
      platform: 'admin',
      model_id: 'gpt-5.5',
      agent_id: 2,
      provider_id: 3,
      user_id: 4,
    })

    expect(harness.requests).toHaveLength(1)
    expect(harness.requests[0]).toMatchObject({
      method: 'GET',
      path: '/api/admin/v1/ai-runs/dashboard',
      query: {
        date_start: '2026-07-23',
        date_end: '2026-07-29',
        platform: 'admin',
        model_id: 'gpt-5.5',
        agent_id: 2,
        provider_id: 3,
        user_id: 4,
      },
    })
  })

  it('decodes complete zero objects and empty dashboard arrays', async () => {
    const dashboard = createAiRunDashboardFixture()
    const harness = installApiClientHarness(dashboard)
    cleanups.push(harness.uninstall)

    await expect(AiRunApi.dashboard({})).resolves.toEqual(dashboard)
  })

  it('exposes only the unified run resource operations', () => {
    expect(Object.keys(AiRunApi).sort()).toEqual([
      'dashboard',
      'detail',
      'list',
      'pageInit',
      'setUserFeedback',
    ])
  })

  it('serializes page-init dates and every list drilldown filter', async () => {
    const harness = installApiClientHarness({
      dict: {
        status_arr: [],
        platform_arr: [],
        agentArr: [],
        providerArr: [],
        model_arr: [],
        billing_status_arr: [],
        billing_reason_arr: [],
      },
    })
    cleanups.push(harness.uninstall)
    await AiRunApi.pageInit({ date_start: '2026-07-23', date_end: '2026-07-29' })

    harness.respondWith({
      list: [],
      page: { current_page: 1, page_size: 20, total: 0, total_page: 0 },
    })
    await AiRunApi.list({
      current_page: 1,
      page_size: 20,
      platform: 'admin',
      status: 'failed',
      user_id: 4,
      request_id: 'request-7',
      agent_id: 2,
      provider_id: 3,
      model_id: 'gpt-5.5',
      billing_status: 'unbilled',
      billing_reason: 'unbilled_usage_incomplete',
      error_code: 'provider_timeout',
      tool_code: 'search_web',
      run_anomaly: 'failed',
      billing_anomaly: 'unbilled_usage_incomplete',
      user_feedback: 'liked',
      anomaly_as_of: '2026-07-29T15:42:18+08:00',
      date_start: '2026-07-23',
      date_end: '2026-07-29',
    })

    expect(harness.requests[0]?.query).toEqual({ date_start: '2026-07-23', date_end: '2026-07-29' })
    expect(harness.requests[1]?.query).toEqual({
      current_page: 1,
      page_size: 20,
      platform: 'admin',
      status: 'failed',
      user_id: 4,
      request_id: 'request-7',
      agent_id: 2,
      provider_id: 3,
      model_id: 'gpt-5.5',
      billing_status: 'unbilled',
      billing_reason: 'unbilled_usage_incomplete',
      error_code: 'provider_timeout',
      tool_code: 'search_web',
      run_anomaly: 'failed',
      billing_anomaly: 'unbilled_usage_incomplete',
      user_feedback: 'liked',
      anomaly_as_of: '2026-07-29T15:42:18+08:00',
      date_start: '2026-07-23',
      date_end: '2026-07-29',
    })
  })

  it('fails closed when page-init omits a required dictionary', async () => {
    const harness = installApiClientHarness({
      dict: {
        status_arr: [],
        platform_arr: [],
        agentArr: [],
        providerArr: [],
        billing_status_arr: [],
        billing_reason_arr: [],
      },
    })
    cleanups.push(harness.uninstall)

    await expect(AiRunApi.pageInit({})).rejects.toThrow(/http\.responseRequiredFieldMissing/)
  })

  it('fails closed when run detail omits the durable latency contract', async () => {
    const harness = installApiClientHarness({})
    cleanups.push(harness.uninstall)

    await expect(AiRunApi.detail({ id: 7 })).rejects.toThrow(/http\.responseRequiredFieldMissing/)
  })
})
