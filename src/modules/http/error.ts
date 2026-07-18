import type { ErrorEnvelope } from './schema'

export type ApiErrorKind =
  | 'authentication'
  | 'authorization'
  | 'validation'
  | 'business'
  | 'rate-limit'
  | 'network'
  | 'timeout'
  | 'dependency'
  | 'contract'
  | 'canceled'
  | 'internal'

export interface ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly code?: string
  readonly retryable: boolean
  readonly messageKey: string
  readonly messageData?: Readonly<Record<string, string | number>>
  readonly requestId?: string
  readonly traceId?: string
  readonly status?: number
  readonly cause?: unknown
  toJSON(): Readonly<Record<string, unknown>>
}

export interface ApiErrorInput {
  readonly kind: ApiErrorKind
  readonly code?: string
  readonly retryable: boolean
  readonly messageKey: string
  readonly message?: string
  readonly messageData?: Readonly<Record<string, string | number>>
  readonly requestId?: string
  readonly traceId?: string
  readonly status?: number
  readonly cause?: unknown
}

class ApiErrorValue extends Error implements ApiError {
  readonly kind: ApiErrorKind
  readonly code?: string
  readonly retryable: boolean
  readonly messageKey: string
  readonly messageData?: Readonly<Record<string, string | number>>
  readonly requestId?: string
  readonly traceId?: string
  readonly status?: number
  readonly cause?: unknown

  constructor(input: ApiErrorInput) {
    super(input.message ?? input.messageKey)
    this.name = 'ApiError'
    this.kind = input.kind
    this.code = input.code
    this.retryable = input.retryable
    this.messageKey = input.messageKey
    this.messageData = input.messageData
    this.requestId = input.requestId
    this.traceId = input.traceId
    this.status = input.status
    this.cause = input.cause
  }

  toJSON(): Readonly<Record<string, unknown>> {
    return {
      name: this.name,
      kind: this.kind,
      code: this.code,
      retryable: this.retryable,
      messageKey: this.messageKey,
      messageData: this.messageData,
      requestId: this.requestId,
      traceId: this.traceId,
      status: this.status,
    }
  }
}

const backendCategoryKinds = {
  authentication: 'authentication',
  authorization: 'authorization',
  validation: 'validation',
  conflict: 'business',
  not_found: 'business',
  rate_limit: 'rate-limit',
  dependency: 'dependency',
  timeout: 'timeout',
  canceled: 'canceled',
  internal: 'internal',
} as const satisfies Readonly<Record<ErrorEnvelope['error']['category'], ApiErrorKind>>

export function createApiError(input: ApiErrorInput): ApiError {
  return new ApiErrorValue(input)
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiErrorValue
}

export function apiErrorFromEnvelope(envelope: ErrorEnvelope, status?: number): ApiError {
  return createApiError({
    kind: backendCategoryKinds[envelope.error.category],
    code: envelope.error.code,
    retryable: envelope.error.retryable,
    messageKey: envelope.error.code,
    message: envelope.msg,
    requestId: envelope.error.request_id,
    traceId: envelope.error.trace_id,
    status,
  })
}
