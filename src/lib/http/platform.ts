import { getDeviceId } from './device'

export function generateTraceId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).slice(2, 10)
  return `${timestamp}-${random}`
}

export function getPlatform(): string {
  const envPlatform = import.meta.env.VITE_PLATFORM
  if (envPlatform) {
    return envPlatform
  }

  return /(Android|iPhone|iPad|iPod|Windows Phone)/i.test(navigator.userAgent)
    ? 'app'
    : 'admin'
}

export function buildCommonHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    platform: getPlatform(),
    'device-id': getDeviceId(),
    'X-Trace-Id': generateTraceId(),
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return headers
}
