import { legacyRequest } from '@/lib/http'
import type { DictOption, PaginatedResponse, RequestPayload } from '@/types/common'

export interface NotificationTaskInitResponse {
  dict: {
    notification_type_arr: DictOption<number>[]
    notification_level_arr: DictOption<number>[]
    notification_target_type_arr: DictOption<number>[]
    platformArr: Array<{ label: string; value: string }>
  }
}

export interface NotificationTaskStatusItem {
  label: string
  value: number
  num: number
}

export interface NotificationTaskListParams extends RequestPayload {
  current_page?: number
  page_size?: number
  status?: number | ''
  title?: string
}

export interface NotificationTaskItem {
  id: number
  title: string
  content?: string
  type: number
  type_text: string
  level: number
  level_text: string
  platform: string
  platform_text: string
  target_type: number
  target_type_text: string
  status: number
  status_text: string
  total_count: number
  sent_count: number
  send_at?: string | null
  error_msg?: string | null
  created_at: string
}

export interface NotificationTaskAddParams extends RequestPayload {
  title: string
  content?: string
  type?: number
  level?: number
  link?: string
  platform?: string
  target_type: number
  target_ids?: number[]
  send_at?: string
}

export const NotificationTaskApi = {
  init: () => legacyRequest.post<NotificationTaskInitResponse>('/api/admin/NotificationTask/init'),
  statusCount: (params: Pick<NotificationTaskListParams, 'title'>) => legacyRequest.post<NotificationTaskStatusItem[]>('/api/admin/NotificationTask/statusCount', params),
  list: (params: NotificationTaskListParams) => legacyRequest.post<PaginatedResponse<NotificationTaskItem>>('/api/admin/NotificationTask/list', params),
  add: (params: NotificationTaskAddParams) => legacyRequest.post<{ id: number }>('/api/admin/NotificationTask/add', params),
  del: (params: { id: number }) => legacyRequest.post<void>('/api/admin/NotificationTask/del', params),
  cancel: (params: { id: number }) => legacyRequest.post<void>('/api/admin/NotificationTask/cancel', params),
}
