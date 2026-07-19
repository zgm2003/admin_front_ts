import { describe, expect, it, vi } from 'vitest'
import type {
  NotificationItem,
  NotificationListResponse,
} from '@/api/system/notification'
import {
  createNotificationsWorkflow,
  type NotificationsWorkflowApi,
} from '@/features/notifications/workflow'
import { eventBase, FakeFeatureRealtime, page } from './support'

const item = (id: number): NotificationItem => ({
  id,
  title: `notification-${id}`,
  content: 'content',
  type: 2,
  type_text: 'info',
  level: 1,
  level_text: 'normal',
  link: '',
  is_read: 2,
  created_at: '2026-07-19 00:00:00',
})

function dependencies(list: NotificationsWorkflowApi['list']) {
  const api: NotificationsWorkflowApi = {
    list,
    unreadCount: vi.fn(async () => ({ count: 1 })),
    read: vi.fn(async () => undefined),
    deleteOne: vi.fn(async () => undefined),
    deleteBatch: vi.fn(async () => undefined),
  }
  return api
}

describe('notifications workflow', () => {
  it('deduplicates durable notifications and recovers authoritative list/count state', async () => {
    const response: NotificationListResponse = { list: [item(1)], next_id: 0, page: page() }
    const list = vi.fn(async () => response)
    const api = dependencies(list)
    const realtime = new FakeFeatureRealtime()
    const workflow = createNotificationsWorkflow({ api, realtime })
    await workflow.list.execute({ current_page: 1, page_size: 20 })
    await workflow.loadUnreadCount()

    const envelope = {
      ...eventBase,
      event_id: '01J00000000000000000000001',
      type: 'notification.created.v1',
      sequence: 1,
      durability: 'durable',
      data: {
        task_id: 1,
        title: 'created',
        content: 'content',
        link: '',
        level: 'normal',
        notification_type: 'info',
      },
    } as const
    await realtime.emit(envelope)
    await realtime.emit(envelope)

    expect(list).toHaveBeenCalledTimes(2)
    expect(api.unreadCount).toHaveBeenCalledTimes(2)

    await realtime.recover(9)
    expect(list).toHaveBeenCalledTimes(3)
    expect(api.unreadCount).toHaveBeenCalledTimes(3)
    expect(workflow.unreadCount.value).toBe(1)
    workflow.dispose()
  })
})
