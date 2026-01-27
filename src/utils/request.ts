import axios, { AxiosHeaders } from 'axios'
import Cookies from 'js-cookie'
import router from '@/router'
import { ElNotification } from 'element-plus'
import { clearAllCookies } from '@/utils/cookie'
import { getDeviceId } from '@/utils/device'
import { useMenuStore } from '@/store/menu'

// 生成唯一的 trace_id
function generateTraceId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 10)
  return `${timestamp}-${random}`
}

const baseURL = import.meta.env.VITE_SOME_KEY
const sseBaseURL = import.meta.env.VITE_SSE_URL || baseURL
const service = axios.create({ baseURL, timeout: 60000 })

let isRefreshing = false
let requestsQueue: { resolve: Function; reject: Function; config: any }[] = []

// 防止重复弹框（所有错误通用）
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

function getPlatform() {
  const envPlat = import.meta.env.VITE_PLATFORM
  if (envPlat) return envPlat
  return /(Android|iPhone|iPad|iPod|Windows Phone)/i.test(navigator.userAgent) ? 'app' : 'admin'
}

function setHeader(config: any, name: string, value: any) {
  if (value === undefined || value === null || value === '') return
  const h: any = config.headers
  if (h && typeof h.set === 'function') (h as AxiosHeaders).set(name, value)
  else config.headers = { ...(config.headers as any || {}), [name]: value }
}

function processQueue(error: Error | null, token: string | null = null) {
  requestsQueue.forEach(({ resolve, reject, config }) => {
    if (error) return reject(error)
    if (token) setHeader(config, 'Authorization', `Bearer ${token}`)
    resolve(service(config))
  })
  requestsQueue = []
}

function logoutAndRedirect() {
  useMenuStore().reset()
  clearAllCookies()
  router.push('/login')
  // 队列里的请求静默失败，不再弹框（已经弹过了）
  processQueue(new Error('Unauthorized'))
}

/** 统一处理 401：业务 code=401 或 HTTP 401 都走这里 */
function handle401(originalRequest: any, messageFromServer?: string) {
  if (originalRequest?.url?.includes('/api/Users/refresh') || originalRequest?._retry) {
    isRefreshing = false
    notify(messageFromServer || '登录过期，请重新登录')
    logoutAndRedirect()
    return Promise.reject(new Error('Unauthorized'))
  }

  originalRequest._retry = true

  const p = new Promise((resolve, reject) => {
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

    const platform = getPlatform()
    const deviceId = getDeviceId()

    axios
      .post(
        baseURL + '/api/Users/refresh',
        { refresh_token: refreshToken },
        { headers: { platform, 'device-id': deviceId } }
      )
      .then((refreshRes) => {
        const newData = refreshRes.data
        if (newData?.code === 0 && newData?.data) {
          const { access_token, refresh_token: newRefreshToken, expires_in } = newData.data
          const expires = new Date(new Date().getTime() + expires_in * 1000)
          Cookies.set('access_token', access_token, { expires })
          if (newRefreshToken) Cookies.set('refresh_token', newRefreshToken, { expires: 14 })

          isRefreshing = false
          processQueue(null, access_token)
        } else {
          isRefreshing = false
          notify(newData?.msg || '登录过期，请重新登录')
          logoutAndRedirect()
        }
      })
      .catch(() => {
        isRefreshing = false
        notify('网络错误，请重新登录')
        logoutAndRedirect()
      })
  }

  return p
}

service.interceptors.request.use(
  (config) => {
    const token = Cookies.get('access_token')
    const platform = getPlatform()
    const deviceId = getDeviceId()

    if (token) {
      setHeader(config, 'Authorization', `Bearer ${token}`)
    }
    
    setHeader(config, 'platform', platform)
    setHeader(config, 'device-id', deviceId)
    // 添加 trace_id 用于链路追踪
    setHeader(config, 'X-Trace-Id', generateTraceId())
    return config
  },
  (error) => Promise.reject(error)
)

service.interceptors.response.use(
  (res) => {
    const data = res?.data
    if (data && typeof data === 'object' && Object.prototype.hasOwnProperty.call(data, 'code')) {
      const code = data.code
      if (code !== 0) {
        if (code === 401) {
          return handle401(res.config, data.msg)
        }

        const message = data.msg || '请求失败'
        notify(message)
        const err: any = new Error(message)
        err.code = code
        err.response = res
        err.data = data
        return Promise.reject(err)
      }
      return Promise.resolve(data.data !== undefined ? data.data : data)
    }
    return Promise.resolve(res.data)
  },
  (error) => {
    const resp = error?.response
    const status = resp?.status

    if (status === 401) {
      return handle401(error.config, resp?.data?.msg || '未授权')
    }

    const data = resp?.data
    const message = (data && (data.msg || data.message)) || error.message || '请求失败'
    notify(message)
    return Promise.reject(error)
  }
)

type AnyObject = Record<string, any>

/**
 * 获取通用请求头（token, platform, device-id, trace-id）
 */
export function getCommonHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  const token = Cookies.get('access_token')
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  headers['platform'] = getPlatform()
  headers['device-id'] = getDeviceId()
  headers['X-Trace-Id'] = generateTraceId()
  return headers
}

export interface SSECallbacks {
  onEvent?: (event: string, data: any) => boolean | void
  onError?: (msg: string) => void
  onComplete?: () => void
}

/**
 * SSE 流式请求
 */
export async function streamPost(url: string, data: AnyObject, callbacks: SSECallbacks): Promise<void> {
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
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      let currentEvent = ''
      for (const line of lines) {
        if (line.startsWith('event:')) {
          currentEvent = line.slice(6).trim()
        } else if (line.startsWith('data:')) {
          const dataStr = line.slice(5).trim()
          try {
            const parsed = JSON.parse(dataStr)
            const shouldStop = callbacks.onEvent?.(currentEvent, parsed)
            if (shouldStop) {
              controller.abort()
              return
            }
          } catch {
            // 忽略解析错误
          }
        }
      }
    }
    callbacks.onComplete?.()
  } catch (e: any) {
    if (e.name !== 'AbortError') {
      throw e
    }
  } finally {
    reader.releaseLock()
  }
}

const request = {
  get<T = any>(url: string, config?: AnyObject): Promise<T> {
    return service.get(url, config as any).then((res: any) => res as T)
  },
  post<T = any>(url: string, data?: AnyObject, config?: AnyObject): Promise<T> {
    return service.post(url, data as any, config as any).then((res: any) => res as T)
  },
  put<T = any>(url: string, data?: AnyObject, config?: AnyObject): Promise<T> {
    return service.put(url, data as any, config as any).then((res: any) => res as T)
  },
  delete<T = any>(url: string, config?: AnyObject): Promise<T> {
    return service.delete(url, config as any).then((res: any) => res as T)
  }
}

export default request
