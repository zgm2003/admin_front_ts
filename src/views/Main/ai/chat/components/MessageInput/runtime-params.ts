import type { AIRuntimeParams } from '@/api/ai/messages'

export interface RuntimeParameterDraft {
  enabled: boolean
  value: number
}

export function createRuntimeParams(input: {
  temperature?: RuntimeParameterDraft
  maxHistory?: RuntimeParameterDraft
}): AIRuntimeParams {
  const result: AIRuntimeParams = {}
  if (input.temperature?.enabled) result.temperature = input.temperature.value
  if (input.maxHistory?.enabled) result.max_history = input.maxHistory.value
  return result
}
