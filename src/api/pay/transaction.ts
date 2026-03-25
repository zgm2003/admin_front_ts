import request from '@/utils/request'

export const PayTransactionApi = {
  init: (params?: any) => request.post('/api/admin/PayTransaction/init', params),
  list: (params: any) => request.post('/api/admin/PayTransaction/list', params),
  detail: (params: any) => request.post('/api/admin/PayTransaction/detail', params),
}
