import request from '@/lib/http'
import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'
import type { DictOption, PaginatedResponse } from '@/types/common'

export type WalletDirection = 'in' | 'out'
export type WalletSourceType = 'recharge' | 'consume'

export interface WalletSummaryResponse {
  balance_cents: number
  balance_text: string
  total_recharge_cents: number
  total_recharge_text: string
  total_consume_cents: number
  total_consume_text: string
}

export interface WalletTransactionItem {
  id: number
  transaction_no: string
  user_id: number
  username: string
  account: string
  direction: WalletDirection
  direction_text: string
  amount_cents: number
  amount_text: string
  balance_before_cents: number
  balance_before_text: string
  balance_after_cents: number
  balance_after_text: string
  source_type: WalletSourceType
  source_type_text: string
  source_id: number
  remark: string
  created_at: string
}

export interface WalletTransactionListParams {
  current_page: number
  page_size: number
  user_id?: number
  keyword?: string
  direction?: WalletDirection | ''
  source_type?: WalletSourceType | ''
  date_start?: string
  date_end?: string
}

export interface WalletUserItem {
  id: number
  wallet_id: number
  user_id: number
  username: string
  account: string
  balance_cents: number
  balance_text: string
  total_recharge_cents: number
  total_recharge_text: string
  total_consume_cents: number
  total_consume_text: string
  updated_at: string
}

export interface WalletUserListParams {
  current_page: number
  page_size: number
  keyword?: string
  user_id?: number
}

export interface WalletDictResponse {
  dict: {
    direction_arr: DictOption<WalletDirection>[]
    source_type_arr: DictOption<WalletSourceType>[]
  }
}

export interface WalletUsersPageInitResponse {}

export interface WalletLedgerPageInitResponse extends WalletDictResponse {}

export interface WalletConsumePayload {
  amount_cents: number
  source_id: number
  remark?: string
}

export interface WalletConsumeResponse {
  transaction: WalletTransactionItem
  wallet: WalletSummaryResponse
}

export const WalletApi = {
  summary: () => request.get<WalletSummaryResponse>(`${ADMIN_API_PREFIX}/wallet/summary`),
  transactions: (params: WalletTransactionListParams) => request.get<PaginatedResponse<WalletTransactionItem>>(`${ADMIN_API_PREFIX}/wallet/transactions`, { params }),
  consume: (payload: WalletConsumePayload) => request.post<WalletConsumeResponse, WalletConsumePayload>(`${ADMIN_API_PREFIX}/wallet/consumptions`, payload),
  usersInit: () => request.get<WalletUsersPageInitResponse>(`${ADMIN_API_PREFIX}/wallet/users/page-init`),
  users: (params: WalletUserListParams) => request.get<PaginatedResponse<WalletUserItem>>(`${ADMIN_API_PREFIX}/wallet/users`, { params }),
  ledgerInit: () => request.get<WalletLedgerPageInitResponse>(`${ADMIN_API_PREFIX}/wallet/ledger/page-init`),
  ledger: (params: WalletTransactionListParams) => request.get<PaginatedResponse<WalletTransactionItem>>(`${ADMIN_API_PREFIX}/wallet/ledger`, { params }),
}
