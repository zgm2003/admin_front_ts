import request from '@/lib/http'
import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'
import type { DictOption, PaginatedResponse } from '@/types/common'

export type CronPresetItem = DictOption<string>

export interface CronTaskInitResponse {
  dict: {
    cron_preset_arr: CronPresetItem[]
    cron_task_status_arr: DictOption<number>[]
    cron_task_log_status_arr: DictOption<number>[]
  }
}

export interface CronTaskListParams {
  current_page?: number
  page_size?: number
  title?: string
  name?: string
  status?: number
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

export interface CronTaskStatusBody {
  status: number
}

export interface CronTaskLogListParams {
  current_page: number
  page_size: number
  task_id: number
  status?: number
  start_date?: string
  end_date?: string
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
  init: () => request.get<CronTaskInitResponse>(`${ADMIN_API_PREFIX}/cron-tasks/init`),
  list: (params?: CronTaskListParams) => request.get<PaginatedResponse<CronTaskItem>>(`${ADMIN_API_PREFIX}/cron-tasks`, { params }),
  add: (params: CronTaskForm) => request.post<CronTaskItem, CronTaskForm>(`${ADMIN_API_PREFIX}/cron-tasks`, params),
  edit: (params: CronTaskForm & { id: number }) => request.put<void, CronTaskForm>(`${ADMIN_API_PREFIX}/cron-tasks/${params.id}`, params),
  del: (params: { id: number | number[] }) => Array.isArray(params.id)
    ? request.delete<void, { ids: number[] }>(`${ADMIN_API_PREFIX}/cron-tasks`, { data: { ids: params.id } })
    : request.delete<void>(`${ADMIN_API_PREFIX}/cron-tasks/${params.id}`),
  status: (params: { id: number; status: number }) => request.patch<void, CronTaskStatusBody>(`${ADMIN_API_PREFIX}/cron-tasks/${params.id}/status`, { status: params.status }),
  logs: (params: CronTaskLogListParams) => request.get<PaginatedResponse<CronTaskLogItem>>(`${ADMIN_API_PREFIX}/cron-tasks/${params.task_id}/logs`, { params }),
}
