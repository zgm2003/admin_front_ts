import request from '@/utils/request'

export const AuthPlatformApi = {
  init: (params?: any) => request.post('/api/admin/AuthPlatform/init', params),
  list: (params: any) => request.post('/api/admin/AuthPlatform/list', params),
  add: (params: any) => request.post('/api/admin/AuthPlatform/add', params),
  edit: (params: any) => request.post('/api/admin/AuthPlatform/edit', params),
  del: (params: any) => request.post('/api/admin/AuthPlatform/del', params),
  status: (params: any) => request.post('/api/admin/AuthPlatform/status', params),
}
