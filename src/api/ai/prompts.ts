import request from '@/utils/request'

export const AiPromptApi = {
  list: (params?: any) => request.post('/api/admin/AiPrompts/list', params),
  detail: (params: any) => request.post('/api/admin/AiPrompts/detail', params),
  add: (params: any) => request.post('/api/admin/AiPrompts/add', params),
  edit: (params: any) => request.post('/api/admin/AiPrompts/edit', params),
  del: (params: any) => request.post('/api/admin/AiPrompts/del', params),
  toggleFavorite: (params: any) => request.post('/api/admin/AiPrompts/toggleFavorite', params),
  use: (params: any) => request.post('/api/admin/AiPrompts/use', params),
}
