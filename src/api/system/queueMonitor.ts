import { issueQueueMonitorGrant } from '@/api/auth/browserGrant'
import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'
import { normalizeLoopbackURLHost } from '@/lib/network/loopback'

export const ADMIN_QUEUE_MONITOR_UI_PATH = `${ADMIN_API_PREFIX}/queue-monitor-ui`
export const ADMIN_QUEUE_MONITOR_UI_URL = buildQueueMonitorUIURL(import.meta.env.VITE_GO_API_BASE_URL)

export function prepareQueueMonitorGrant() {
  return issueQueueMonitorGrant()
}

export function buildQueueMonitorUIURL(apiBaseURL: string): string {
  const baseURL = new URL(apiBaseURL)
  normalizeLoopbackURLHost(baseURL)

  return new URL(ADMIN_QUEUE_MONITOR_UI_PATH, `${baseURL.origin}/`).toString()
}
