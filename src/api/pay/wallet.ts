import request from '@/lib/http'
import type { DictOption, PaginatedResponse, RequestPayload } from '@/types/common'

export interface UserWalletListParams {
  current_page?: number
  page_size?: number
  user_id?: number | ''
  start_date?: string
  end_date?: string
}

export interface WalletTransactionsParams extends UserWalletListParams {
  type?: number | ''
}

export interface WalletAdjustParams {
  user_id: number
  delta: number
  reason?: string
}

export interface UserWalletInitResponse {
  dict: {
    wallet_type_arr: DictOption<number>[]
    wallet_source_arr: DictOption<number>[]
  }
}

export interface UserWalletListItem {
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
  order_no?: string
  title: string
  remark?: string
  created_at: string
}

export const UserWalletApi = {
  init: (params?: RequestPayload) => request.post<UserWalletInitResponse>('/api/admin/UserWallet/init', params),
  list: (params: UserWalletListParams) => request.post<PaginatedResponse<UserWalletListItem>>('/api/admin/UserWallet/list', params),
  transactions: (params: WalletTransactionsParams) => request.post<PaginatedResponse<WalletTransactionItem>>('/api/admin/UserWallet/transactions', params),
  adjust: (params: WalletAdjustParams) => request.post<void>('/api/admin/UserWallet/adjust', params),
}
