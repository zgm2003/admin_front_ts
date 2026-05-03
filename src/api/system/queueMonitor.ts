import { legacyRequest } from '@/lib/http'
import type { PaginatedResponse } from '@/types/common'

export interface QueueMonitorItem {
  name: string
  label: string
  group: 'fast' | 'slow'
  waiting: number
  delayed: number
  failed: number
}

export interface QueueFailedItem {
  index: number
  data: Record<string, unknown> | null
  max_attempts: number | null
  attempts: number | null
  error: string | null
  raw: string
}

export interface QueueMonitorClearResponse {
  cleared: number
}

export const QueueMonitorApi = {
  list: () => legacyRequest.post<QueueMonitorItem[]>('/api/admin/QueueMonitor/list'),
  failedList: (params: { queue: string; page_size: number; current_page: number }) =>
    legacyRequest.post<PaginatedResponse<QueueFailedItem>>('/api/admin/QueueMonitor/failedList', params),
  retry: (params: { queue: string; index: number }) => legacyRequest.post<void>('/api/admin/QueueMonitor/retry', params),
  clear: (params: { queue: string }) => legacyRequest.post<QueueMonitorClearResponse>('/api/admin/QueueMonitor/clear', params),
  clearFailed: (params: { queue: string }) => legacyRequest.post<QueueMonitorClearResponse>('/api/admin/QueueMonitor/clearFailed', params),
}
