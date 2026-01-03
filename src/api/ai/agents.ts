import request from '@/utils/request'

export const AiAgentApi = {
  init: (params?: any) => request.post('/api/admin/AiAgent/init', params),
  add: (params: any) => request.post('/api/admin/AiAgent/add', params),
  edit: (params: any) => request.post('/api/admin/AiAgent/edit', params),
  del: (params: any) => request.post('/api/admin/AiAgent/del', params),
  list: (params: any) => request.post('/api/admin/AiAgent/list', params),
  status: (params: any) => request.post('/api/admin/AiAgent/status', params),
}
