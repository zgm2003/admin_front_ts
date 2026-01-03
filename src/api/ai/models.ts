import request from '@/utils/request'

export const AiModelApi = {
  init: (params?: any) => request.post('/api/admin/AiModel/init', params),
  add: (params: any) => request.post('/api/admin/AiModel/add', params),
  edit: (params: any) => request.post('/api/admin/AiModel/edit', params),
  del: (params: any) => request.post('/api/admin/AiModel/del', params),
  list: (params: any) => request.post('/api/admin/AiModel/list', params),
  status: (params: any) => request.post('/api/admin/AiModel/status', params),
}
