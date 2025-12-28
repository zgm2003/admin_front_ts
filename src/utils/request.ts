import axios, { AxiosHeaders } from 'axios'
import Cookies from 'js-cookie'
import router from '@/router'
import { ElNotification } from 'element-plus'
import { clearAllCookies } from '@/utils/cookie'
import { getDeviceId } from '@/utils/device'
import { useMenuStore } from '@/store/menu'

const baseURL = import.meta.env.VITE_SOME_KEY
const service = axios.create({ baseURL, timeout: 60000 })

let isRefreshing = false
let requestsQueue: { resolve: Function; reject: Function; config: any }[] = []

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

function logoutAndRedirect(message: string) {
  useMenuStore().reset()
  clearAllCookies()
  router.push('/login')
  processQueue(new Error(message))
}

/** 统一处理 401：业务 code=401 或 HTTP 401 都走这里 */
function handle401(originalRequest: any, messageFromServer?: string) {
  // refresh 自己失败 or 已经 retry 过：直接退出
  if (originalRequest?.url?.includes('/api/Users/refresh') || originalRequest?._retry) {
    isRefreshing = false
    ElNotification.error({ message: messageFromServer || '登录过期，请重新登录' })
    logoutAndRedirect('Unauthorized')
    return Promise.reject(new Error('Unauthorized'))
  }

  originalRequest._retry = true

  // 入队：等待 refresh 完成后重放
  const p = new Promise((resolve, reject) => {
    requestsQueue.push({ resolve, reject, config: originalRequest })
  })

  if (!isRefreshing) {
    isRefreshing = true
    const refreshToken = Cookies.get('refresh_token')
    if (!refreshToken) {
      isRefreshing = false
      ElNotification.error({ message: '登录过期，请重新登录' })
      logoutAndRedirect('No refresh token')
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
          ElNotification.error({ message: newData?.msg || '登录过期，请重新登录' })
          logoutAndRedirect('Token refresh failed')
        }
      })
      .catch(() => {
        isRefreshing = false
        ElNotification.error({ message: '网络错误，请重新登录' })
        logoutAndRedirect('Token refresh failed')
      })
  }

  return p
}

service.interceptors.request.use(
  (config) => {
    const token = Cookies.get('access_token')
    const platform = getPlatform()
    const deviceId = getDeviceId()

    // 只有在 token 存在时才添加 Authorization 头
    // 如果不存在，后端会返回 401，然后触发 response 拦截器里的 handle401 进行 refresh
    if (token) {
        setHeader(config, 'Authorization', `Bearer ${token}`)
    }
    
    setHeader(config, 'platform', platform)
    setHeader(config, 'device-id', deviceId)
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
        ElNotification.error({ message })
        // Removed: if (code === 404) router.push('/404') - API 404 should not redirect page
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

    // ✅ 补上 HTTP 401 也走 refresh
    if (status === 401) {
      return handle401(error.config, resp?.data?.msg || '未授权')
    }

    const data = resp?.data
    const message = (data && (data.msg || data.message)) || error.message || '请求失败'
    ElNotification.error({ message })
    return Promise.reject(error)
  }
)

type AnyObject = Record<string, any>
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
