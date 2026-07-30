import type { AiRunInitResponse, AiRunStatus } from '@/api/ai/runs'

type RunDictionaryOption = AiRunInitResponse['dict']['billing_status_arr'][number]

export function runDictionaryLabel(
  options: readonly RunDictionaryOption[],
  value: string,
): string {
  return options.find((option) => option.value === value)?.label ?? value
}

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

export function prettyRunJson(value: unknown): string {
  if (value === null || value === undefined) return '-'
  return JSON.stringify(value, null, 2)
}
