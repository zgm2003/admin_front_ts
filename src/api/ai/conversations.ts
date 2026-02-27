import request from '@/utils/request'

export const AiConversationApi = {
  list: (params: any) => request.post('/api/admin/AiConversations/list', params),
  detail: (params: any) => request.post('/api/admin/AiConversations/detail', params),
  add: (params: any) => request.post('/api/admin/AiConversations/add', params),
  edit: (params: any) => request.post('/api/admin/AiConversations/edit', params),
  del: (params: any) => request.post('/api/admin/AiConversations/del', params),
  status: (params: any) => request.post('/api/admin/AiConversations/status', params),
}
