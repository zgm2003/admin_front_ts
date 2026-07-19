import { computed } from 'vue'
import {
  NotificationApi,
  type NotificationDelParams,
  type NotificationItem,
  type NotificationListParams,
  type NotificationListResponse,
  type NotificationReadParams,
  type UnreadCountResponse,
} from '@/api/system/notification'
import type { KernelRealtime } from '@/app/kernel'
import { createMutation, type MutationExecutionOptions } from '@/modules/resource-query/mutation'
import { createResourceQuery } from '@/modules/resource-query/query'
import type { Id } from '@/types/common'

export interface NotificationsWorkflowApi {
  list(params: NotificationListParams, options: { readonly signal: AbortSignal }): Promise<NotificationListResponse>
  unreadCount(options: { readonly signal: AbortSignal }): Promise<UnreadCountResponse>
  read(params: NotificationReadParams | undefined, options: MutationExecutionOptions): Promise<void>
  deleteOne(params: { id: Id }, options: MutationExecutionOptions): Promise<void>
  deleteBatch(params: { ids: Id[] }, options: MutationExecutionOptions): Promise<void>
}

export interface NotificationsWorkflowOptions {
  readonly api?: NotificationsWorkflowApi
  readonly realtime: KernelRealtime
  readonly confirmDelete?: (input: NotificationDelParams) => Promise<boolean>
}

export function createNotificationsWorkflow(options: NotificationsWorkflowOptions) {
  const api = options.api ?? NotificationApi
  const list = createResourceQuery<NotificationItem, NotificationListParams, NotificationListResponse>({
    async request(params, context) {
      let result = await api.list(params, context)
      if (!context.signal.aborted && result.list.length === 0 && result.page.current_page > 1) {
        result = await api.list({
          ...params,
          current_page: result.page.current_page - 1,
          page_size: result.page.page_size,
        }, context)
      }
      return result
    },
    selectItems: (result) => result.list,
    onCommit: (result, params) => ({
      ...params,
      current_page: result.page.current_page,
      page_size: result.page.page_size,
    }),
  })
  const unread = createResourceQuery<number, undefined, UnreadCountResponse>({
    request: (_params, context) => api.unreadCount(context),
    selectItems: (result) => [result.count],
  })
  const unreadCount = computed(() => unread.state.value.data[0] ?? 0)

  const read = createMutation({
    key: (input: NotificationReadParams | undefined) => {
      const id = input?.id
      return `notification:read:${Array.isArray(id) ? id.join(',') : String(id ?? 'all')}`
    },
    execute: (input, mutationOptions) => api.read(input, mutationOptions),
    invalidate: [list, unread],
  })
  const deleteOne = createMutation({
    key: (input: { id: Id }) => `notification:delete:${input.id}`,
    confirm: options.confirmDelete,
    execute: (input, mutationOptions) => api.deleteOne(input, mutationOptions),
    invalidate: [list, unread],
  })
  const deleteBatch = createMutation({
    key: (input: { ids: Id[] }) => `notification:delete-batch:${input.ids.join(',')}`,
    confirm: options.confirmDelete
      ? (input) => options.confirmDelete!({ id: input.ids })
      : undefined,
    execute: (input, mutationOptions) => api.deleteBatch(input, mutationOptions),
    invalidate: [list, unread],
  })

  function loadUnreadCount() {
    return unread.execute(undefined)
  }

  async function recoverAuthoritative() {
    const work: Promise<unknown>[] = [
      unread.state.value.kind === 'idle' ? unread.execute(undefined) : unread.refresh(),
    ]
    if (list.state.value.kind !== 'idle') work.push(list.refresh())
    await Promise.all(work)
  }

  const seenEvents = new Map<string, true>()
  const unsubscribeCreated = options.realtime.subscribe('notification.created.v1', async (envelope) => {
    if (seenEvents.has(envelope.event_id)) return
    seenEvents.set(envelope.event_id, true)
    if (seenEvents.size > 512) {
      const oldest = seenEvents.keys().next().value
      if (oldest !== undefined) seenEvents.delete(oldest)
    }
    await recoverAuthoritative()
  })
  const unregisterRecovery = options.realtime.registerRecovery(async () => {
    await recoverAuthoritative()
  })

  function dispose() {
    unsubscribeCreated()
    unregisterRecovery()
    seenEvents.clear()
    read.dispose()
    deleteOne.dispose()
    deleteBatch.dispose()
    unread.dispose()
    list.dispose()
  }

  return {
    list,
    unreadCount,
    loadUnreadCount,
    read,
    deleteOne,
    deleteBatch,
    recoverAuthoritative,
    dispose,
  }
}
