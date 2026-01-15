import request from '@/utils/request'

export const PermissionApi = {
  init: (params?: any) => request.post('/api/admin/Permission/init', params),
  list: (params: any) => request.post('/api/admin/Permission/list', params),
  add: (params: any) => request.post('/api/admin/Permission/add', params),
  edit: (params: any) => request.post('/api/admin/Permission/edit', params),
  del: (params: any) => request.post('/api/admin/Permission/del', params),
  batchEdit: (params: any) => request.post('/api/admin/Permission/batchEdit', params),
  status: (params: any) => request.post('/api/admin/Permission/status', params),
}
