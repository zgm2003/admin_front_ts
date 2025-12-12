import request from '@/utils/request'

export const RoleApi = {
  init: (params?: any) => request.post('/api/admin/Role/init', params),
  list: (params: any) => request.post('/api/admin/Role/list', params),
  add: (params: any) => request.post('/api/admin/Role/add', params),
  edit: (params: any) => request.post('/api/admin/Role/edit', params),
  del: (params: any) => request.post('/api/admin/Role/del', params),
}
