import request from '@/utils/request'
import type { CursorPaginateResponse } from '@/components/LogStream/types'

export interface NotificationItem {
  id: number
  title: string
  content: string
  type: string
  level: string
  link: string
  is_read: number
  created_at: string
}

export const NotificationApi = {
  /** 获取通知列表（游标分页） */
  listCursor: (params?: { page_size?: number; cursor?: number }) => 
    request.post<CursorPaginateResponse<NotificationItem>>('/api/admin/Notification/list', params),

  /** 获取未读数量 */
  unreadCount: () => request.post('/api/admin/Notification/unreadCount'),

  /** 标记已读（传id标记单条，不传标记全部） */
  read: (id?: number) => request.post('/api/admin/Notification/read', id ? { id } : {}),

  /** 删除通知 */
  del: (id: number) => request.post('/api/admin/Notification/del', { id }),
}
