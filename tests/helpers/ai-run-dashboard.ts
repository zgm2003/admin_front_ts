import type { components } from '@/modules/http/generated/admin'

export type AiRunDashboardFixture = components['schemas']['AIRunDashboardResult']

export function createAiRunDashboardFixture(
  overrides: Partial<AiRunDashboardFixture> = {},
): AiRunDashboardFixture {
  return {
    generated_at: '2026-07-29T15:42:18+08:00',
    timezone: 'Asia/Shanghai',
    date_range: {
      start_at: '2026-07-23T00:00:00+08:00',
      end_exclusive: '2026-07-30T00:00:00+08:00',
    },
    summary: {
      total_runs: 0,
      terminal_runs: 0,
      in_progress_runs: 0,
      success_runs: 0,
      failed_runs: 0,
      timeout_runs: 0,
      outcome_unknown_runs: 0,
      canceled_runs: 0,
      success_denominator: 0,
      success_rate: 0,
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
    },
    performance: {
      ttft: { sample_count: 0, insufficient_sample: true, p50_ms: 0, p95_ms: 0 },
      end_to_end: { sample_count: 0, insufficient_sample: true, p50_ms: 0, p95_ms: 0 },
    },
    billing: {
      settled_runs: 0,
      actual_amount: '0',
      released_runs: 0,
      released_amount: '0',
      unbilled_runs: 0,
    },
    anomalies: {
      run_total: 0,
      billing_total: 0,
      run_items: [],
      billing_items: [],
    },
    trend: [],
    breakdowns: {
      models: [],
      providers: [],
      agents: [],
      users: [],
      errors: [],
      tools: [],
    },
    ...overrides,
  }
}
