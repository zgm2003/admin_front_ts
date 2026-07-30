import { describe, expect, it } from 'vitest'
import type { AiRunDashboardParams } from '@/api/ai/runs'
import {
  buildRunListDrilldown,
  defaultDashboardDates,
  formatDashboardCount,
  formatDashboardDuration,
  formatDashboardMoney,
  formatDashboardRate,
  parseRunListQuery,
  serializeRunListQuery,
  type DashboardBillingAnomalyCode,
  type DashboardRunAnomalyCode,
} from '@/views/Main/ai/runs/components/RunStats/dashboard-presenter'

const generatedAt = '2026-07-29T15:42:18+08:00'
const baseFilters: AiRunDashboardParams = {
  date_start: '2026-07-23',
  date_end: '2026-07-29',
  platform: 'admin',
  model_id: 'gpt-5.5',
  agent_id: 11,
  provider_id: 22,
  user_id: 33,
}

describe('AI run dashboard presenter', () => {
  it('formats integer counts, decimal RMB strings, percentages and durations without estimates', () => {
    expect(formatDashboardCount(1_234_567)).toBe('1,234,567')
    expect(formatDashboardMoney('9007199254740993.12345678'))
      .toBe('¥9007199254740993.12345678')
    expect(formatDashboardRate(63.64)).toBe('63.64%')
    expect(formatDashboardDuration({
      sample_count: 20,
      insufficient_sample: false,
      p50_ms: 900,
      p95_ms: 1_800,
    })).toEqual({ kind: 'value', text: '1,800 ms', sampleCount: 20 })
    expect(() => formatDashboardMoney('1e-8')).toThrow(/decimal/i)
  })

  it('shows sample insufficiency instead of zero milliseconds', () => {
    expect(formatDashboardDuration({
      sample_count: 19,
      insufficient_sample: true,
      p50_ms: 0,
      p95_ms: 0,
    })).toEqual({ kind: 'insufficient', sampleCount: 19 })
    expect(formatDashboardDuration({
      sample_count: 0,
      insufficient_sample: false,
      p50_ms: 0,
      p95_ms: 0,
    })).toEqual({ kind: 'insufficient', sampleCount: 0 })
  })

  it('builds a seven-day Asia/Shanghai default date range', () => {
    expect(defaultDashboardDates(new Date('2026-07-29T15:42:18+08:00')))
      .toEqual(['2026-07-23', '2026-07-29'])
    expect(defaultDashboardDates(new Date('2026-07-29T16:30:00Z')))
      .toEqual(['2026-07-24', '2026-07-30'])
  })

  it('drills status and every run anomaly into exact list filters', () => {
    expect(buildRunListDrilldown(baseFilters, generatedAt, {
      kind: 'status',
      status: 'success',
    })).toEqual({ ...baseFilters, status: 'success' })

    const codes: DashboardRunAnomalyCode[] = [
      'failed',
      'timeout',
      'outcome_unknown',
      'stale_running',
    ]
    for (const code of codes) {
      expect(buildRunListDrilldown(baseFilters, generatedAt, {
        kind: 'run_anomaly',
        code,
      })).toEqual({
        ...baseFilters,
        run_anomaly: code,
        anomaly_as_of: generatedAt,
      })
    }
  })

  it('drills every billing anomaly into exact list filters', () => {
    const codes: DashboardBillingAnomalyCode[] = [
      'state_inconsistent',
      'open_overdue',
      'pricing_snapshot_missing',
      'legacy_unpriced',
      'unbilled_usage_incomplete',
      'unbilled_over_hold',
    ]
    for (const code of codes) {
      expect(buildRunListDrilldown(baseFilters, generatedAt, {
        kind: 'billing_anomaly',
        code,
      })).toEqual({
        ...baseFilters,
        billing_anomaly: code,
        anomaly_as_of: generatedAt,
      })
    }
  })

  it('preserves date platform model provider agent and user filters for every attribution row', () => {
    const targets = [
      { target: { kind: 'model', model_id: 'gpt-5.6' } as const, key: 'model_id', value: 'gpt-5.6' },
      { target: { kind: 'provider', provider_id: 44 } as const, key: 'provider_id', value: 44 },
      { target: { kind: 'agent', agent_id: 55 } as const, key: 'agent_id', value: 55 },
      { target: { kind: 'user', user_id: 66 } as const, key: 'user_id', value: 66 },
    ]

    for (const { target, key, value } of targets) {
      const params = buildRunListDrilldown(baseFilters, generatedAt, target)
      expect(params).toMatchObject({
        date_start: baseFilters.date_start,
        date_end: baseFilters.date_end,
        platform: baseFilters.platform,
      })
      expect(params[key as keyof typeof params]).toBe(value)
    }
  })

  it('uses stable ids and error or tool codes instead of display labels', () => {
    const error = buildRunListDrilldown(baseFilters, generatedAt, {
      kind: 'error',
      error_code: 'provider_timeout',
    })
    const tool = buildRunListDrilldown(baseFilters, generatedAt, {
      kind: 'tool',
      tool_code: 'search_web',
    })

    expect(error.error_code).toBe('provider_timeout')
    expect(tool.tool_code).toBe('search_web')
    expect(JSON.stringify([error, tool])).not.toContain('display_name')
  })

  it('round-trips every drilldown filter through a stable URL query', () => {
    const params = {
      ...baseFilters,
      status: 'failed' as const,
      billing_status: 'unbilled' as const,
      billing_reason: 'unbilled_usage_incomplete' as const,
      error_code: 'provider_timeout',
      tool_code: 'search_web',
      run_anomaly: 'failed' as const,
      billing_anomaly: 'unbilled_usage_incomplete' as const,
      user_feedback: 'liked' as const,
      anomaly_as_of: generatedAt,
    }
    const query = serializeRunListQuery(params)

    expect(query).toEqual({
      date_start: '2026-07-23',
      date_end: '2026-07-29',
      platform: 'admin',
      status: 'failed',
      model_id: 'gpt-5.5',
      agent_id: '11',
      provider_id: '22',
      user_id: '33',
      billing_status: 'unbilled',
      billing_reason: 'unbilled_usage_incomplete',
      error_code: 'provider_timeout',
      tool_code: 'search_web',
      run_anomaly: 'failed',
      billing_anomaly: 'unbilled_usage_incomplete',
      user_feedback: 'liked',
      anomaly_as_of: generatedAt,
    })
    expect(parseRunListQuery(query)).toEqual(params)
  })
})
