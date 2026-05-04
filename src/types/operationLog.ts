import type { Id, PaginatedResponse } from './common'

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

export interface OperationLogFilters {
  user_id?: Id | ''
  action?: string
  date?: string[]
}

export interface OperationLogListParams extends OperationLogFilters {
  current_page: number
  page_size: number
}

export type OperationLogListResponse = PaginatedResponse<OperationLogItem>

export interface OperationLogInitResponse {
  [key: string]: never
}
