import { legacyRequest } from '@/lib/http'

/** 通知项 */
export interface NotificationItem {
  id: number
  title: string
  content: string
  type: number
  type_text: string
  level: number
  level_text: string
  link: string
  is_read: number
  created_at: string
}

/** 通知列表查询参数 */
export interface NotificationListParams {
  page_size: number
  current_page: number
  keyword?: string
  type?: number | string
  level?: number | string
  is_read?: number | string
}

/** 分页信息 */
export interface PageInfo {
  page_size: number
  current_page: number
  total_page: number
  total: number
}

/** 分页响应 */
export interface NotificationListResponse {
  list: NotificationItem[]
  page: PageInfo
}

/** 字典响应 */
export interface NotificationInitResponse {
  dict: {
    notification_type_arr: { value: number; label: string }[]
    notification_level_arr: { value: number; label: string }[]
    notification_read_status_arr: { value: number; label: string }[]
  }
}

/** 未读数量响应 */
export interface UnreadCountResponse {
  count: number
}

/** 标记已读参数：传 id(单个/数组) 或不传(全部) */
export interface NotificationReadParams {
  id?: number | number[]
}

/** 删除参数：传 id(单个/数组) */
export interface NotificationDelParams {
  id: number | number[]
}

export const NotificationApi = {
  /** 初始化（字典） */
  init: () => legacyRequest.post<NotificationInitResponse>('/api/admin/Notification/init'),

  /** 获取通知列表（普通分页） */
  list: (params: NotificationListParams) => legacyRequest.post<NotificationListResponse>('/api/admin/Notification/list', params),

  /** 获取未读数量 */
  unreadCount: () => legacyRequest.post<UnreadCountResponse>('/api/admin/Notification/unreadCount'),

  /** 标记已读（支持单个/批量/全部） */
  read: (params?: NotificationReadParams) => legacyRequest.post('/api/admin/Notification/read', params),

  /** 删除通知（支持单个/批量） */
  del: (params: NotificationDelParams) => legacyRequest.post('/api/admin/Notification/del', params),
}
