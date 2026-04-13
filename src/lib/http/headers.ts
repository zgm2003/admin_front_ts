import {
  AxiosHeaders,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios'
import Cookies from 'js-cookie'
import { buildCommonHeaders } from './platform'

export function setHeader(
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

export function applyCommonHeaders(config: InternalAxiosRequestConfig<unknown>) {
  const token = Cookies.get('access_token')
  const headers = buildCommonHeaders(token)

  Object.entries(headers).forEach(([name, value]) => {
    setHeader(config, name, value)
  })

  return config
}

export function getCommonHeaders() {
  return buildCommonHeaders(Cookies.get('access_token'))
}
