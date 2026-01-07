import request from '@/utils/request'

export const AiRunApi = {
  init: (params?: any) => request.post('/api/admin/AiRun/init', params),
  list: (params: any) => request.post('/api/admin/AiRun/list', params),
  detail: (params: any) => request.post('/api/admin/AiRun/detail', params),
}
