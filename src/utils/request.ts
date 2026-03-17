import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios'
import Cookies from 'js-cookie'
import { ElNotification } from 'element-plus'
import router from '@/router'
import { useMenuStore } from '@/store/menu'
import type { ApiEnvelope } from '@/types/common'
import { getDeviceId } from '@/utils/device'
import { clearAllCookies } from '@/utils/storage.ts'

type RetryableRequestConfig = InternalAxiosRequestConfig<unknown> & {
  _retry?: boolean
}

interface QueuedRequest {
  resolve: (value: unknown) => void
  reject: (reason?: unknown) => void
  config: RetryableRequestConfig
}

interface RequestError<T = unknown> extends Error {
  code?: number
  response?: unknown
  data?: ApiEnvelope<T>
}

function generateTraceId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).slice(2, 10)
  return `${timestamp}-${random}`
}

function isApiEnvelope<T = unknown>(value: unknown): value is ApiEnvelope<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.prototype.hasOwnProperty.call(value, 'code') &&
    Object.prototype.hasOwnProperty.call(value, 'msg') &&
    Object.prototype.hasOwnProperty.call(value, 'data')
  )
}

const baseURL = import.meta.env.VITE_SOME_KEY
const sseBaseURL = import.meta.env.VITE_SSE_URL || baseURL
const service = axios.create({ baseURL, timeout: 60000 })

let isRefreshing = false
let requestsQueue: QueuedRequest[] = []

let lastNotifyTime = 0
let lastNotifyMsg = ''
const NOTIFY_DEBOUNCE = 2000

function notify(message: string) {
  const now = Date.now()
  if (message === lastNotifyMsg && now - lastNotifyTime < NOTIFY_DEBOUNCE) {
    return
  }

  lastNotifyTime = now
  lastNotifyMsg = message
  ElNotification.error({ message })
}

function getPlatform(): string {
  const envPlatform = import.meta.env.VITE_PLATFORM
  if (envPlatform) {
    return envPlatform
  }

  return /(Android|iPhone|iPad|iPod|Windows Phone)/i.test(navigator.userAgent)
    ? 'app'
    : 'admin'
}

function setHeader(
  config: AxiosRequestConfig<unknown> | InternalAxiosRequestConfig<unknown>,
  name: string,
  value: string | number | boolean | null | undefined
) {
  if (value === undefined || value === null || value === '') {
    return
  }

  const headers = config.headers
  if (headers && typeof (headers as AxiosHeaders).set === 'function') {
    ;(headers as AxiosHeaders).set(name, String(value))
    return
  }

  config.headers = {
    ...(config.headers ?? {}),
    [name]: String(value),
  }
}

function processQueue(error: Error | null, token: string | null = null) {
  requestsQueue.forEach(({ resolve, reject, config }) => {
    if (error) {
      reject(error)
      return
    }

    if (token) {
      setHeader(config, 'Authorization', `Bearer ${token}`)
    }

    resolve(service(config))
  })

  requestsQueue = []
}

function logoutAndRedirect() {
  useMenuStore().reset()
  clearAllCookies()
  router.push('/login')
  processQueue(new Error('Unauthorized'))
}

function handle401(originalRequest: RetryableRequestConfig, messageFromServer?: string) {
  if (originalRequest.url?.includes('/api/Users/refresh') || originalRequest._retry) {
    isRefreshing = false
    notify(messageFromServer || '登录过期，请重新登录')
    logoutAndRedirect()
    return Promise.reject(new Error('Unauthorized'))
  }

  originalRequest._retry = true

  const pendingRequest = new Promise((resolve, reject) => {
    requestsQueue.push({ resolve, reject, config: originalRequest })
  })

  if (!isRefreshing) {
    isRefreshing = true
    const refreshToken = Cookies.get('refresh_token')

    if (!refreshToken) {
      isRefreshing = false
      notify('登录过期，请重新登录')
      logoutAndRedirect()
      return Promise.reject(new Error('No refresh token'))
    }

    axios
      .post<ApiEnvelope<{
        access_token: string
        refresh_token: string
        expires_in: number
        refresh_expires_in: number
      }>>(
        `${baseURL}/api/Users/refresh`,
        { refresh_token: refreshToken },
        {
          headers: {
            platform: getPlatform(),
            'device-id': getDeviceId(),
          },
        }
      )
      .then((refreshResponse) => {
        const payload = refreshResponse.data
        if (payload.code === 0 && payload.data) {
          const {
            access_token,
            refresh_token: newRefreshToken,
            expires_in,
            refresh_expires_in,
          } = payload.data

          const expires = new Date(Date.now() + expires_in * 1000)
          const refreshExpires = new Date(Date.now() + refresh_expires_in * 1000)

          Cookies.set('access_token', access_token, { expires })
          Cookies.set('refresh_token', newRefreshToken, { expires: refreshExpires })

          isRefreshing = false
          processQueue(null, access_token)
          return
        }

        isRefreshing = false
        notify(payload.msg || '登录过期，请重新登录')
        logoutAndRedirect()
      })
      .catch(() => {
        isRefreshing = false
        notify('网络错误，请重新登录')
        logoutAndRedirect()
      })
  }

  return pendingRequest
}

