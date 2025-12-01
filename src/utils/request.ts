import axios from 'axios'
import Cookies from 'js-cookie'
import router from '@/router'
import { ElNotification } from 'element-plus'
import { clearAllCookies } from '@/utils/cookie'

const baseURL = import.meta.env.VITE_SOME_KEY
const service = axios.create({ baseURL, timeout: 60000 })

service.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token')
    const platform = import.meta.env.VITE_PLATFORM || (/(Android|iPhone|iPad|iPod|Windows Phone)/i.test(navigator.userAgent) ? 'mobile' : 'web')
    if (token) config.headers = { ...(config.headers || {}), Authorization: `Bearer ${token}` }
    config.headers = { ...(config.headers || {}), Platform: platform }
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
        const message = data.msg || '请求失败'
        ElNotification.error({ message })
        if (code === 401) {
          clearAllCookies()
          router.push('/login')
        } else if (code === 403) {
          router.push('/')
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

export default service
