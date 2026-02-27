import request from '@/utils/request'

export const AiModelApi = {
  init: (params?: any) => request.post('/api/admin/AiModels/init', params),
  add: (params: any) => request.post('/api/admin/AiModels/add', params),
  edit: (params: any) => request.post('/api/admin/AiModels/edit', params),
  del: (params: any) => request.post('/api/admin/AiModels/del', params),
  list: (params: any) => request.post('/api/admin/AiModels/list', params),
  status: (params: any) => request.post('/api/admin/AiModels/status', params),
}
