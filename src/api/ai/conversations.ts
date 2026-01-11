import request from '@/utils/request'

export const AiConversationApi = {
  list: (params: any) => request.post('/api/admin/AiConversation/list', params),
  detail: (params: any) => request.post('/api/admin/AiConversation/detail', params),
  add: (params: any) => request.post('/api/admin/AiConversation/add', params),
  edit: (params: any) => request.post('/api/admin/AiConversation/edit', params),
  del: (params: any) => request.post('/api/admin/AiConversation/del', params),
  status: (params: any) => request.post('/api/admin/AiConversation/status', params),
}
