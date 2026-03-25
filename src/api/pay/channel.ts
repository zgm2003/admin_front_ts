import request from '@/utils/request'

export const PayChannelApi = {
  init: (params?: any) => request.post('/api/admin/PayChannel/init', params),
  list: (params: any) => request.post('/api/admin/PayChannel/list', params),
  add: (params: any) => request.post('/api/admin/PayChannel/add', params),
  edit: (params: any) => request.post('/api/admin/PayChannel/edit', params),
  del: (params: any) => request.post('/api/admin/PayChannel/del', params),
  status: (params: any) => request.post('/api/admin/PayChannel/status', params),
}
