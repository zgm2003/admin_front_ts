import { executeAdminOperation } from '@/lib/http'
import type { ExecuteOptions } from '@/modules/http/client'
import type { components } from '@/modules/http/generated/admin'
import {
  adminOperations,
  type AdminOperationInput,
} from '@/modules/http/generated/operations'
import type { DictOption, Id } from '@/types/common'

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

type NotificationTaskListQueryParams = NonNullable<AdminOperationInput<'get_api_admin_v1_notification_tasks'>['query']>

type NotificationTaskContractItem = components['schemas']['Go_internal_module_notification_task_ListItem_Output']
export interface NotificationTaskItem extends Omit<NotificationTaskContractItem, 'type' | 'level' | 'platform' | 'target_type' | 'status'> {
  type: NotificationType
  level: NotificationLevel
  platform: NotificationTaskPlatform
  target_type: NotificationTargetType
  status: NotificationTaskStatus
}
export interface NotificationTaskListResponse extends Omit<components['schemas']['Go_internal_module_notification_task_ListResponse_Output'], 'list'> {
  list: NotificationTaskItem[]
}

export type NotificationTaskAddParams = NonNullable<AdminOperationInput<'post_api_admin_v1_notification_tasks'>['body']>

export type NotificationTaskCreateResponse = components['schemas']['Go_internal_module_notification_task_CreateResponse_Output']

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

function isNotificationType(value: number): value is NotificationType {
  return value === 1 || value === 2 || value === 3 || value === 4
}

function isNotificationLevel(value: number): value is NotificationLevel {
  return value === 1 || value === 2
}

function isTargetType(value: number): value is NotificationTargetType {
  return value === 1 || value === 2 || value === 3
}

function isTaskStatus(value: number): value is NotificationTaskStatus {
  return value === 1 || value === 2 || value === 3 || value === 4
}

function isTaskPlatform(value: string): value is NotificationTaskPlatform {
  return value === 'all' || value === 'admin' || value === 'app'
}

function toNotificationTaskItem(item: NotificationTaskContractItem): NotificationTaskItem {
  if (
    !isNotificationType(item.type)
    || !isNotificationLevel(item.level)
    || !isTaskPlatform(item.platform)
    || !isTargetType(item.target_type)
    || !isTaskStatus(item.status)
  ) {
    throw new Error('notification task list item violates the contract')
  }
  return {
    ...item,
    type: item.type,
    level: item.level,
    platform: item.platform,
    target_type: item.target_type,
    status: item.status,
  }
}

const pageInit = async (options: ExecuteOptions = {}): Promise<NotificationTaskInitResponse> => {
  const response = await executeAdminOperation(adminOperations.get_api_admin_v1_notification_tasks_page_init, {}, options)
  const mapNumberOptions = <T extends number>(
    values: Array<{ label: string; value: number }>,
    validate: (value: number) => value is T,
    label: string,
  ): DictOption<T>[] => values.map((option) => {
    if (!validate(option.value)) throw new Error(`${label} dictionary violates the contract`)
    return { label: option.label, value: option.value }
  })
  const platforms = response.dict.platformArr.map((option) => {
    if (!isTaskPlatform(option.value)) throw new Error('notification platform dictionary violates the contract')
    return { label: option.label, value: option.value }
  })
  return {
    dict: {
      notification_type_arr: mapNumberOptions(response.dict.notification_type_arr, isNotificationType, 'notification type'),
      notification_level_arr: mapNumberOptions(response.dict.notification_level_arr, isNotificationLevel, 'notification level'),
      notification_target_type_arr: mapNumberOptions(response.dict.notification_target_type_arr, isTargetType, 'notification target type'),
      notification_task_status_arr: mapNumberOptions(response.dict.notification_task_status_arr, isTaskStatus, 'notification task status'),
      platformArr: platforms,
    },
  }
}
const create = (params: NotificationTaskAddParams, options: ExecuteOptions = {}): Promise<NotificationTaskCreateResponse> =>
  executeAdminOperation(adminOperations.post_api_admin_v1_notification_tasks, { body: params }, options)
const deleteOne = async (params: { id: Id }, options: ExecuteOptions = {}): Promise<void> => {
  await executeAdminOperation(adminOperations.delete_api_admin_v1_notification_tasks_id, {
    path: { id: normalizeTaskID(params.id) },
  }, options)
}

export const NotificationTaskApi = {
  pageInit,
  statusCount: async (params: Pick<NotificationTaskListParams, 'title'>, options: ExecuteOptions = {}): Promise<NotificationTaskStatusItem[]> => {
    const response = await executeAdminOperation(adminOperations.get_api_admin_v1_notification_tasks_status_count, {
      query: params,
    }, options)
    return response.map((item) => {
      if (!isTaskStatus(item.value)) throw new Error('notification task status count violates the contract')
      return { ...item, value: item.value }
    })
  },
  list: async (params: NotificationTaskListParams, options: ExecuteOptions = {}): Promise<NotificationTaskListResponse> => {
    const response = await executeAdminOperation(adminOperations.get_api_admin_v1_notification_tasks, {
      query: normalizeListParams(params),
    }, options)
    return { list: response.list.map(toNotificationTaskItem), page: response.page }
  },
  create,
  deleteOne,
  async cancel(params: { id: Id }, options: ExecuteOptions = {}): Promise<void> {
    await executeAdminOperation(adminOperations.patch_api_admin_v1_notification_tasks_id_cancel, {
      path: { id: normalizeTaskID(params.id) },
    }, options)
  },
}
