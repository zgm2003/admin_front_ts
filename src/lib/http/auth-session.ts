import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'
import Cookies from 'js-cookie'
import router from '@/router'
import { useMenuStore } from '@/store/menu'
import { clearAllCookies } from '@/utils/storage'
import type { ApiEnvelope } from '@/types/common'
import { createRequestError, type RequestError } from './envelope'
import { getPlatform } from './platform'
import { getDeviceId } from './device'
import { setHeader } from './headers'

export type RetryableRequestConfig = InternalAxiosRequestConfig<unknown> & {
  _retry?: boolean
}

interface QueuedRequest {
  resolve: (value: unknown) => void
  reject: (reason?: unknown) => void
  config: RetryableRequestConfig
}

export function createAuthSessionManager(params: {
  baseURL: string
  service: AxiosInstance
  notify: (message: string) => void
}) {
  const { baseURL, service, notify } = params

  let isRefreshing = false
  let requestsQueue: QueuedRequest[] = []

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

  async function refreshToken() {
    const refreshToken = Cookies.get('refresh_token')
    if (!refreshToken) {
      throw new Error('No refresh token')
    }

    const refreshResponse = await axios.post<ApiEnvelope<{
      access_token: string
      refresh_token: string
      expires_in: number
      refresh_expires_in: number
    }>>(
      `${baseURL}/api/v1/auth/refresh`,
      { refresh_token: refreshToken },
      {
        headers: {
          platform: getPlatform(),
          'device-id': getDeviceId(),
        },
      }
    )

    return refreshResponse.data
  }

  function handle401(originalRequest: RetryableRequestConfig, messageFromServer?: string) {
    if (originalRequest.url?.includes('/api/v1/auth/refresh') || originalRequest._retry) {
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

      refreshToken()
        .then((payload) => {
          if (payload.code === 0 && payload.data) {
            const {
              access_token,
              refresh_token: newRefreshToken,
              expires_in,
              refresh_expires_in,
            } = payload.data

            Cookies.set('access_token', access_token, {
              expires: new Date(Date.now() + expires_in * 1000),
            })
            Cookies.set('refresh_token', newRefreshToken, {
              expires: new Date(Date.now() + refresh_expires_in * 1000),
            })

            isRefreshing = false
            processQueue(null, access_token)
            return
          }

          isRefreshing = false
          notify(payload.msg || '登录过期，请重新登录')
          logoutAndRedirect()
        })
        .catch((error) => {
          isRefreshing = false
          notify(error instanceof Error && error.message === 'No refresh token'
            ? '登录过期，请重新登录'
            : '网络错误，请重新登录')
          logoutAndRedirect()
        })
    }

    return pendingRequest
  }

  return {
    handle401,
    createUnauthorizedError(message = 'Unauthorized') {
      return createRequestError({ message }) as RequestError
    },
  }
}
