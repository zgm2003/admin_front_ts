import request from '@/lib/http'
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

export const ExportTaskApi = {
  statusCount: (params: Pick<ExportTaskListParams, 'title' | 'file_name'>) => request.post<ExportTaskStatusItem[]>('/api/admin/ExportTask/statusCount', params),
  list: (params: ExportTaskListParams) => request.post<PaginatedResponse<ExportTaskItem>>('/api/admin/ExportTask/list', params),
  del: (params: { id: Id | Id[] }) => request.post<void>('/api/admin/ExportTask/del', params),
}
