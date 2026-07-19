import { AuthSessionError } from '@/modules/auth/types'
import {
  apiErrorFromEnvelope,
  createApiError,
  isApiError,
  type ApiError,
} from './error'
import {
  encodeOperationInput,
  renderOperationPath,
  type HttpMethod,
  type Operation,
  type QueryValue,
  type TimeoutClass,
} from './operations'
import { errorEnvelopeSchema, successEnvelopeSchema } from './schema'

export interface TransportRequest {
  readonly method: HttpMethod
  readonly path: string
  readonly query?: Readonly<Record<string, QueryValue>>
  readonly body?: unknown
  readonly headers: Readonly<Record<string, string>>
  readonly signal: AbortSignal
  readonly timeoutMs: number
}

export interface TransportResponse {
  readonly status: number
  readonly headers: Readonly<Record<string, string>>
  readonly data: unknown
}

export interface HttpTransport {
  send(request: TransportRequest): Promise<TransportResponse>
}

export type TransportErrorKind = 'network' | 'timeout' | 'canceled'

export class HttpTransportError extends Error {
  readonly kind: TransportErrorKind
  readonly cause?: unknown

  constructor(kind: TransportErrorKind, message: string, cause?: unknown) {
    super(message)
    this.name = 'HttpTransportError'
    this.kind = kind
    this.cause = cause
  }
}

export interface ApiClientAuth {
  withAccessToken<T>(
    operation: (accessToken: string, signal: AbortSignal) => Promise<T> | T,
    signal?: AbortSignal,
  ): Promise<T>
  refresh(signal?: AbortSignal): Promise<unknown>
}

export interface HttpTelemetryEvent {
  readonly operation: string
  readonly outcome: 'success' | 'error'
  readonly status?: number
  readonly durationMs: number
}

export interface HttpTelemetry {
  record(event: HttpTelemetryEvent): void
}

export interface ExecuteOptions {
  readonly signal?: AbortSignal
  readonly idempotencyKey?: string
  readonly requestId?: string
}

export interface ApiClientOptions {
  readonly transport: HttpTransport
  readonly auth: ApiClientAuth
  readonly timeoutMs?: Readonly<Record<TimeoutClass, number>>
  readonly requestId?: () => string
  readonly now?: () => number
  readonly telemetry?: HttpTelemetry
  readonly headers?: () => Readonly<Record<string, string>>
}

const defaultTimeouts: Readonly<Record<TimeoutClass, number>> = {
  interactive: 15_000,
  upload: 120_000,
  long: 300_000,
}

function defaultRequestId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `request-${Date.now().toString(36)}`
}

function timeoutReason() {
  return new DOMException('HTTP operation timed out', 'TimeoutError')
}

function timeoutApiError(cause: unknown = timeoutReason()): ApiError {
  return createApiError({
    kind: 'timeout',
    code: 'http.timeout',
    retryable: true,
    messageKey: 'http.timeout',
    cause,
  })
}

function linkExecutionSignal(signals: readonly AbortSignal[], timeoutMs: number) {
  const controller = new AbortController()
  const listeners = new Map<AbortSignal, () => void>()
  for (const signal of signals) {
    const abortFromCaller = () => controller.abort(signal.reason)
    listeners.set(signal, abortFromCaller)
    if (signal.aborted) {
      abortFromCaller()
      break
    }
    signal.addEventListener('abort', abortFromCaller, { once: true })
  }
  const timeout = setTimeout(() => controller.abort(timeoutReason()), timeoutMs)
  return {
    signal: controller.signal,
    dispose() {
      clearTimeout(timeout)
      for (const [signal, listener] of listeners) signal.removeEventListener('abort', listener)
    },
  }
}

function abortedError(signal: AbortSignal): ApiError {
  const timedOut = signal.reason instanceof DOMException && signal.reason.name === 'TimeoutError'
  if (timedOut) return timeoutApiError(signal.reason)
  return createApiError({
    kind: 'canceled',
    code: 'http.canceled',
    retryable: false,
    messageKey: 'http.canceled',
    cause: signal.reason,
  })
}

function mapThrownError(error: unknown, signal: AbortSignal): ApiError {
  if (isApiError(error)) return error
  if (signal.aborted) return abortedError(signal)
  if (error instanceof HttpTransportError) {
    return createApiError({
      kind: error.kind,
      code: `http.${error.kind}`,
      retryable: error.kind !== 'canceled',
      messageKey: `http.${error.kind}`,
      cause: error.cause,
    })
  }
  if (error instanceof AuthSessionError) {
    return createApiError({
      kind: 'authentication',
      code: error.code,
      retryable: error.retryable,
      messageKey: error.code,
      status: error.status,
      cause: error,
    })
  }
  return createApiError({
    kind: 'internal',
    code: 'http.internal',
    retryable: false,
    messageKey: 'http.internal',
    cause: error,
  })
}

