import type { AiRunLatencyDistribution, AiRunStatus } from '@/api/ai/runs'

export function runStatusTagType(status: AiRunStatus) {
  switch (status) {
    case 'running':
      return 'warning'
    case 'success':
      return 'success'
    case 'failed':
    case 'timeout':
      return 'danger'
    case 'canceled':
      return 'info'
    default:
      return 'info'
  }
}

export function toolCallTagType(status: string) {
  switch (status) {
    case 'success':
      return 'success'
    case 'failed':
    case 'timeout':
      return 'danger'
    case 'running':
      return 'warning'
    default:
      return 'info'
  }
}

export function knowledgeRetrievalTagType(status: string) {
  switch (status) {
    case 'success':
      return 'success'
    case 'failed':
      return 'danger'
    case 'skipped':
      return 'info'
    default:
      return 'warning'
  }
}

export const knowledgeHitTagType = (status: number) => status === 1 ? 'success' : 'info'

export const formatRunTokens = (value: number) => value.toLocaleString()

export function formatRunLatency(value: number | null | undefined): string {
  return value === null || value === undefined ? '-' : `${value.toLocaleString()} ms`
}

export function formatRunLatencyPercentile(
  distribution: AiRunLatencyDistribution,
  percentile: 'p50_ms' | 'p95_ms' | 'p99_ms',
): string {
  return distribution.sample_count === 0 ? '-' : formatRunLatency(distribution[percentile])
}

export function prettyRunJson(value: unknown): string {
  if (value === null || value === undefined) return '-'
  return JSON.stringify(value, null, 2)
}
