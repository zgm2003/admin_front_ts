import request from '@/lib/http'
import type { DictOption, PaginatedResponse, RequestPayload } from '@/types/common'

export interface PayNotifyLogInitResponse {
  dict: {
    channel_arr: DictOption<number>[]
    notify_type_arr: DictOption<number>[]
    notify_process_status_arr: DictOption<number>[]
  }
}

export interface PayNotifyLogListParams extends RequestPayload {
  current_page?: number
  page_size?: number
  transaction_no?: string
  channel?: number | ''
  notify_type?: number | ''
  process_status?: number | ''
}

export interface PayNotifyLogItem {
  id: number
  channel: number
  channel_text: string
  notify_type: number
  notify_type_text: string
  transaction_no: string
  trade_no: string
  process_status: number
  process_status_text: string
  process_msg: string
  ip: string
  created_at: string
}

export interface PayNotifyLogDetailResponse {
  log: {
    id: number
    channel: number
    channel_text: string
    notify_type: number
    notify_type_text: string
    transaction_no: string
    trade_no: string
    process_status: number
    process_status_text: string
    process_msg: string
    headers: Record<string, unknown>
    raw_data: Record<string, unknown>
    ip: string
    created_at: string
    updated_at: string
  }
}

export const PayNotifyLogApi = {
  init: (params?: RequestPayload) => request.post<PayNotifyLogInitResponse>('/api/admin/PayNotifyLog/init', params),
  list: (params: PayNotifyLogListParams) => request.post<PaginatedResponse<PayNotifyLogItem>>('/api/admin/PayNotifyLog/list', params),
  detail: (params: { id: number }) => request.post<PayNotifyLogDetailResponse>('/api/admin/PayNotifyLog/detail', params),
}
