import request from '@/utils/request'

export const UploadDriverApi = {
  init: (params?: any) => request.post('/api/admin/UploadDriver/init', params),
  list: (params: any) => request.post('/api/admin/UploadDriver/list', params),
  add: (params: any) => request.post('/api/admin/UploadDriver/add', params),
  edit: (params: any) => request.post('/api/admin/UploadDriver/edit', params),
  del: (params: any) => request.post('/api/admin/UploadDriver/del', params)
}

export const UploadRuleApi = {
  init: (params?: any) => request.post('/api/admin/UploadRule/init', params),
  list: (params: any) => request.post('/api/admin/UploadRule/list', params),
  add: (params: any) => request.post('/api/admin/UploadRule/add', params),
  edit: (params: any) => request.post('/api/admin/UploadRule/edit', params),
  del: (params: any) => request.post('/api/admin/UploadRule/del', params)
}

export const UploadSettingApi = {
  init: (params?: any) => request.post('/api/admin/UploadSetting/init', params),
  list: (params: any) => request.post('/api/admin/UploadSetting/list', params),
  add: (params: any) => request.post('/api/admin/UploadSetting/add', params),
  edit: (params: any) => request.post('/api/admin/UploadSetting/edit', params),
  del: (params: any) => request.post('/api/admin/UploadSetting/del', params),
  status: (params: any) => request.post('/api/admin/UploadSetting/status', params)
}
