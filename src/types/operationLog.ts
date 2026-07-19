import type { components } from '@/modules/http/generated/admin'

export type OperationLogItem = components['schemas']['Go_internal_module_operationlog_ListItem_Output']

export interface OperationLogFilters {
  user_id?: number | ''
  action?: string
  date?: string[]
}

export interface OperationLogListParams extends OperationLogFilters {
  current_page: number
  page_size: number
}

export type OperationLogListResponse = components['schemas']['Go_internal_module_operationlog_ListResponse_Output']

export type OperationLogInitResponse = components['schemas']['Go_internal_module_operationlog_InitResponse_Output']
