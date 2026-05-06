import request from '@/lib/http'
import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'
import type { DictOption, PaginatedResponse } from '@/types/common'

export interface WalletListParams {
  current_page: number
  page_size: number
  user_id?: number | ''
  start_date?: string
  end_date?: string
}

interface WalletListQueryParams {
  current_page: number
  page_size: number
  user_id?: number
  start_date?: string
  end_date?: string
}

export interface WalletTransactionsParams extends WalletListParams {
  type?: number | ''
}

interface WalletTransactionsQueryParams extends WalletListQueryParams {
  type?: number
}

export interface WalletPageInitResponse {
  dict: {
    wallet_type_arr: DictOption<number>[]
    wallet_source_arr: DictOption<number>[]
  }
}

export interface WalletListItem {
  id: number
  user_id: number
  user_name: string
  user_email: string
  balance: number
  frozen: number
  total_recharge: number
  total_consume: number
  created_at: string
}

export interface WalletTransactionItem {
  id: number
  user_id: number
  user_name: string
  user_email: string
  biz_action_no: string
  type: number
  type_text: string
  available_delta: number
  frozen_delta: number
  balance_before: number
  balance_after: number
  order_no: string
  title: string
  remark: string
  created_at: string
}

export interface WalletAdjustmentCreatePayload {
  user_id: number
  delta: number
  reason: string
  idempotency_key: string
}

export interface WalletAdjustmentCreateResponse {
  transaction_id: number
  biz_action_no: string
  balance_before: number
  balance_after: number
}

function trimOptional(value: string | undefined): string | undefined {
  const next = value?.trim()
  return next ? next : undefined
}

function normalizeListParams(params: WalletListParams): WalletListQueryParams {
  const query: WalletListQueryParams = {
    current_page: params.current_page,
    page_size: params.page_size,
  }

  if (typeof params.user_id === 'number') {
    query.user_id = params.user_id
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

function normalizeTransactionParams(params: WalletTransactionsParams): WalletTransactionsQueryParams {
  const query: WalletTransactionsQueryParams = normalizeListParams(params)
  if (typeof params.type === 'number') {
    query.type = params.type
  }
  return query
}

export const WalletApi = {
  pageInit: () => request.get<WalletPageInitResponse>(`${ADMIN_API_PREFIX}/wallets/page-init`),
  list: (params: WalletListParams) => request.get<PaginatedResponse<WalletListItem>>(`${ADMIN_API_PREFIX}/wallets`, { params: normalizeListParams(params) }),
  transactions: (params: WalletTransactionsParams) => request.get<PaginatedResponse<WalletTransactionItem>>(`${ADMIN_API_PREFIX}/wallet-transactions`, { params: normalizeTransactionParams(params) }),
}

export const WalletAdjustmentApi = {
  create: (payload: WalletAdjustmentCreatePayload) =>
    request.post<WalletAdjustmentCreateResponse, WalletAdjustmentCreatePayload>(`${ADMIN_API_PREFIX}/wallet-adjustments`, payload),
}
