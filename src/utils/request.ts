import axios, { AxiosHeaders } from 'axios'
import Cookies from 'js-cookie'
import router from '@/router'
import { useUserStore } from '@/store/user'
import { ElNotification } from 'element-plus'
import { clearAllCookies } from '@/utils/cookie'
import { getDeviceId } from '@/utils/device'

const baseURL = import.meta.env.VITE_SOME_KEY
const service = axios.create({ baseURL, timeout: 60000 })

let isRefreshing = false
let requestsQueue: { resolve: Function, reject: Function, config: any }[] = []

function processQueue(error: Error | null, token: string | null = null) {
  requestsQueue.forEach(({ resolve, reject, config }) => {
    if (error) {
      reject(error)
    } else {
      const setHeader = (name: string, value: any) => {
        const h: any = config.headers
        if (h && typeof h.set === 'function') (h as AxiosHeaders).set(name, value)
        else config.headers = { ...(config.headers as any || {}), [name]: value }
      }
      if (token) setHeader('Authorization', `Bearer ${token}`)
      resolve(service(config))
    }
  })
  requestsQueue = []
}

service.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token')
    const platform = import.meta.env.VITE_PLATFORM || (/(Android|iPhone|iPad|iPod|Windows Phone)/i.test(navigator.userAgent) ? 'mobile' : 'web')
    const deviceId = getDeviceId()

    const setHeader = (name: string, value: any) => {
      const h: any = config.headers
      if (h && typeof h.set === 'function') (h as AxiosHeaders).set(name, value)
      else config.headers = { ...(config.headers as any || {}), [name]: value }
    }

    if (token) setHeader('Authorization', `Bearer ${token}`)
    setHeader('Platform', platform)
    setHeader('Device-Id', deviceId)
    return config
  },
  (error) => Promise.reject(error)
)

service.interceptors.response.use(
  (res) => {
    const data = res && res.data
    if (data && typeof data === 'object' && Object.prototype.hasOwnProperty.call(data, 'code')) {
      const code = data.code
      if (code !== 0) {
        // 统一处理 401: 无论是 HTTP 401 还是 业务 code 401，都走刷新逻辑
        if (code === 401) {
          const logoutAndRedirect = (msg: string) => {
            clearAllCookies()
            router.push('/login')
            processQueue(new Error(msg))
          }
          const originalRequest: any = res.config

          // refresh 自己失败：直接退出 + 清队列
          if (originalRequest.url?.includes('/api/Users/refresh')) {
            isRefreshing = false
            // 显式弹出错误提示
            const message = data.msg || '登录过期，请重新登录'
            ElNotification.error({ message })
            logoutAndRedirect('Token refresh failed')
            return Promise.reject(new Error('Refresh failed'))
          }

          // 防止同一个请求无限 retry
          if (originalRequest._retry) {
            isRefreshing = false
            const message = data.msg || '登录过期，请重新登录'
            ElNotification.error({ message })
            logoutAndRedirect('Unauthorized')
            return Promise.reject(new Error('Unauthorized'))
          }
          originalRequest._retry = true

          // 将当前请求入队
          const p = new Promise((resolve, reject) => {
            requestsQueue.push({ resolve, reject, config: originalRequest })
          })

          if (!isRefreshing) {
            isRefreshing = true
            const refreshToken = Cookies.get('refresh_token')

            if (!refreshToken) {
              isRefreshing = false
              const message = '登录过期，请重新登录'
              ElNotification.error({ message })
              logoutAndRedirect('No refresh token')
              return Promise.reject(new Error('No refresh token'))
            }

            const platform = import.meta.env.VITE_PLATFORM
            const deviceId = getDeviceId()

            axios
              .post(
                baseURL + '/api/Users/refresh',
                { refresh_token: refreshToken },
                { headers: { Platform: platform, 'Device-Id': deviceId } }
              )
              .then((refreshRes) => {
                const newData = refreshRes.data
                if (newData.code === 0 && newData.data) {
                  const { access_token, refresh_token: newRefreshToken } = newData.data
                  Cookies.set('token', access_token)
                  if (newRefreshToken) Cookies.set('refresh_token', newRefreshToken)

                  isRefreshing = false
                  processQueue(null, access_token)
                } else {
                  isRefreshing = false
                  const message = newData.msg || '登录过期，请重新登录'
                  ElNotification.error({ message })
                  logoutAndRedirect('Token refresh failed')
                }
              })
              .catch(() => {
                isRefreshing = false
                const message = '网络错误，请重新登录'
                ElNotification.error({ message })
                logoutAndRedirect('Token refresh failed')
              })
          }

          return p
        }

        const message = data.msg || '请求失败'
        ElNotification.error({ message })
        if (code === 403) {
          try {
            const userStore = useUserStore()
            userStore.fetchUserInfo().catch(() => {})
          } catch {}
        } else if (code === 404) {
          router.push('/404')
        }
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
    const resp = (error && (error as any).response) || null
    const data = resp && resp.data
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
  },
}

export default request