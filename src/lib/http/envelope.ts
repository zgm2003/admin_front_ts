import type { ApiEnvelope } from '@/types/common'

export interface RequestError<T = unknown> extends Error {
  code?: number
  response?: unknown
  data?: ApiEnvelope<T>
}

export function isApiEnvelope<T = unknown>(value: unknown): value is ApiEnvelope<T> {
  return (
    typeof value === 'object'
    && value !== null
    && Object.prototype.hasOwnProperty.call(value, 'code')
    && Object.prototype.hasOwnProperty.call(value, 'msg')
    && Object.prototype.hasOwnProperty.call(value, 'data')
  )
}

export function createRequestError<T = unknown>(params: {
  message: string
  code?: number
  response?: unknown
  data?: ApiEnvelope<T>
}) {
  const error: RequestError<T> = new Error(params.message)
  error.code = params.code
  error.response = params.response
  error.data = params.data
  return error
}

export function requireApiMessage(value: Pick<ApiEnvelope<unknown>, 'msg'>): string {
  if (typeof value.msg !== 'string') {
    throw new Error('api envelope msg must be a non-empty string')
  }

  const message = value.msg.trim()
  if (!message) {
    throw new Error('api envelope msg must be a non-empty string')
  }

  return message
}
