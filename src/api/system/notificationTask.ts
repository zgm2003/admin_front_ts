import request from '@/lib/http'
import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'
import type { DictOption, Id, PaginatedResponse } from '@/types/common'

export type NotificationType = 1 | 2 | 3 | 4
export type NotificationLevel = 1 | 2
export type NotificationTargetType = 1 | 2 | 3
export type NotificationTaskStatus = 1 | 2 | 3 | 4
export type NotificationTaskPlatform = 'all' | 'admin' | 'app'

export interface NotificationTaskInitResponse {
  dict: {
    notification_type_arr: DictOption<number>[]
    notification_level_arr: DictOption<number>[]
    notification_target_type_arr: DictOption<number>[]
    notification_task_status_arr: DictOption<NotificationTaskStatus>[]
    platformArr: DictOption<NotificationTaskPlatform>[]
  }
}

export interface NotificationTaskStatusItem {
  label: string
  value: NotificationTaskStatus
  num: number
}

export interface NotificationTaskListParams {
  current_page: number
  page_size: number
  status?: NotificationTaskStatus | ''
  title?: string
}

interface NotificationTaskListQueryParams {
  current_page: number
  page_size: number
  status?: NotificationTaskStatus
  title?: string
}

export interface NotificationTaskItem {
  id: number
  title: string
  content?: string
  type: NotificationType
  type_text: string
  level: NotificationLevel
  level_text: string
  platform: NotificationTaskPlatform
  platform_text: string
  target_type: NotificationTargetType
  target_type_text: string
  status: NotificationTaskStatus
  status_text: string
  total_count: number
  sent_count: number
  send_at?: string | null
  error_msg?: string | null
  created_at: string
}

export interface NotificationTaskAddParams {
  title: string
  content?: string
  type?: NotificationType
  level?: NotificationLevel
  link?: string
  platform?: NotificationTaskPlatform
  target_type: NotificationTargetType
  target_ids?: number[]
  send_at?: string
}

export interface NotificationTaskCreateResponse {
  id: number
  queued: boolean
}

function normalizeListParams(params: NotificationTaskListParams): NotificationTaskListQueryParams {
  const query: NotificationTaskListQueryParams = {
    current_page: params.current_page,
    page_size: params.page_size,
  }

  if (typeof params.status === 'number') {
    query.status = params.status
  }
  const title = params.title?.trim()
  if (title) {
    query.title = title
  }

  return query
}

function normalizeTaskID(id: Id): number {
  if (typeof id !== 'number' || !Number.isInteger(id) || id <= 0) {
    throw new Error('notification task id must be a positive integer')
  }
  return id
}

const BASE = `${ADMIN_API_PREFIX}/notification-tasks`

export const NotificationTaskApi = {
  init: () => request.get<NotificationTaskInitResponse>(`${BASE}/init`),
  statusCount: (params: Pick<NotificationTaskListParams, 'title'>) =>
    request.get<NotificationTaskStatusItem[]>(`${BASE}/status-count`, { params }),
  list: (params: NotificationTaskListParams) =>
    request.get<PaginatedResponse<NotificationTaskItem>>(BASE, { params: normalizeListParams(params) }),
  add: (params: NotificationTaskAddParams) =>
    request.post<NotificationTaskCreateResponse, NotificationTaskAddParams>(BASE, params),
  del: (params: { id: Id }) => request.delete<void>(`${BASE}/${normalizeTaskID(params.id)}`),
  cancel: (params: { id: Id }) => request.patch<void>(`${BASE}/${normalizeTaskID(params.id)}/cancel`),
}
