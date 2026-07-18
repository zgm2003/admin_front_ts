import type { z } from 'zod'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
export type TimeoutClass = 'interactive' | 'upload' | 'long'
export type ReplayPolicy = 'safe' | 'idempotency-key' | 'never'
export type QueryPrimitive = string | number | boolean
export type QueryValue = QueryPrimitive | readonly QueryPrimitive[] | null | undefined

export interface EncodedOperationInput {
  readonly path?: Readonly<Record<string, string | number>>
  readonly query?: Readonly<Record<string, QueryValue>>
  readonly body?: unknown
}

export interface Operation<TInput, TOutput> {
  readonly id: string
  readonly method: HttpMethod
  readonly path: string
  readonly auth: 'public' | 'required'
  readonly timeout: TimeoutClass
  readonly replay: ReplayPolicy
  readonly responseSchema?: z.ZodType<TOutput>
  readonly telemetryName: string
  readonly encode?: (input: TInput) => EncodedOperationInput
}

export function defineOperation<TInput, TOutput>(
  operation: Operation<TInput, TOutput>,
): Readonly<Operation<TInput, TOutput>> {
  if (!operation.id.trim() || !operation.telemetryName.trim()) {
    throw new Error('HTTP operation id and telemetryName are required')
  }
  if (!operation.path.startsWith('/') || operation.path.includes('?') || operation.path.includes('#')) {
    throw new Error(`HTTP operation ${operation.id} must declare an absolute path without query or fragment`)
  }
  if (operation.replay === 'safe' && operation.method !== 'GET') {
    throw new Error(`HTTP operation ${operation.id} may use safe replay only with GET`)
  }
  if (operation.replay === 'idempotency-key' && operation.method === 'GET') {
    throw new Error(`HTTP operation ${operation.id} must not require an idempotency key for GET`)
  }
  return Object.freeze(operation)
}

export function encodeOperationInput<TInput, TOutput>(
  operation: Operation<TInput, TOutput>,
  input: TInput,
): EncodedOperationInput {
  return operation.encode?.(input) ?? {}
}

export function renderOperationPath(
  template: string,
  values: Readonly<Record<string, string | number>> = {},
): string {
  const consumed = new Set<string>()
  const rendered = template.replace(/\{([^{}]+)\}/g, (_match, key: string) => {
    const value = values[key]
    if (value === undefined || value === '') {
      throw new Error(`missing path parameter: ${key}`)
    }
    consumed.add(key)
    return encodeURIComponent(String(value))
  })
  const extra = Object.keys(values).filter((key) => !consumed.has(key))
  if (extra.length > 0) {
    throw new Error(`unused path parameter: ${extra.join(',')}`)
  }
  return rendered
}
