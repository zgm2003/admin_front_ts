import type {
  AiRunBillingReason,
  AiRunBillingStatus,
  AiRunStatus,
  AiRunUsageItem,
} from '@/api/ai/runs'

export interface AiRunsDetailDialogLayout {
  height: string
}

export function resolveAiRunsDetailDialogLayout(isMobile: boolean): AiRunsDetailDialogLayout {
  if (isMobile) {
    return {
      height: '72vh',
    }
  }

  return {
    height: '76vh',
  }
}

export const formatRunAmount = (value: string) => `¥${value}`

export function runBillingStatusTagType(status: AiRunBillingStatus) {
  switch (status) {
    case 'settled':
      return 'success'
    case 'held':
    case 'pending':
      return 'warning'
    case 'unbilled':
      return 'danger'
    case 'released':
    default:
      return 'info'
  }
}

export function runBillingSummary(facts: {
  status: AiRunStatus
  billing_status: AiRunBillingStatus
  billing_reason: AiRunBillingReason
  held_amount: string
  actual_amount: string
}) {
  return {
    runStatus: facts.status,
    billingStatus: facts.billing_status,
    billingReason: facts.billing_reason,
    heldAmount: facts.held_amount,
    actualAmount: facts.actual_amount,
  }
}

export type AiRunUsageGroupCategory = 'input' | 'output' | 'cache' | 'media'

export interface AiRunUsageGroup {
  category: AiRunUsageGroupCategory
  items: AiRunUsageItem[]
}

export function groupRunUsageItems(items: AiRunUsageItem[]): AiRunUsageGroup[] {
  const categories: AiRunUsageGroupCategory[] = ['input', 'output', 'cache', 'media']
  return categories
    .map((category) => ({
      category,
      items: items.filter((item) => category === 'cache'
        ? item.category === 'cache_read' || item.category === 'cache_write'
        : item.category === category),
    }))
    .filter((group) => group.items.length > 0)
}
