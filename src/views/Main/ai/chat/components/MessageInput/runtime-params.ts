import type { AIRuntimeParams } from '@/api/ai/messages'

export function createRuntimeParams(
  temperature: number | null,
  maxTokens: number | null,
  maxHistory: number | null,
): AIRuntimeParams {
  const result: AIRuntimeParams = {}
  if (temperature !== null) result.temperature = temperature
  if (maxTokens !== null) result.max_tokens = maxTokens
  if (maxHistory !== null) result.max_history = maxHistory
  return result
}
