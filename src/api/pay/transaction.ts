import { legacyRequest } from '@/lib/http'
import type { DictOption, PaginatedResponse, RequestPayload } from '@/types/common'

export interface PayTransactionInitResponse {
  dict: {
    channel_arr: DictOption<number>[]
    txn_status_arr: DictOption<number>[]
  }
}

export interface PayTransactionListParams extends RequestPayload {
  current_page?: number
  page_size?: number
  order_no?: string
  transaction_no?: string
  user_id?: number | ''
  channel?: number | ''
  status?: number | ''
}

export interface PayTransactionItem {
  id: number
  transaction_no: string
  order_no: string
  user_id: number
  user_name: string
  user_email: string
  attempt_no: number
  channel: number
  channel_text: string
  pay_method: string
  amount: number
  trade_no?: string | null
  trade_status?: string | null
  status: number
  status_text: string
  paid_at?: string | null
  created_at: string
}

export interface PayTransactionDetailResponse {
  transaction: {
    id: number
    transaction_no: string
    order_no: string
    attempt_no: number
    channel: number
    pay_method: string
    amount: number
    trade_no?: string | null
    trade_status?: string | null
    status: number
    status_text: string
    paid_at?: string | null
    closed_at?: string | null
    channel_resp: Record<string, unknown>
    raw_notify: Record<string, unknown>
    created_at: string
  }
  channel: {
    id: number
    name: string
    channel: number
  } | null
  order: {
    id: number
    order_no: string
    user_id: number
    user_name: string
    user_email: string
    title: string
    pay_amount: number
    pay_status: number
  } | null
}

export const PayTransactionApi = {
  init: (params?: RequestPayload) => legacyRequest.post<PayTransactionInitResponse>('/api/admin/PayTransaction/init', params),
  list: (params: PayTransactionListParams) => legacyRequest.post<PaginatedResponse<PayTransactionItem>>('/api/admin/PayTransaction/list', params),
  detail: (params: { id: number }) => legacyRequest.post<PayTransactionDetailResponse>('/api/admin/PayTransaction/detail', params),
}
