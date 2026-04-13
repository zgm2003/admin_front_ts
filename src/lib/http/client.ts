import axios, { type AxiosError, type AxiosRequestConfig } from 'axios'
import { ElNotification } from 'element-plus'
import { createDebouncedNotifier } from './notifier'
import { applyCommonHeaders } from './headers'
import { createAuthSessionManager } from './auth-session'
import { createRequestError, isApiEnvelope } from './envelope'

const baseURL = import.meta.env.VITE_SOME_KEY
const service = axios.create({ baseURL, timeout: 60000 })

const notify = createDebouncedNotifier({
  notify(message) {
    ElNotification.error({ message })
  },
})

const authSession = createAuthSessionManager({
  baseURL,
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

      return payload.data !== undefined ? payload.data : payload
    }

    return payload
  },
  (error: AxiosError) => {
    const response = error.response
    const status = response?.status

    if (status === 401 && error.config) {
      return authSession.handle401(error.config, (response?.data as { msg?: string } | undefined)?.msg || '未授权')
    }

    const responseData = response?.data as { msg?: string; message?: string } | undefined
    const message = responseData?.msg || responseData?.message || error.message || '请求失败'
    notify(message)
    return Promise.reject(error)
  }
)

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

export { request, service }
