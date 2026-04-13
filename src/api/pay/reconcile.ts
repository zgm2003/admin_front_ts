import request from '@/lib/http'
import type { DictOption, PaginatedResponse, RequestPayload } from '@/types/common'

export interface PayReconcileInitResponse {
  dict: {
    channel_arr: DictOption<number>[]
    reconcile_status_arr: DictOption<number>[]
    bill_type_arr: DictOption<number>[]
  }
}

export interface PayReconcileListParams extends RequestPayload {
  current_page?: number
  page_size?: number
  channel?: number | ''
  status?: number | ''
  bill_type?: number | ''
}

export interface PayReconcileTaskItem {
  id: number
  reconcile_date: string
  channel: number
  channel_text: string
  bill_type: number
  bill_type_text: string
  status: number
  status_text: string
  platform_count: number
  platform_amount: number
  local_count: number
  local_amount: number
  diff_count: number
  diff_amount: number
  started_at?: string | null
  finished_at?: string | null
  created_at: string
}

export interface PayReconcileDetailResponse {
  task: PayReconcileTaskItem & {
    channel_id: number
    platform_file_url: string
    local_file_url: string
    diff_file_url: string
    error_msg?: string
  }
}

export interface PayReconcileDownloadResponse {
  url: string
  filename: string
}

export const PayReconcileApi = {
  init: (params?: RequestPayload) => request.post<PayReconcileInitResponse>('/api/admin/PayReconcile/init', params),
  list: (params: PayReconcileListParams) => request.post<PaginatedResponse<PayReconcileTaskItem>>('/api/admin/PayReconcile/list', params),
  detail: (params: { id: number }) => request.post<PayReconcileDetailResponse>('/api/admin/PayReconcile/detail', params),
  retry: (params: { id: number }) => request.post<void>('/api/admin/PayReconcile/retry', params),
  download: (params: { id: number; type: 'platform' | 'local' | 'diff' }) => request.post<PayReconcileDownloadResponse>('/api/admin/PayReconcile/download', params),
}
