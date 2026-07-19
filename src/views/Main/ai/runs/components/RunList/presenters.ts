import type { AiRunStatus } from '@/api/ai/runs'

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

export function prettyRunJson(value: unknown): string {
  if (value === null || value === undefined) return '-'
  return JSON.stringify(value, null, 2)
}
