import request from '@/lib/http'
import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'
import type { DictOption, PaginatedResponse } from '@/types/common'

export interface PayNotifyLogInitResponse {
  dict: {
    channel_arr: DictOption<number>[]
    notify_type_arr: DictOption<number>[]
    notify_process_status_arr: DictOption<number>[]
  }
}

export interface PayNotifyLogListParams {
  current_page: number
  page_size: number
  transaction_no?: string
  channel?: number | ''
  notify_type?: number | ''
  process_status?: number | ''
  start_date?: string
  end_date?: string
}

interface PayNotifyLogListQueryParams {
  current_page: number
  page_size: number
  transaction_no?: string
  channel?: number
  notify_type?: number
  process_status?: number
  start_date?: string
  end_date?: string
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

function trimOptional(value: string | undefined): string | undefined {
  const next = value?.trim()
  return next ? next : undefined
}

function normalizeListParams(params: PayNotifyLogListParams): PayNotifyLogListQueryParams {
  const query: PayNotifyLogListQueryParams = {
    current_page: params.current_page,
    page_size: params.page_size,
  }

  const transactionNo = trimOptional(params.transaction_no)
  if (transactionNo) {
    query.transaction_no = transactionNo
  }
  if (typeof params.channel === 'number') {
    query.channel = params.channel
  }
  if (typeof params.notify_type === 'number') {
    query.notify_type = params.notify_type
  }
  if (typeof params.process_status === 'number') {
    query.process_status = params.process_status
  }
  const startDate = trimOptional(params.start_date)
  if (startDate) {
    query.start_date = startDate
  }
  const endDate = trimOptional(params.end_date)
  if (endDate) {
    query.end_date = endDate
  }

  return query
}

export const PayNotifyLogApi = {
  init: () => request.get<PayNotifyLogInitResponse>(`${ADMIN_API_PREFIX}/pay-notify-logs/page-init`),
  list: (params: PayNotifyLogListParams) => request.get<PaginatedResponse<PayNotifyLogItem>>(`${ADMIN_API_PREFIX}/pay-notify-logs`, { params: normalizeListParams(params) }),
  detail: (params: { id: number }) => request.get<PayNotifyLogDetailResponse>(`${ADMIN_API_PREFIX}/pay-notify-logs/${params.id}`),
}
