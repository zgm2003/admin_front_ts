import type { AiMessageCancelParams } from '@/api/ai/messages'
import { isApiError } from '@/modules/http/error'

export async function executeStopRequest<
  TInput extends AiMessageCancelParams,
  TOutput,
>(
  input: TInput,
  mutate: (input: TInput) => Promise<TOutput>,
): Promise<TOutput> {
  try {
    return await mutate(input)
  } catch (error) {
    if (!isApiError(error) || !error.retryable) throw error
    return mutate(input)
  }
}