function decodeResponse<TOutput>(
  operation: Operation<unknown, TOutput>,
  response: TransportResponse,
): TOutput {
  const success = successEnvelopeSchema.safeParse(response.data)
  if (response.status >= 200 && response.status < 300 && success.success) {
    if (!operation.responseSchema) return success.data.data as TOutput
    const parsed = operation.responseSchema.safeParse(success.data.data)
    if (parsed.success) return parsed.data
    const requiredFieldMissing = parsed.error.issues.some((issue) => {
      if (issue.code !== 'invalid_type' || issue.path.length === 0) return false
      let value: unknown = success.data.data
      for (const segment of issue.path) {
        if ((typeof value !== 'object' && typeof value !== 'function') || value === null) {
          value = undefined
          break
        }
        value = Reflect.get(value, segment)
      }
      return value === undefined
    })
    throw createApiError({
      kind: 'contract',
      code: requiredFieldMissing
        ? 'http.response_required_field_missing'
        : 'http.response_schema_invalid',
      retryable: false,
      messageKey: requiredFieldMissing
        ? 'http.responseRequiredFieldMissing'
        : 'http.responseSchemaInvalid',
      status: response.status,
      cause: parsed.error,
    })
  }

  const failure = errorEnvelopeSchema.safeParse(response.data)
  if (failure.success) {
    throw apiErrorFromEnvelope(failure.data, response.status)
  }

  throw createApiError({
    kind: 'contract',
    code: 'http.envelope_invalid',
    retryable: false,
    messageKey: 'http.envelopeInvalid',
    status: response.status,
    cause: success.error ?? failure.error,
  })
}

function canReplay<TInput, TOutput>(
  operation: Operation<TInput, TOutput>,
  idempotencyKey: string | undefined,
): boolean {
  if (operation.replay === 'safe') return true
  return operation.replay === 'idempotency-key' && Boolean(idempotencyKey)
}

export class ApiClient {
  private readonly transport: HttpTransport
  private readonly auth: ApiClientAuth
  private readonly timeoutMs: Readonly<Record<TimeoutClass, number>>
  private readonly createRequestId: () => string
  private readonly now: () => number
  private readonly telemetry?: HttpTelemetry
  private readonly commonHeaders: () => Readonly<Record<string, string>>
  private authenticatedScope = new AbortController()

  constructor(options: ApiClientOptions) {
    this.transport = options.transport
    this.auth = options.auth
    this.timeoutMs = options.timeoutMs ?? defaultTimeouts
    this.createRequestId = options.requestId ?? defaultRequestId
    this.now = options.now ?? Date.now
    this.telemetry = options.telemetry
    this.commonHeaders = options.headers ?? (() => ({}))
  }

  async execute<TInput, TOutput>(
    operation: Operation<TInput, TOutput>,
    input: TInput,
    options: ExecuteOptions = {},
  ): Promise<TOutput> {
    const startedAt = this.now()
    const totalTimeout = this.timeoutMs[operation.timeout]
    const deadline = startedAt + totalTimeout
    const linked = linkExecutionSignal([
      ...(options.signal ? [options.signal] : []),
      ...(operation.auth === 'required' ? [this.authenticatedScope.signal] : []),
    ], totalTimeout)
    const requestId = options.requestId?.trim() || this.createRequestId()
    let status: number | undefined
    let outcome: HttpTelemetryEvent['outcome'] = 'error'

    try {
      const encoded = encodeOperationInput(operation, input)
      const path = renderOperationPath(operation.path, encoded.path)
      const send = (accessToken?: string) => {
        if (linked.signal.aborted) throw abortedError(linked.signal)
        const remaining = deadline - this.now()
        if (remaining <= 0) throw timeoutApiError()
        const headers: Record<string, string> = {
          ...this.commonHeaders(),
          'X-Request-Id': requestId,
        }
        if (accessToken) headers.Authorization = `Bearer ${accessToken}`
        if (options.idempotencyKey) headers['Idempotency-Key'] = options.idempotencyKey
        return this.transport.send({
          method: operation.method,
          path,
          query: encoded.query,
          body: encoded.body,
          headers,
          signal: linked.signal,
          timeoutMs: remaining,
        })
      }
      const request = () => operation.auth === 'required'
        ? this.auth.withAccessToken((accessToken) => send(accessToken), linked.signal)
        : send()

      let response = await request()
      status = response.status
      try {
        const result = decodeResponse(operation as Operation<unknown, TOutput>, response)
        outcome = 'success'
        return result
      } catch (error) {
        if (
          !isApiError(error)
          || error.kind !== 'authentication'
          || operation.auth !== 'required'
          || !canReplay(operation, options.idempotencyKey)
        ) {
          throw error
        }
      }

      await this.auth.refresh(linked.signal)
      response = await request()
      status = response.status
      const result = decodeResponse(operation as Operation<unknown, TOutput>, response)
      outcome = 'success'
      return result
    } catch (error) {
      const mapped = mapThrownError(error, linked.signal)
      status = mapped.status ?? status
      throw mapped
    } finally {
      linked.dispose()
      this.telemetry?.record({
        operation: operation.telemetryName,
        outcome,
        status,
        durationMs: Math.max(0, this.now() - startedAt),
      })
    }
  }

  abortAuthenticatedRequests(reason: unknown = new DOMException('session ended', 'AbortError')): void {
    this.authenticatedScope.abort(reason)
    this.authenticatedScope = new AbortController()
  }
}
