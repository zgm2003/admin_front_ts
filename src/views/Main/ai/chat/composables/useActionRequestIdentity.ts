import { createAiRequestId } from '@/api/ai/request-id'
import { isApiError } from '@/modules/http/error'

const UNKNOWN_TRANSPORT_KINDS = new Set(['network', 'timeout', 'internal'])

export function createActionRequestIdentityRegistry(
  createRequestId: () => string = createAiRequestId,
) {
  const identities = new Map<string, string>()

  function acquire(fingerprint: string) {
    const existing = identities.get(fingerprint)
    if (existing) return existing
    const requestId = createRequestId()
    identities.set(fingerprint, requestId)
    return requestId
  }

  function settle(fingerprint: string, error?: unknown) {
    if (error !== undefined && isApiError(error) && UNKNOWN_TRANSPORT_KINDS.has(error.kind)) {
      return
    }
    identities.delete(fingerprint)
  }

  return { acquire, settle }
}
