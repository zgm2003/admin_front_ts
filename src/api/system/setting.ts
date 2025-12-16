import request from '@/utils/request'

export const SystemSettingApi = {
  init: (params?: any) => request.post('/api/admin/SystemSetting/init', params),
  add: (params: any) => request.post('/api/admin/SystemSetting/add', params),
  edit: (params: any) => request.post('/api/admin/SystemSetting/edit', params),
  del: (params: any) => request.post('/api/admin/SystemSetting/del', params),
  list: (params: any) => request.post('/api/admin/SystemSetting/list', params),
  status: (params: any) => request.post('/api/admin/SystemSetting/status', params),
}
