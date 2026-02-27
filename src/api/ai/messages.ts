import request from '@/utils/request'

export const AiMessageApi = {
  list: (params: any) => request.post('/api/admin/AiMessages/list', params),
  add: (params: any) => request.post('/api/admin/AiMessages/add', params),
  del: (params: any) => request.post('/api/admin/AiMessages/del', params),
  editContent: (params: any) => request.post('/api/admin/AiMessages/editContent', params),
  feedback: (params: any) => request.post('/api/admin/AiMessages/feedback', params),
}