service.interceptors.request.use(
  (config) => {
    const token = Cookies.get('access_token')

    if (token) {
      setHeader(config, 'Authorization', `Bearer ${token}`)
    }

    setHeader(config, 'platform', getPlatform())
    setHeader(config, 'device-id', getDeviceId())
    setHeader(config, 'X-Trace-Id', generateTraceId())

    return config
  },
  (error) => Promise.reject(error)
)

service.interceptors.response.use(
  (response) => {
    const payload = response.data

    if (isApiEnvelope(payload)) {
      if (payload.code !== 0) {
        if (payload.code === 401) {
          return handle401(response.config as RetryableRequestConfig, payload.msg)
        }

        const message = payload.msg || '请求失败'
        notify(message)

        const requestError: RequestError = new Error(message)
        requestError.code = payload.code
        requestError.response = response
        requestError.data = payload
        return Promise.reject(requestError)
      }

      return Promise.resolve(payload.data !== undefined ? payload.data : payload)
    }

    return Promise.resolve(payload)
  },
  (error: AxiosError<ApiEnvelope<unknown>>) => {
    const response = error.response
    const status = response?.status

    if (status === 401 && error.config) {
      return handle401(error.config as RetryableRequestConfig, response?.data?.msg || '未授权')
    }

    const responseData = response?.data as { msg?: string; message?: string } | undefined
    const message = responseData?.msg || responseData?.message || error.message || '请求失败'
    notify(message)
    return Promise.reject(error)
  }
)

export function getCommonHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    platform: getPlatform(),
    'device-id': getDeviceId(),
    'X-Trace-Id': generateTraceId(),
  }

  const token = Cookies.get('access_token')
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return headers
}

export interface SSECallbacks<T = any> {
  onEvent?: (event: string, data: T) => boolean | void
  onError?: (message: string) => void
  onComplete?: () => void
}

export async function streamPost<T = any, TData = unknown>(
  url: string,
  data: TData,
  callbacks: SSECallbacks<T>
): Promise<void> {
  const fullUrl = url.startsWith('http') ? url : `${sseBaseURL}${url}`
  const controller = new AbortController()

  const response = await fetch(fullUrl, {
    method: 'POST',
    headers: getCommonHeaders(),
    body: JSON.stringify(data),
    signal: controller.signal,
  })

  if (!response.ok) {
    callbacks.onError?.(`HTTP error: ${response.status}`)
    return
  }

  const reader = response.body?.getReader()
  if (!reader) {
    callbacks.onError?.('无法读取响应流')
    return
  }

  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      let currentEvent = ''
      for (const line of lines) {
        if (line.startsWith('event:')) {
          currentEvent = line.slice(6).trim()
          continue
        }

        if (!line.startsWith('data:')) {
          continue
        }

        const dataString = line.slice(5).trim()
        try {
          const parsed = JSON.parse(dataString) as T
          const shouldStop = callbacks.onEvent?.(currentEvent, parsed)
          if (shouldStop) {
            controller.abort()
            return
          }
        } catch {
          // Ignore malformed SSE payloads.
        }
      }
    }

    callbacks.onComplete?.()
  } catch (error) {
    if (!(error instanceof DOMException) || error.name !== 'AbortError') {
      throw error
    }
  } finally {
    reader.releaseLock()
  }
}

export type RequestConfig<D = unknown> = AxiosRequestConfig<D>

const request = {
  get<T = any>(url: string, config?: RequestConfig): Promise<T> {
    return service.get<T, T>(url, config)
  },
  post<T = any, D = unknown>(url: string, data?: D, config?: RequestConfig<D>): Promise<T> {
    return service.post<T, T, D>(url, data, config)
  },
  put<T = any, D = unknown>(url: string, data?: D, config?: RequestConfig<D>): Promise<T> {
    return service.put<T, T, D>(url, data, config)
  },
  delete<T = any>(url: string, config?: RequestConfig): Promise<T> {
    return service.delete<T, T>(url, config)
  },
}

export default request
