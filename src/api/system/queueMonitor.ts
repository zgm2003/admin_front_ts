import { service } from '@/lib/http'
import { getCommonHeaders } from '@/lib/http/headers'
import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'

export const ADMIN_QUEUE_MONITOR_UI_PATH = `${ADMIN_API_PREFIX}/queue-monitor-ui`
export const ADMIN_QUEUE_MONITOR_UI_URL = buildQueueMonitorUIURL(import.meta.env.VITE_GO_API_BASE_URL)

export function ensureQueueMonitorAuthCookie() {
  return service.head(ADMIN_QUEUE_MONITOR_UI_PATH, {
    headers: getCommonHeaders(),
  })
}

export function buildQueueMonitorUIURL(apiBaseURL: string): string {
  const baseURL = new URL(apiBaseURL)

  if (isLoopbackHost(baseURL.hostname) && isLoopbackHost(window.location.hostname)) {
    baseURL.hostname = window.location.hostname
  }

  return new URL(ADMIN_QUEUE_MONITOR_UI_PATH, `${baseURL.origin}/`).toString()
}

function isLoopbackHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname === '[::1]'
}
