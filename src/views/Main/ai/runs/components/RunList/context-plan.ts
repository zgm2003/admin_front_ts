import type { AiRunContextPlan } from '@/api/ai/runs'

export function contextOutcomeTagType(outcome: AiRunContextPlan['retrieval_outcome']) {
  switch (outcome) {
    case 'hit': return 'success'
    case 'failed': return 'danger'
    case 'no_hit': return 'warning'
    case 'skipped': return 'info'
  }
}

export function contextDecisionTagType(decision: AiRunContextPlan['items'][number]['decision']) {
  return decision === 'selected' ? 'success' : 'info'
}

export function contextScore(value: string | null) {
  return value === null ? '-' : Number(value).toFixed(6)
}
