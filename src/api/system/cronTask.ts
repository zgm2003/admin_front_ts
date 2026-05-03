import { legacyRequest } from '@/lib/http'
import type { DictOption, PaginatedResponse } from '@/types/common'

export type CronPresetItem = DictOption<string>

export interface CronTaskInitResponse {
  dict: {
    cron_preset_arr: CronPresetItem[]
  }
}

export interface CronTaskListParams {
  current_page?: number
  page_size?: number
  title?: string
}

export interface CronTaskItem {
  id: number
  name: string
  title: string
  description: string
  cron: string
  cron_readable: string
  handler: string
  status: number
  status_name: string
  next_run_time: string
  created_at: string
  updated_at: string
}

export interface CronTaskForm {
  id?: number
  name: string
  title: string
  description?: string
  cron: string
  cron_readable?: string
  handler: string
  status: number
}

export interface CronTaskLogListParams {
  current_page: number
  page_size: number
  task_id: number
  date?: string[]
}

export interface CronTaskLogItem {
  id: number
  task_id: number
  task_name: string
  start_time?: string | null
  end_time?: string | null
  duration_ms?: number | null
  status: number
  status_name: string
  result?: string | null
  error_msg?: string | null
  created_at: string
}

export const CronTaskApi = {
  init: () => legacyRequest.post<CronTaskInitResponse>('/api/admin/CronTask/init'),
  list: (params?: CronTaskListParams) => legacyRequest.post<PaginatedResponse<CronTaskItem>>('/api/admin/CronTask/list', params),
  add: (params: CronTaskForm) => legacyRequest.post<void>('/api/admin/CronTask/add', params),
  edit: (params: CronTaskForm) => legacyRequest.post<void>('/api/admin/CronTask/edit', params),
  del: (params: { id: number | number[] }) => legacyRequest.post<void>('/api/admin/CronTask/del', params),
  status: (params: { id: number; status: number }) => legacyRequest.post<void>('/api/admin/CronTask/status', params),
  logs: (params: CronTaskLogListParams) => legacyRequest.post<PaginatedResponse<CronTaskLogItem>>('/api/admin/CronTask/logs', params),
}
