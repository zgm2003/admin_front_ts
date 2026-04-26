import request from '@/lib/http'
import type { Id, PaginatedResponse, RequestPayload } from '@/types/common'

export interface OperationLogItem {
  id: Id
  user_name: string
  user_email: string
  action: string
  request_data: string | null
  response_data: string | null
  is_success: number
  created_at: string
}

export interface OperationLogListParams extends RequestPayload {
  current_page: number
  page_size: number
  user_id?: Id | ''
  action?: string
  date?: string[]
}

export const OperationLogApi = {
  init: (params?: RequestPayload) => request.post<void>('/api/admin/OperationLog/init', params),
  list: (params: OperationLogListParams) =>
    request.post<PaginatedResponse<OperationLogItem>>('/api/admin/OperationLog/list', params),
  del: (params: { id: Id | Id[] }) => request.post<void>('/api/admin/OperationLog/del', params)
}
