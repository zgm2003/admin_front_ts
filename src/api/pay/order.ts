import request from '@/utils/request'

export const OrderApi = {
  init: (params?: any) => request.post('/api/admin/PayOrder/init', params),
  list: (params: any) => request.post('/api/admin/PayOrder/list', params),
  detail: (params: any) => request.post('/api/admin/PayOrder/detail', params),
  statusCount: (params?: any) => request.post('/api/admin/PayOrder/statusCount', params),
  close: (params: any) => request.post('/api/admin/PayOrder/close', params),
  remark: (params: any) => request.post('/api/admin/PayOrder/remark', params),
  recharge: (params: any) => request.post('/api/admin/pay/recharge', params),
  createPay: (params: any) => request.post('/api/admin/pay/createPay', params),
  queryResult: (params: any) => request.post('/api/admin/pay/queryResult', params),
  orderDetail: (params: any) => request.post('/api/admin/pay/orderDetail', params),
  walletInfo: (params: any) => request.post('/api/admin/pay/walletInfo', params),
  walletBills: (params: any) => request.post('/api/admin/pay/walletBills', params),
}
