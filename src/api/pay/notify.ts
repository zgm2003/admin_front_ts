import request from '@/utils/request'

export const PayNotifyLogApi = {
  init: (params?: any) => request.post('/api/admin/PayNotifyLog/init', params),
  list: (params: any) => request.post('/api/admin/PayNotifyLog/list', params),
  detail: (params: any) => request.post('/api/admin/PayNotifyLog/detail', params),
}
