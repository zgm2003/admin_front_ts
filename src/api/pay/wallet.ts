import request from '@/utils/request'

export interface UserWalletListParams {
  page?: number
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

export const UserWalletApi = {
  init: (params?: any) => request.post('/api/admin/UserWallet/init', params),
  list: (params: UserWalletListParams) => request.post('/api/admin/UserWallet/list', params),
  transactions: (params: WalletTransactionsParams) => request.post('/api/admin/UserWallet/transactions', params),
  adjust: (params: WalletAdjustParams) => request.post('/api/admin/UserWallet/adjust', params),
}
