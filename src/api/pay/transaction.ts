import request from '@/lib/http'
import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'
import type { DictOption, PaginatedResponse } from '@/types/common'

export interface PayTransactionInitResponse {
  dict: {
    channel_arr: DictOption<number>[]
    txn_status_arr: DictOption<number>[]
  }
}

export interface PayTransactionListParams {
  current_page: number
  page_size: number
  order_no?: string
  transaction_no?: string
  user_id?: number | ''
  channel?: number | ''
  status?: number | ''
  start_date?: string
  end_date?: string
}

interface PayTransactionListQueryParams {
  current_page: number
  page_size: number
  order_no?: string
  transaction_no?: string
  user_id?: number
  channel?: number
  status?: number
  start_date?: string
  end_date?: string
}

export interface PayTransactionItem {
  id: number
  transaction_no: string
  order_no: string
  user_id: number
  user_name: string
  user_email: string
  attempt_no: number
  channel_id: number
  channel: number
  channel_text: string
  pay_method: string
  pay_method_text: string
  amount: number
  trade_no: string
  trade_status: string
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
    channel_id: number
    channel: number
    channel_text: string
    pay_method: string
    pay_method_text: string
    amount: number
    trade_no: string
    trade_status: string
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

function trimOptional(value: string | undefined): string | undefined {
  const next = value?.trim()
  return next ? next : undefined
}

function normalizeListParams(params: PayTransactionListParams): PayTransactionListQueryParams {
  const query: PayTransactionListQueryParams = {
    current_page: params.current_page,
    page_size: params.page_size,
  }

  const orderNo = trimOptional(params.order_no)
  if (orderNo) {
    query.order_no = orderNo
  }
  const transactionNo = trimOptional(params.transaction_no)
  if (transactionNo) {
    query.transaction_no = transactionNo
  }
  if (typeof params.user_id === 'number') {
    query.user_id = params.user_id
  }
  if (typeof params.channel === 'number') {
    query.channel = params.channel
  }
  if (typeof params.status === 'number') {
    query.status = params.status
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

export const PayTransactionApi = {
  init: () => request.get<PayTransactionInitResponse>(`${ADMIN_API_PREFIX}/pay-transactions/page-init`),
  list: (params: PayTransactionListParams) => request.get<PaginatedResponse<PayTransactionItem>>(`${ADMIN_API_PREFIX}/pay-transactions`, { params: normalizeListParams(params) }),
  detail: (params: { id: number }) => request.get<PayTransactionDetailResponse>(`${ADMIN_API_PREFIX}/pay-transactions/${params.id}`),
}
