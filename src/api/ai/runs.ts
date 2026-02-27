import request from '@/utils/request'

export const AiRunApi = {
  init: (params?: any) => request.post('/api/admin/AiRuns/init', params),
  list: (params: any) => request.post('/api/admin/AiRuns/list', params),
  detail: (params: any) => request.post('/api/admin/AiRuns/detail', params),
  stats: (params?: any) => request.post('/api/admin/AiRuns/stats', params),
  statsByDate: (params: any) => request.post('/api/admin/AiRuns/statsByDate', params),
  statsByAgent: (params: any) => request.post('/api/admin/AiRuns/statsByAgent', params),
  statsByUser: (params: any) => request.post('/api/admin/AiRuns/statsByUser', params),
}
