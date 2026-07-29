import type { AiToolItem } from '@/api/ai/tools'

type ToolEligibility = Pick<AiToolItem, 'status' | 'risk_level'>

export function selectableAgentTools<T extends ToolEligibility>(tools: readonly T[]): T[] {
  return tools.filter((tool) => tool.status === 1 && tool.risk_level === 'low')
}
