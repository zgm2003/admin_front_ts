import { executeAdminOperation } from '@/lib/http'
import type { ExecuteOptions } from '@/modules/http/client'
import {
  adminOperations,
  type AdminOperationInput,
} from '@/modules/http/generated/operations'
import type { Id } from '@/types/common'
import type {
  OperationLogFilters,
  OperationLogInitResponse,
  OperationLogItem,
  OperationLogListParams,
  OperationLogListResponse,
} from '@/types/operationLog'

function normalizeUserId(userId: OperationLogFilters['user_id']): number | undefined {
  if (userId === undefined || userId === '') return undefined
  if (typeof userId !== 'number' || !Number.isInteger(userId) || userId <= 0) {
    throw new Error('operation log user id must be a positive integer')
  }
  return userId
}

function normalizeDateRange(date: OperationLogFilters['date']): string | undefined {
  if (!Array.isArray(date) || date.length < 2) {
    return undefined
  }

  const [start, end] = date
  const normalizedStart = start?.trim()
  const normalizedEnd = end?.trim()
  if (!normalizedStart || !normalizedEnd) {
    return undefined
  }

  return `${normalizedStart},${normalizedEnd}`
}

function normalizeOperationLogListParams(params: OperationLogListParams) {
  const query: NonNullable<AdminOperationInput<'get_api_admin_v1_operation_logs'>['query']> = {
    current_page: params.current_page,
    page_size: params.page_size,
  }

  const userId = normalizeUserId(params.user_id)
  if (userId !== undefined) {
    query.user_id = userId
  }

  const action = params.action?.trim()
  if (action) {
    query.action = action
  }

  const date = normalizeDateRange(params.date)
  if (date) {
    query.date = date
  }

  return query
}

function normalizeIds(id: Id | Id[]): [number, ...number[]] {
  const values = Array.isArray(id) ? id : [id]
  const ids: number[] = []
  const seen = new Set<number>()

  for (const value of values) {
    if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
      throw new Error('operation log id must be a positive integer')
    }
    if (seen.has(value)) {
      continue
    }
    seen.add(value)
    ids.push(value)
  }

  const first = ids[0]
  if (first === undefined) throw new Error('operation log ids must not be empty')
  return [first, ...ids.slice(1)]
}

const pageInit = (options: ExecuteOptions = {}): Promise<OperationLogInitResponse> =>
  executeAdminOperation(adminOperations.get_api_admin_v1_operation_logs_page_init, {}, options)
const deleteOne = async (params: { id: Id }, options: ExecuteOptions = {}): Promise<void> => {
  const [id] = normalizeIds(params.id)
  await executeAdminOperation(adminOperations.delete_api_admin_v1_operation_logs_id, { path: { id } }, options)
}
const deleteBatch = async (params: { ids: Id[] }, options: ExecuteOptions = {}): Promise<void> => {
  await executeAdminOperation(adminOperations.delete_api_admin_v1_operation_logs, {
    body: { ids: normalizeIds(params.ids) },
  }, options)
}

export const OperationLogApi = {
  pageInit,
  list: (params: OperationLogListParams, options: ExecuteOptions = {}): Promise<OperationLogListResponse> =>
    executeAdminOperation(adminOperations.get_api_admin_v1_operation_logs, {
      query: normalizeOperationLogListParams(params),
    }, options),
  deleteOne,
  deleteBatch,
}

export type OperationLogApiType = typeof OperationLogApi
export type { OperationLogItem, OperationLogListParams, OperationLogListResponse }
