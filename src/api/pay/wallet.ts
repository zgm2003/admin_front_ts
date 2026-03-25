import request from '@/utils/request'

export const UserWalletApi = {
  init: (params?: any) => request.post('/api/admin/UserWallet/init', params),
  list: (params: any) => request.post('/api/admin/UserWallet/list', params),
  transactions: (params: any) => request.post('/api/admin/UserWallet/transactions', params),
  adjust: (params: any) => request.post('/api/admin/UserWallet/adjust', params),
}
