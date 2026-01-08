import request from '@/utils/request'

export const AiRunApi = {
  init: (params?: any) => request.post('/api/admin/AiRun/init', params),
  list: (params: any) => request.post('/api/admin/AiRun/list', params),
  detail: (params: any) => request.post('/api/admin/AiRun/detail', params),
  stats: (params?: any) => request.post('/api/admin/AiRun/stats', params),
  statsByDate: (params: any) => request.post('/api/admin/AiRun/statsByDate', params),
  statsByAgent: (params: any) => request.post('/api/admin/AiRun/statsByAgent', params),
  statsByUser: (params: any) => request.post('/api/admin/AiRun/statsByUser', params),
}
