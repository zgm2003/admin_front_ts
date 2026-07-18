import { describe, expect, it } from 'vitest'
import {
  apiErrorFromEnvelope,
  createApiError,
  isApiError,
} from '@/modules/http/error'
import {
  authCredentialSchema,
  errorEnvelopeSchema,
  exportMutationResultSchema,
} from '@/modules/http/schema'

describe('ApiError', () => {
  it.each([
    ['authentication', 'authentication'],
    ['authorization', 'authorization'],
    ['validation', 'validation'],
    ['conflict', 'business'],
    ['not_found', 'business'],
    ['rate_limit', 'rate-limit'],
    ['dependency', 'dependency'],
    ['timeout', 'timeout'],
    ['canceled', 'canceled'],
    ['internal', 'internal'],
  ] as const)('maps backend category %s to the closed kind %s', (category, kind) => {
    const error = apiErrorFromEnvelope({
      code: 100,
      data: {},
      msg: 'request failed',
      error: {
        category,
        code: `backend.${category}`,
        retryable: category === 'dependency',
        request_id: 'request-7',
        trace_id: 'trace-9',
      },
    }, 409)

    expect(error).toMatchObject({
      name: 'ApiError',
      kind,
      code: `backend.${category}`,
      retryable: category === 'dependency',
      messageKey: `backend.${category}`,
      requestId: 'request-7',
      traceId: 'trace-9',
      status: 409,
    })
    expect(isApiError(error)).toBe(true)
  })

  it('retains a local cause without serializing it', () => {
    const cause = new Error('transport secret')
    const error = createApiError({
      kind: 'network',
      retryable: true,
      messageKey: 'http.network',
      cause,
    })

    expect(error.cause).toBe(cause)
    expect(JSON.stringify(error)).not.toContain('transport secret')
    expect(JSON.parse(JSON.stringify(error))).toEqual({
      name: 'ApiError',
      kind: 'network',
      retryable: true,
      messageKey: 'http.network',
    })
  })
})

describe('critical Admin boundary schemas', () => {
  it('accepts only the documented closed error envelope', () => {
    const valid = {
      code: 401,
      data: {},
      msg: 'Unauthorized',
      error: {
        category: 'authentication',
        code: 'auth.unauthenticated',
        retryable: false,
      },
    }

    expect(errorEnvelopeSchema.safeParse(valid).success).toBe(true)
    expect(errorEnvelopeSchema.safeParse({ ...valid, guessed: true }).success).toBe(false)
    expect(errorEnvelopeSchema.safeParse({ ...valid, error: { ...valid.error, alias: 'x' } }).success).toBe(false)
  })

  it('keeps browser and desktop credential fields explicit', () => {
    expect(authCredentialSchema.safeParse({ access_token: 'a', expires_in: 60 }).success).toBe(true)
    expect(authCredentialSchema.safeParse({
      access_token: 'a',
      expires_in: 60,
      refresh_token: 'r',
      refresh_expires_in: 3600,
    }).success).toBe(true)
    expect(authCredentialSchema.safeParse({ token: 'guessed', expires_in: 60 }).success).toBe(false)
  })

  it('fails closed when an export mutation result misses its documented task id', () => {
    expect(exportMutationResultSchema.safeParse({ id: 91, message: 'queued' }).success).toBe(true)
    expect(exportMutationResultSchema.safeParse({ message: 'queued' }).success).toBe(false)
  })
})
