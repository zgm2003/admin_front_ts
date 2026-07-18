import { createApiError } from '@/modules/http/error'
import type { ApiClient } from '@/modules/http/client'
import { defineOperation, type HttpMethod, type QueryValue } from '@/modules/http/operations'

export interface RequestConfig<D = unknown> {
  readonly params?: object
  readonly data?: D
  readonly signal?: AbortSignal
  readonly idempotencyKey?: string
}

export interface RequestClient {
  get<T = unknown>(url: string, config?: RequestConfig): Promise<T>
  post<T = unknown, D = unknown>(url: string, data?: D, config?: RequestConfig<D>): Promise<T>
  put<T = unknown, D = unknown>(url: string, data?: D, config?: RequestConfig<D>): Promise<T>
  patch<T = unknown, D = unknown>(url: string, data?: D, config?: RequestConfig<D>): Promise<T>
  delete<T = unknown, D = unknown>(url: string, config?: RequestConfig<D>): Promise<T>
}

const publicAdminPaths = new Set([
  '/api/admin/v1/auth/captcha',
  '/api/admin/v1/auth/forgot-password',
  '/api/admin/v1/auth/login',
  '/api/admin/v1/auth/login-config',
  '/api/admin/v1/auth/refresh',
  '/api/admin/v1/auth/send-code',
])

let installedClient: ApiClient | null = null

export function installApiClient(client: ApiClient): () => void {
  installedClient = client
  return () => {
    if (installedClient === client) installedClient = null
  }
}

function requireClient(): ApiClient {
  if (!installedClient) {
    throw createApiError({
      kind: 'internal',
      code: 'http.client_not_installed',
      retryable: false,
      messageKey: 'http.clientNotInstalled',
    })
  }
  return installedClient
}

function queryFrom(params: object | undefined): Readonly<Record<string, QueryValue>> | undefined {
  if (!params) return undefined
  const query: Record<string, QueryValue> = {}
  for (const [name, value] of Object.entries(params)) {
    const validArray = Array.isArray(value)
      && value.every((item) => typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean')
    if (
      value === undefined
      || value === null
      || typeof value === 'string'
      || typeof value === 'number'
      || typeof value === 'boolean'
      || validArray
    ) {
      query[name] = value as QueryValue
      continue
    }
    throw createApiError({
      kind: 'contract',
      code: 'http.query_value_invalid',
      retryable: false,
      messageKey: 'http.queryValueInvalid',
      messageData: { name },
    })
  }
  return query
}

function execute<T, D>(
  method: HttpMethod,
  url: string,
  body: D | undefined,
  config: RequestConfig<D> | undefined,
): Promise<T> {
  const idempotencyKey = config?.idempotencyKey?.trim()
  const operation = defineOperation<D | undefined, T>({
    id: `compat.${method.toLowerCase()}`,
    method,
    path: url,
    auth: publicAdminPaths.has(url) ? 'public' : 'required',
    timeout: typeof FormData !== 'undefined' && body instanceof FormData ? 'upload' : 'interactive',
    replay: method === 'GET' ? 'safe' : idempotencyKey ? 'idempotency-key' : 'never',
    telemetryName: `compat.${method.toLowerCase()}`,
    encode: () => ({
      query: queryFrom(config?.params),
      body,
    }),
  })
  return requireClient().execute(operation, body, {
    signal: config?.signal,
    idempotencyKey,
  })
}

export const request: RequestClient = {
  get<T = unknown>(url: string, config?: RequestConfig): Promise<T> {
    return execute<T, unknown>('GET', url, undefined, config)
  },
  post<T = unknown, D = unknown>(url: string, data?: D, config?: RequestConfig<D>): Promise<T> {
    return execute<T, D>('POST', url, data, config)
  },
  put<T = unknown, D = unknown>(url: string, data?: D, config?: RequestConfig<D>): Promise<T> {
    return execute<T, D>('PUT', url, data, config)
  },
  patch<T = unknown, D = unknown>(url: string, data?: D, config?: RequestConfig<D>): Promise<T> {
    return execute<T, D>('PATCH', url, data, config)
  },
  delete<T = unknown, D = unknown>(url: string, config?: RequestConfig<D>): Promise<T> {
    return execute<T, D>('DELETE', url, config?.data, config)
  },
}

export default request
