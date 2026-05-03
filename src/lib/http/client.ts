import axios, { type AxiosError, type AxiosInstance, type AxiosRequestConfig } from 'axios'
import { ElNotification } from 'element-plus'
import { createDebouncedNotifier } from './notifier'
import { applyCommonHeaders } from './headers'
import { createAuthSessionManager } from './auth-session'
import { createRequestError, isApiEnvelope } from './envelope'

function requiredEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`${name} is required`)
  }

  return value
}

const legacyBaseURL = requiredEnv('VITE_SOME_KEY', import.meta.env.VITE_SOME_KEY)
const apiBaseURL = requiredEnv('VITE_GO_API_BASE_URL', import.meta.env.VITE_GO_API_BASE_URL)

const notify = createDebouncedNotifier({
  notify(message) {
    ElNotification.error({ message })
  },
})

export type RequestConfig<D = unknown> = AxiosRequestConfig<D>

interface RequestClient {
  get<T = unknown>(url: string, config?: RequestConfig): Promise<T>
  post<T = unknown, D = unknown>(url: string, data?: D, config?: RequestConfig<D>): Promise<T>
  put<T = unknown, D = unknown>(url: string, data?: D, config?: RequestConfig<D>): Promise<T>
  patch<T = unknown, D = unknown>(url: string, data?: D, config?: RequestConfig<D>): Promise<T>
  delete<T = unknown, D = unknown>(url: string, config?: RequestConfig<D>): Promise<T>
}

function createHttpClient(params: {
  baseURL: string
  refreshBaseURL: string
}): {
  service: AxiosInstance
  request: RequestClient
} {
  const service = axios.create({ baseURL: params.baseURL, timeout: 60000 })

  const authSession = createAuthSessionManager({
    baseURL: params.refreshBaseURL,
    service,
    notify,
  })

  service.interceptors.request.use(
    (config) => applyCommonHeaders(config),
    (error) => Promise.reject(error)
  )

  service.interceptors.response.use(
    (response) => {
      const payload = response.data

      if (isApiEnvelope(payload)) {
        if (payload.code !== 0) {
          if (payload.code === 401) {
            return authSession.handle401(response.config, payload.msg)
          }

          const message = payload.msg || '请求失败'
          notify(message)
          return Promise.reject(createRequestError({
            message,
            code: payload.code,
            response,
            data: payload,
          }))
        }

        return payload.data
      }

      return payload
    },
    (error: AxiosError) => {
      const response = error.response
      const status = response?.status

      if (status === 401 && error.config) {
        return authSession.handle401(error.config, extractServerMessage(response?.data) || '未授权')
      }

      const message = extractServerMessage(response?.data) || error.message || '请求失败'
      notify(message)
      return Promise.reject(error)
    }
  )

  const request: RequestClient = {
    get<T = unknown>(url: string, config?: RequestConfig): Promise<T> {
      return service.get<T, T>(url, config)
    },
    post<T = unknown, D = unknown>(url: string, data?: D, config?: RequestConfig<D>): Promise<T> {
      return service.post<T, T, D>(url, data, config)
    },
    put<T = unknown, D = unknown>(url: string, data?: D, config?: RequestConfig<D>): Promise<T> {
      return service.put<T, T, D>(url, data, config)
    },
    patch<T = unknown, D = unknown>(url: string, data?: D, config?: RequestConfig<D>): Promise<T> {
      return service.patch<T, T, D>(url, data, config)
    },
    delete<T = unknown, D = unknown>(url: string, config?: RequestConfig<D>): Promise<T> {
      return service.delete<T, T, D>(url, config)
    },
  }

  return { service, request }
}

function extractServerMessage(data: unknown): string | undefined {
  if (typeof data !== 'object' || data === null || !('msg' in data)) {
    return undefined
  }

  const msg = data.msg
  return typeof msg === 'string' ? msg : undefined
}

const legacyClient = createHttpClient({
  baseURL: legacyBaseURL,
  refreshBaseURL: legacyBaseURL,
})
const apiClient = createHttpClient({
  baseURL: apiBaseURL,
  refreshBaseURL: legacyBaseURL,
})

const request = apiClient.request
const service = apiClient.service
const legacyRequest = legacyClient.request
const legacyService = legacyClient.service

export { request, service, legacyRequest, legacyService }
