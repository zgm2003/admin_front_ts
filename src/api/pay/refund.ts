import request from '@/utils/request'

export const PayRefundApi = {
  init: (params?: any) => request.post('/api/admin/PayRefund/init', params),
  list: (params: any) => request.post('/api/admin/PayRefund/list', params),
  detail: (params: any) => request.post('/api/admin/PayRefund/detail', params),
  apply: (params: any) => request.post('/api/admin/PayRefund/apply', params),
}
