import request from '@/utils/request'

export const OrderApi = {
  init: (params?: any) => request.post('/api/admin/PayOrder/init', params),
  list: (params: any) => request.post('/api/admin/PayOrder/list', params),
  detail: (params: any) => request.post('/api/admin/PayOrder/detail', params),
  statusCount: (params?: any) => request.post('/api/admin/PayOrder/statusCount', params),
  close: (params: any) => request.post('/api/admin/PayOrder/close', params),
  remark: (params: any) => request.post('/api/admin/PayOrder/remark', params),
}
