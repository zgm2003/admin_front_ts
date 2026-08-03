import type { AIRuntimeParams } from '@/api/ai/messages'

export interface RuntimeParameterDraft {
  enabled: boolean
  value: number
}

export function createRuntimeParams(input: {
  temperature?: RuntimeParameterDraft
}): AIRuntimeParams {
  const result: AIRuntimeParams = {}
  if (input.temperature?.enabled) result.temperature = input.temperature.value
  return result
}
