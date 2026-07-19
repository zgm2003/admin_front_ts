import { executeAdminOperation } from '@/lib/http'
import type { ExecuteOptions } from '@/modules/http/client'
import type { components } from '@/modules/http/generated/admin'
import {
  adminOperations,
  type AdminOperationInput,
} from '@/modules/http/generated/operations'
import type { DictOption } from '@/types/common'

export type CronPresetItem = DictOption<string>

export type CronTaskInitResponse = components['schemas']['Go_internal_module_crontask_InitResponse_Output']

export interface CronTaskListParams {
  current_page: number
  page_size: number
  title?: string
  name?: string
  status?: 1 | 2
}

type CronTaskContractItem = components['schemas']['Go_internal_module_crontask_ListItem_Output']
export type CronTaskItem = Omit<CronTaskContractItem, 'status'> & { status: 1 | 2 }
export interface CronTaskListResponse extends Omit<components['schemas']['Go_internal_module_crontask_ListResponse_Output'], 'list'> {
  list: CronTaskItem[]
}

type CronTaskBody = NonNullable<AdminOperationInput<'post_api_admin_v1_cron_tasks'>['body']>
export type CronTaskForm = CronTaskBody & { id?: number }

export interface CronTaskLogListParams {
  current_page: number
  page_size: number
  task_id: number
  status?: 1 | 2 | 3
  start_date?: string
  end_date?: string
}

export type CronTaskLogItem = components['schemas']['Go_internal_module_crontask_LogItem_Output']
export type CronTaskLogListResponse = components['schemas']['Go_internal_module_crontask_LogsResponse_Output']

type CronTaskListQuery = NonNullable<AdminOperationInput<'get_api_admin_v1_cron_tasks'>['query']>
type CronTaskLogQuery = NonNullable<AdminOperationInput<'get_api_admin_v1_cron_tasks_id_logs'>['query']>

function positiveID(id: number, label: string): number {
  if (!Number.isInteger(id) || id <= 0) throw new Error(`${label} id must be a positive integer`)
  return id
}

function positiveIDs(values: number[], label: string): [number, ...number[]] {
  const ids = [...new Set(values.map((id) => positiveID(id, label)))]
  const first = ids[0]
  if (first === undefined) throw new Error(`${label} ids must not be empty`)
  return [first, ...ids.slice(1)]
}

function cronTaskBody(params: CronTaskForm): CronTaskBody {
  return {
    name: params.name,
    title: params.title,
    description: params.description,
    cron: params.cron,
    cron_readable: params.cron_readable,
    handler: params.handler,
    status: params.status,
  }
}

function toCronTaskItem(item: CronTaskContractItem): CronTaskItem {
  if (item.status !== 1 && item.status !== 2) {
    throw new Error('cron task list item status violates the editable contract')
  }
  return { ...item, status: item.status }
}

const pageInit = (options: ExecuteOptions = {}): Promise<CronTaskInitResponse> =>
  executeAdminOperation(adminOperations.get_api_admin_v1_cron_tasks_page_init, {}, options)
const create = async (params: CronTaskForm, options: ExecuteOptions = {}): Promise<CronTaskItem> => {
  const response = await executeAdminOperation(adminOperations.post_api_admin_v1_cron_tasks, { body: cronTaskBody(params) }, options)
  return toCronTaskItem(response)
}
const update = async (params: CronTaskForm & { id: number }, options: ExecuteOptions = {}): Promise<void> => {
  await executeAdminOperation(adminOperations.put_api_admin_v1_cron_tasks_id, {
    path: { id: positiveID(params.id, 'cron task') },
    body: cronTaskBody(params),
  }, options)
}
const deleteOne = async (params: { id: number }, options: ExecuteOptions = {}): Promise<void> => {
  await executeAdminOperation(adminOperations.delete_api_admin_v1_cron_tasks_id, {
    path: { id: positiveID(params.id, 'cron task') },
  }, options)
}
const deleteBatch = async (params: { ids: number[] }, options: ExecuteOptions = {}): Promise<void> => {
  await executeAdminOperation(adminOperations.delete_api_admin_v1_cron_tasks, {
    body: { ids: positiveIDs(params.ids, 'cron task') },
  }, options)
}
const changeStatus = async (params: { id: number; status: 1 | 2 }, options: ExecuteOptions = {}): Promise<void> => {
  await executeAdminOperation(adminOperations.patch_api_admin_v1_cron_tasks_id_status, {
    path: { id: positiveID(params.id, 'cron task') },
    body: { status: params.status },
  }, options)
}

export const CronTaskApi = {
  pageInit,
  list: async (params: CronTaskListParams, options: ExecuteOptions = {}): Promise<CronTaskListResponse> => {
    const query: CronTaskListQuery = {
      current_page: params.current_page,
      page_size: params.page_size,
    }
    if (params.title) query.title = params.title
    if (params.name) query.name = params.name
    if (params.status !== undefined) query.status = params.status
    const response = await executeAdminOperation(adminOperations.get_api_admin_v1_cron_tasks, { query }, options)
    return { list: response.list.map(toCronTaskItem), page: response.page }
  },
  create,
  update,
  deleteOne,
  deleteBatch,
  changeStatus,
  logs: (params: CronTaskLogListParams, options: ExecuteOptions = {}): Promise<CronTaskLogListResponse> => {
    const query: CronTaskLogQuery = {
      current_page: params.current_page,
      page_size: params.page_size,
    }
    if (params.status !== undefined) query.status = params.status
    if (params.start_date) query.start_date = params.start_date
    if (params.end_date) query.end_date = params.end_date
    return executeAdminOperation(adminOperations.get_api_admin_v1_cron_tasks_id_logs, {
      path: { id: positiveID(params.task_id, 'cron task') },
      query,
    }, options)
  },
}
