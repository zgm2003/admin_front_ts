import axios, {
  AxiosHeaders,
  type AxiosInstance,
  type AxiosResponseHeaders,
  type RawAxiosResponseHeaders,
} from 'axios'
import {
  HttpTransportError,
  type HttpTransport,
  type TransportRequest,
  type TransportResponse,
} from './client'

export interface AxiosTransportOptions {
  readonly baseURL: string
  readonly withCredentials?: boolean
}

function responseHeaders(
  headers: AxiosResponseHeaders | Partial<RawAxiosResponseHeaders>,
): Readonly<Record<string, string>> {
  const output: Record<string, string> = {}
  const rawHeaders = headers instanceof AxiosHeaders ? headers.toJSON() : headers
  for (const [name, value] of Object.entries(rawHeaders)) {
    if (value !== undefined && value !== null) output[name] = String(value)
  }
  return output
}

function transportError(error: unknown, request: TransportRequest): HttpTransportError {
  if (request.signal.aborted) {
    const timedOut = request.signal.reason instanceof DOMException
      && request.signal.reason.name === 'TimeoutError'
    return new HttpTransportError(timedOut ? 'timeout' : 'canceled', 'HTTP request aborted', error)
  }
  if (axios.isAxiosError(error) && (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT')) {
    return new HttpTransportError('timeout', 'HTTP request timed out', error)
  }
  if (axios.isCancel(error)) {
    return new HttpTransportError('canceled', 'HTTP request canceled', error)
  }
  return new HttpTransportError('network', 'HTTP transport failed', error)
}

class AxiosTransport implements HttpTransport {
  private readonly service: AxiosInstance
  private readonly withCredentials: boolean

  constructor(options: AxiosTransportOptions) {
    this.service = axios.create({
      baseURL: options.baseURL,
      validateStatus: () => true,
    })
    this.withCredentials = options.withCredentials ?? true
  }

  async send(request: TransportRequest): Promise<TransportResponse> {
    try {
      const response = await this.service.request<unknown>({
        url: request.path,
        method: request.method,
        params: request.query,
        data: request.body,
        headers: request.headers,
        signal: request.signal,
        timeout: request.timeoutMs,
        withCredentials: this.withCredentials,
      })
      return {
        status: response.status,
        headers: responseHeaders(response.headers),
        data: response.data,
      }
    } catch (error) {
      throw transportError(error, request)
    }
  }
}

export function createAxiosTransport(options: AxiosTransportOptions): HttpTransport {
  return new AxiosTransport(options)
}

/** Transitional bridge used only by the legacy session file removed in Task 8. */
export function legacyAxiosPost<T>(
  url: string,
  data: unknown,
  config: Readonly<Record<string, unknown>>,
): Promise<{ readonly data: T }> {
  return axios.post<T>(url, data, config)
}
