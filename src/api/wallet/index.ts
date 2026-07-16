import request from '@/lib/http'
import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'
import type { DictOption, PaginatedResponse } from '@/types/common'

export type WalletDirection = 'in' | 'out'
export type WalletSourceType = 'recharge' | 'ai_generate' | 'ai_refund'

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

export type WalletUsersPageInitResponse = Record<string, never>

export type WalletLedgerPageInitResponse = WalletDictResponse

const summary = () => request.get<WalletSummaryResponse>(`${ADMIN_API_PREFIX}/wallet/summary`)
const transactions = (params: WalletTransactionListParams) => request.get<PaginatedResponse<WalletTransactionItem>>(`${ADMIN_API_PREFIX}/wallet/transactions`, { params })
const walletUsersPageInit = () => request.get<WalletUsersPageInitResponse>(`${ADMIN_API_PREFIX}/payment/wallets/page-init`)
const walletUsersList = (params: WalletUserListParams) => request.get<PaginatedResponse<WalletUserItem>>(`${ADMIN_API_PREFIX}/payment/wallets`, { params })
const ledgerPageInit = () => request.get<WalletLedgerPageInitResponse>(`${ADMIN_API_PREFIX}/payment/ledger/page-init`)
const ledgerList = (params: WalletTransactionListParams) => request.get<PaginatedResponse<WalletTransactionItem>>(`${ADMIN_API_PREFIX}/payment/ledger`, { params })

export const WalletApi = {
  summary,
  transactions,
  walletUsersPageInit,
  walletUsersList,
  ledgerPageInit,
  ledgerList,

  // Temporary aliases for existing callers during RESTful naming migration.
  usersInit: walletUsersPageInit,
  users: walletUsersList,
  ledgerInit: ledgerPageInit,
  ledger: ledgerList,
}
