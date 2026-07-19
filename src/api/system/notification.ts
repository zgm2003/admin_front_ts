import { executeAdminOperation } from '@/lib/http'
import type { ExecuteOptions } from '@/modules/http/client'
import type { components } from '@/modules/http/generated/admin'
import {
  adminOperations,
  type AdminOperationInput,
} from '@/modules/http/generated/operations'
import type { Id } from '@/types/common'

/** 通知项 */
export type NotificationItem = components['schemas']['NotificationItem']

/** 通知列表查询参数 */
export interface NotificationListParams {
  page_size: number
  current_page: number
  before_id?: number
  keyword?: string
  type?: 1 | 2 | 3 | 4 | ''
  level?: 1 | 2 | ''
  is_read?: 1 | 2 | ''
}

/** 字典响应 */
export type NotificationInitResponse = components['schemas']['NotificationPageInit']

/** 未读数量响应 */
export type UnreadCountResponse = components['schemas']['NotificationUnreadCountResult']

/** 标记已读参数：传 id(单个/数组) 或不传(全部) */
export interface NotificationReadParams {
  id?: Id | Id[]
}

/** 删除参数：传 id(单个/数组) */
export interface NotificationDelParams {
  id: Id | Id[]
}

export type NotificationListResponse = components['schemas']['NotificationListResult']

type NotificationListQueryParams = AdminOperationInput<'get_api_admin_v1_notifications'>['query']

function normalizeListParams(params: NotificationListParams): NotificationListQueryParams {
  const query: NotificationListQueryParams = {
    current_page: params.current_page,
    page_size: params.page_size,
  }

  if (params.before_id !== undefined) query.before_id = params.before_id

  const keyword = params.keyword?.trim()
  if (keyword) {
    query.keyword = keyword
  }

  if (params.type !== '' && params.type !== undefined) query.type = params.type
  if (params.level !== '' && params.level !== undefined) query.level = params.level
  if (params.is_read !== '' && params.is_read !== undefined) query.is_read = params.is_read

  return query
}

function normalizeNotificationIDs(id: Id | Id[]): [number, ...number[]] {
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

  const first = ids[0]
  if (first === undefined) throw new Error('notification ids must not be empty')

  return [first, ...ids.slice(1)]
}

const pageInit = (options: ExecuteOptions = {}): Promise<NotificationInitResponse> =>
  executeAdminOperation(adminOperations.get_api_admin_v1_notifications_page_init, {}, options)

const deleteOne = async (params: { id: Id }, options: ExecuteOptions = {}): Promise<void> => {
  const [id] = normalizeNotificationIDs(params.id)
  await executeAdminOperation(adminOperations.delete_api_admin_v1_notifications_id, {
    path: { id },
  }, options)
}

const deleteBatch = async (params: { ids: Id[] }, options: ExecuteOptions = {}): Promise<void> => {
  await executeAdminOperation(adminOperations.delete_api_admin_v1_notifications, {
    body: { ids: normalizeNotificationIDs(params.ids) },
  }, options)
}

export const NotificationApi = {
  /** 初始化（字典） */
  pageInit,
  /** 获取通知列表（普通分页） */
  list: (params: NotificationListParams, options: ExecuteOptions = {}): Promise<NotificationListResponse> =>
    executeAdminOperation(adminOperations.get_api_admin_v1_notifications, {
      query: normalizeListParams(params),
    }, options),

  /** 获取未读数量 */
  unreadCount: (options: ExecuteOptions = {}): Promise<UnreadCountResponse> =>
    executeAdminOperation(adminOperations.get_api_admin_v1_notifications_unread_count, {}, options),

  /** 标记已读（支持单个/批量/全部） */
  async read(params?: NotificationReadParams, options: ExecuteOptions = {}): Promise<void> {
    if (params?.id === undefined) {
      await executeAdminOperation(adminOperations.patch_api_admin_v1_notifications_read, {
        body: { ids: [] },
      }, options)
      return
    }

    const ids = normalizeNotificationIDs(params.id)
    if (ids.length === 1) {
      await executeAdminOperation(adminOperations.patch_api_admin_v1_notifications_id_read, {
        path: { id: ids[0] },
      }, options)
      return
    }

    await executeAdminOperation(adminOperations.patch_api_admin_v1_notifications_read, {
      body: { ids },
    }, options)
  },

  /** 删除通知（支持单个/批量） */
  deleteOne,
  deleteBatch,
}
