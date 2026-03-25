import request from '@/utils/request'

export const PayReconcileApi = {
  init: (params?: any) => request.post('/api/admin/PayReconcile/init', params),
  list: (params: any) => request.post('/api/admin/PayReconcile/list', params),
  detail: (params: any) => request.post('/api/admin/PayReconcile/detail', params),
  retry: (params: any) => request.post('/api/admin/PayReconcile/retry', params),
}
