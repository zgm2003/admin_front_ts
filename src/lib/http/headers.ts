import Cookies from 'js-cookie'
import { buildCommonHeaders, getAdminClientVariant } from './platform'

interface MutableHeaderBag {
  set?(name: string, value: string): unknown
  delete?(name: string): unknown
  [name: string]: unknown
}

interface MutableRequestConfig {
  data?: unknown
  headers?: MutableHeaderBag
  withCredentials?: boolean
}

export function setHeader(
  config: MutableRequestConfig,
  name: string,
  value: string | number | boolean | null | undefined
) {
  if (value === undefined || value === null || value === '') {
    return
  }

  const headers = config.headers
  if (headers && typeof headers.set === 'function') {
    headers.set(name, String(value))
    return
  }

  config.headers = {
    ...(config.headers ?? {}),
    [name]: String(value),
  }
}

function deleteHeader(
  config: MutableRequestConfig,
  name: string
) {
  const headers = config.headers
  if (!headers) {
    return
  }

  if (typeof headers.delete === 'function') {
    headers.delete(name)
    return
  }

  const lowerName = name.toLowerCase()
  const existingName = Object.keys(headers).find((key) => key.toLowerCase() === lowerName)
  if (existingName) {
    delete headers[existingName]
  }
}

function isFormDataPayload(data: unknown): boolean {
  if (typeof FormData !== 'undefined' && data instanceof FormData) {
    return true
  }

  return Object.prototype.toString.call(data) === '[object FormData]'
}

export function applyCommonHeaders(config: MutableRequestConfig) {
  const token = Cookies.get('access_token')
  const headers = buildCommonHeaders(token)
  const hasFormDataPayload = isFormDataPayload(config.data)
  config.withCredentials = getAdminClientVariant() === 'browser'

  if (hasFormDataPayload) {
    deleteHeader(config, 'Content-Type')
  }

  Object.entries(headers).forEach(([name, value]) => {
    if (hasFormDataPayload && name.toLowerCase() === 'content-type') {
      return
    }

    setHeader(config, name, value)
  })

  return config
}

export function getCommonHeaders() {
  return buildCommonHeaders(Cookies.get('access_token'))
}
