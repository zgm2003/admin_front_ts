import request from '@/utils/request'

export const AiAgentApi = {
  init: (params?: any) => request.post('/api/admin/AiAgents/init', params),
  add: (params: any) => request.post('/api/admin/AiAgents/add', params),
  edit: (params: any) => request.post('/api/admin/AiAgents/edit', params),
  del: (params: any) => request.post('/api/admin/AiAgents/del', params),
  list: (params: any) => request.post('/api/admin/AiAgents/list', params),
  status: (params: any) => request.post('/api/admin/AiAgents/status', params),
}
