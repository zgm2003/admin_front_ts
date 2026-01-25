import request from '@/utils/request'

export const AiPromptApi = {
  list: (params?: any) => request.post('/api/admin/AiPrompt/list', params),
  detail: (params: any) => request.post('/api/admin/AiPrompt/detail', params),
  add: (params: any) => request.post('/api/admin/AiPrompt/add', params),
  edit: (params: any) => request.post('/api/admin/AiPrompt/edit', params),
  del: (params: any) => request.post('/api/admin/AiPrompt/del', params),
  toggleFavorite: (params: any) => request.post('/api/admin/AiPrompt/toggleFavorite', params),
  use: (params: any) => request.post('/api/admin/AiPrompt/use', params),
}