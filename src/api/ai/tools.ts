import request from '@/utils/request'

export const AiToolApi = {
  init: (params?: any) => request.post('/api/admin/AiTools/init', params),
  list: (params: any) => request.post('/api/admin/AiTools/list', params),
  add: (params: any) => request.post('/api/admin/AiTools/add', params),
  edit: (params: any) => request.post('/api/admin/AiTools/edit', params),
  del: (params: any) => request.post('/api/admin/AiTools/del', params),
  status: (params: any) => request.post('/api/admin/AiTools/status', params),
  bindTools: (params: any) => request.post('/api/admin/AiTools/bindTools', params),
  getAgentTools: (params: any) => request.post('/api/admin/AiTools/getAgentTools', params),
}
