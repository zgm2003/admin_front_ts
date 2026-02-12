import request from '@/utils/request'

export const AiMessageApi = {
  list: (params: any) => request.post('/api/admin/AiMessage/list', params),
  add: (params: any) => request.post('/api/admin/AiMessage/add', params),
  del: (params: any) => request.post('/api/admin/AiMessage/del', params),
  editContent: (params: any) => request.post('/api/admin/AiMessage/editContent', params),
  feedback: (params: any) => request.post('/api/admin/AiMessage/feedback', params),
}
