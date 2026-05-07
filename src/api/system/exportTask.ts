import request from '@/lib/http'
import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'
import type { Id, PaginatedResponse, RequestPayload } from '@/types/common'

export interface ExportTaskStatusItem {
  label: string
  value: number
  num: number
}

export interface ExportTaskListParams extends RequestPayload {
  current_page?: number
  page_size?: number
  status?: number | ''
  title?: string
  file_name?: string
}

export interface ExportTaskItem {
  id: number
  title: string
  file_name?: string | null
  file_url?: string | null
  file_size_text: string
  row_count?: number | null
  status: number
  status_text: string
  error_msg?: string | null
  expire_at?: string | null
  created_at: string
}

function normalizePositiveIDs(id: Id | Id[], label: string): number[] {
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

  return ids
}

export const ExportTaskApi = {
  statusCount: (params: Pick<ExportTaskListParams, 'title' | 'file_name'>) =>
    request.get<ExportTaskStatusItem[]>(`${ADMIN_API_PREFIX}/export-tasks/status-count`, { params }),

  list: (params: ExportTaskListParams) =>
    request.get<PaginatedResponse<ExportTaskItem>>(`${ADMIN_API_PREFIX}/export-tasks`, { params }),

  del: (params: { id: Id | Id[] }) => {
    const ids = normalizePositiveIDs(params.id, 'export task')
    if (ids.length === 1) {
      return request.delete<void>(`${ADMIN_API_PREFIX}/export-tasks/${ids[0]}`)
    }
    return request.delete<void, { ids: number[] }>(`${ADMIN_API_PREFIX}/export-tasks`, { data: { ids } })
  },
}
