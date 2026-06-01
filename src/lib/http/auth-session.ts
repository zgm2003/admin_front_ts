import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'
import Cookies from 'js-cookie'
import router from '@/router'
import { useMenuStore } from '@/store/menu'
import { clearAllCookies } from '@/utils/storage'
import type { ApiEnvelope } from '@/types/common'
import { createRequestError, requireApiMessage, type RequestError } from './envelope'
import { getPlatform } from './platform'
import { getDeviceId } from './device'
import { setHeader } from './headers'

import { ADMIN_AUTH_REFRESH_PATH } from './api-prefix'

const REFRESH_PATH = ADMIN_AUTH_REFRESH_PATH
const NO_REFRESH_TOKEN_MESSAGE = 'No refresh token'
const SESSION_EXPIRED_MESSAGE = '登录过期，请重新登录'
const REFRESH_NETWORK_ERROR_MESSAGE = '网络错误，请重新登录'

export type RetryableRequestConfig = InternalAxiosRequestConfig<unknown> & {
  _retry?: boolean
}

interface QueuedRequest {
  resolve: (value: unknown) => void
  reject: (reason?: unknown) => void
  config: RetryableRequestConfig
}

function resolveSessionExpiredMessage(messageFromServer?: string): string {
  if (messageFromServer === undefined) {
    return SESSION_EXPIRED_MESSAGE
  }

  return requireApiMessage({ msg: messageFromServer })
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

  function logoutAndRedirect(queueError: Error = new Error('Unauthorized')) {
    useMenuStore().reset()
    clearAllCookies()
    router.push('/login')
    processQueue(queueError)
  }

  async function refreshToken() {
    const refreshToken = Cookies.get('refresh_token')
    if (!refreshToken) {
      throw new Error(NO_REFRESH_TOKEN_MESSAGE)
    }

    const refreshResponse = await axios.post<ApiEnvelope<{
      access_token: string
      refresh_token: string
      expires_in: number
      refresh_expires_in: number
    }>>(
      `${baseURL}${REFRESH_PATH}`,
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
    if (originalRequest.url?.includes(REFRESH_PATH) || originalRequest._retry) {
      isRefreshing = false
      let message: string
      try {
        message = resolveSessionExpiredMessage(messageFromServer)
      } catch (error) {
        const contractError = error instanceof Error
          ? error
          : new Error('api envelope msg must be a non-empty string')
        notify(contractError.message)
        logoutAndRedirect(contractError)
        return Promise.reject(contractError)
      }

      notify(message)
      const unauthorizedError = new Error('Unauthorized')
      logoutAndRedirect(unauthorizedError)
      return Promise.reject(unauthorizedError)
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

          let message: string
          try {
            message = requireApiMessage(payload)
          } catch (error) {
            const contractError = error instanceof Error
              ? error
              : new Error('api envelope msg must be a non-empty string')
            isRefreshing = false
            notify(contractError.message)
            logoutAndRedirect(contractError)
            return
          }

          isRefreshing = false
          notify(message)
          logoutAndRedirect()
        })
        .catch((error) => {
          isRefreshing = false
          notify(error instanceof Error && error.message === NO_REFRESH_TOKEN_MESSAGE
            ? SESSION_EXPIRED_MESSAGE
            : REFRESH_NETWORK_ERROR_MESSAGE)
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
