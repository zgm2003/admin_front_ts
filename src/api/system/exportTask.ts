import { executeAdminOperation } from '@/lib/http'
import type { ExecuteOptions } from '@/modules/http/client'
import type { components } from '@/modules/http/generated/admin'
import {
  adminOperations,
  type AdminOperationInput,
} from '@/modules/http/generated/operations'
import type { Id } from '@/types/common'

export type ExportTaskStatusItem = components['schemas']['ExportTaskStatusCountItem']

export interface ExportTaskListParams {
  current_page?: number
  page_size?: number
  before_id?: number
  status?: 1 | 2 | 3 | ''
  kind?: string
  title?: string
  file_name?: string
}

export type ExportTaskItem = components['schemas']['ExportTaskItem']
export type ExportTaskListResponse = components['schemas']['ExportTaskListResult']
type ExportTaskListQuery = NonNullable<AdminOperationInput<'get_api_admin_v1_export_tasks'>['query']>
type ExportTaskStatusQuery = NonNullable<AdminOperationInput<'get_api_admin_v1_export_tasks_status_count'>['query']>

function normalizePositiveIDs(id: Id | Id[], label: string): [number, ...number[]] {
  const values = Array.isArray(id) ? id : [id]
  const ids: number[] = []
  const seen = new Set<number>()

  for (const value of values) {
    if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
      throw new Error(`${label} id must be a positive integer`)
    }
    if (seen.has(value)) {
      continue
    }
    seen.add(value)
    ids.push(value)
  }

  const first = ids[0]
  if (first === undefined) throw new Error(`${label} ids must not be empty`)

  return [first, ...ids.slice(1)]
}

function normalizeListParams(params: ExportTaskListParams): ExportTaskListQuery {
  const query: ExportTaskListQuery = {}
  if (params.current_page !== undefined) query.current_page = params.current_page
  if (params.page_size !== undefined) query.page_size = params.page_size
  if (params.before_id !== undefined) query.before_id = params.before_id
  if (params.status !== '' && params.status !== undefined) query.status = params.status
  if (params.kind) query.kind = params.kind
  if (params.title) query.title = params.title
  if (params.file_name) query.file_name = params.file_name
  return query
}

function normalizeStatusParams(
  params: Pick<ExportTaskListParams, 'kind' | 'title' | 'file_name'>,
): ExportTaskStatusQuery {
  const query: ExportTaskStatusQuery = {}
  if (params.kind) query.kind = params.kind
  if (params.title) query.title = params.title
  if (params.file_name) query.file_name = params.file_name
  return query
}

export const ExportTaskApi = {
  statusCount: (
    params: Pick<ExportTaskListParams, 'kind' | 'title' | 'file_name'>,
    options: ExecuteOptions = {},
  ): Promise<ExportTaskStatusItem[]> => executeAdminOperation(
    adminOperations.get_api_admin_v1_export_tasks_status_count,
    { query: normalizeStatusParams(params) },
    options,
  ),

  list: (params: ExportTaskListParams, options: ExecuteOptions = {}): Promise<ExportTaskListResponse> =>
    executeAdminOperation(adminOperations.get_api_admin_v1_export_tasks, {
      query: normalizeListParams(params),
    }, options),

  async deleteOne(params: { id: Id }, options: ExecuteOptions = {}): Promise<void> {
    const [id] = normalizePositiveIDs(params.id, 'export task')
    await executeAdminOperation(adminOperations.delete_api_admin_v1_export_tasks_id, {
      path: { id },
    }, options)
  },

  async deleteBatch(params: { ids: Id[] }, options: ExecuteOptions = {}): Promise<void> {
    const ids = normalizePositiveIDs(params.ids, 'export task')
    await executeAdminOperation(adminOperations.delete_api_admin_v1_export_tasks, {
      body: { ids },
    }, options)
  },
}
