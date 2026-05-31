import request from '@/lib/http'
import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'
import type { Id } from '@/types/common'
import type {
  OperationLogFilters,
  OperationLogInitResponse,
  OperationLogItem,
  OperationLogListParams,
  OperationLogListResponse,
} from '@/types/operationLog'

function normalizeUserId(userId: OperationLogFilters['user_id']): number | undefined {
  if (typeof userId === 'number' && Number.isInteger(userId) && userId > 0) {
    return userId
  }
  if (typeof userId === 'string') {
    const trimmed = userId.trim()
    if (!trimmed) {
      return undefined
    }
    const parsed = Number(trimmed)
    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed
    }
  }
  return undefined
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
  const query: {
    current_page: number
    page_size: number
    user_id?: number
    action?: string
    date?: string
  } = {
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

function normalizeIds(id: Id | Id[]): number[] {
  const values = Array.isArray(id) ? id : [id]
  const ids: number[] = []
  const seen = new Set<number>()

  for (const value of values) {
    if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
      continue
    }
    if (seen.has(value)) {
      continue
    }
    seen.add(value)
    ids.push(value)
  }

  return ids
}

const BASE = `${ADMIN_API_PREFIX}/operation-logs`

const pageInit = () => request.get<OperationLogInitResponse>(`${BASE}/page-init`)
const deleteOne = (params: { id: Id }) => request.delete<void>(`${BASE}/${normalizeIds(params.id)[0]}`)
const deleteBatch = (params: { ids: Id[] }) => request.delete<void, { ids: number[] }>(BASE, { data: { ids: normalizeIds(params.ids) } })

export const OperationLogApi = {
  pageInit,
  list: (params: OperationLogListParams) =>
    request.get<OperationLogListResponse>(BASE, { params: normalizeOperationLogListParams(params) }),
  deleteOne,
  deleteBatch,
}

export type OperationLogApiType = typeof OperationLogApi
export type { OperationLogItem, OperationLogListParams, OperationLogListResponse }
