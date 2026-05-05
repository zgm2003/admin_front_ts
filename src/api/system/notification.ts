import request from '@/lib/http'
import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'
import type { DictOption, Id, PaginatedResponse } from '@/types/common'

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

/** 字典响应 */
export interface NotificationInitResponse {
  dict: {
    notification_type_arr: DictOption<number>[]
    notification_level_arr: DictOption<number>[]
    notification_read_status_arr: DictOption<number>[]
  }
}

/** 未读数量响应 */
export interface UnreadCountResponse {
  count: number
}

/** 标记已读参数：传 id(单个/数组) 或不传(全部) */
export interface NotificationReadParams {
  id?: Id | Id[]
}

/** 删除参数：传 id(单个/数组) */
export interface NotificationDelParams {
  id: Id | Id[]
}

interface NotificationListQueryParams {
  page_size: number
  current_page: number
  keyword?: string
  type?: number
  level?: number
  is_read?: number
}

interface NotificationBatchPayload {
  ids: number[]
}

function normalizeOptionalNumber(value: number | string | undefined): number | undefined {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return value
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
  }
  return undefined
}

function normalizeListParams(params: NotificationListParams): NotificationListQueryParams {
  const query: NotificationListQueryParams = {
    current_page: params.current_page,
    page_size: params.page_size,
  }

  const keyword = params.keyword?.trim()
  if (keyword) {
    query.keyword = keyword
  }

  const type = normalizeOptionalNumber(params.type)
  if (type !== undefined) {
    query.type = type
  }

  const level = normalizeOptionalNumber(params.level)
  if (level !== undefined) {
    query.level = level
  }

  const isRead = normalizeOptionalNumber(params.is_read)
  if (isRead !== undefined) {
    query.is_read = isRead
  }

  return query
}

function normalizeNotificationIDs(id: Id | Id[]): number[] {
  const values = Array.isArray(id) ? id : [id]
  const ids: number[] = []
  const seen = new Set<number>()

  for (const value of values) {
    if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
      throw new Error('notification id must be a positive integer')
    }
    if (seen.has(value)) {
      continue
    }
    seen.add(value)
    ids.push(value)
  }

  return ids
}

export const NotificationApi = {
  /** 初始化（字典） */
  init: () => request.get<NotificationInitResponse>(`${ADMIN_API_PREFIX}/notifications/init`),

  /** 获取通知列表（普通分页） */
  list: (params: NotificationListParams) =>
    request.get<PaginatedResponse<NotificationItem>>(`${ADMIN_API_PREFIX}/notifications`, { params: normalizeListParams(params) }),

  /** 获取未读数量 */
  unreadCount: () => request.get<UnreadCountResponse>(`${ADMIN_API_PREFIX}/notifications/unread-count`),

  /** 标记已读（支持单个/批量/全部） */
  read: (params?: NotificationReadParams) => {
    if (params?.id === undefined) {
      return request.patch<void, NotificationBatchPayload>(`${ADMIN_API_PREFIX}/notifications/read`, { ids: [] })
    }

    const ids = normalizeNotificationIDs(params.id)
    if (ids.length === 1) {
      return request.patch<void>(`${ADMIN_API_PREFIX}/notifications/${ids[0]}/read`)
    }

    const body: NotificationBatchPayload = { ids }
    return request.patch<void, NotificationBatchPayload>(`${ADMIN_API_PREFIX}/notifications/read`, body)
  },

  /** 删除通知（支持单个/批量） */
  del: (params: NotificationDelParams) => {
    const ids = normalizeNotificationIDs(params.id)
    if (ids.length === 1) {
      return request.delete<void>(`${ADMIN_API_PREFIX}/notifications/${ids[0]}`)
    }

    const body: NotificationBatchPayload = { ids }
    return request.delete<void, NotificationBatchPayload>(`${ADMIN_API_PREFIX}/notifications`, { data: body })
  },
}
