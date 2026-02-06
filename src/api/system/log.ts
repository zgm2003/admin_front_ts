import request from '@/utils/request'

export const SystemLogApi = {
  init: (params?: any) => request.post('/api/admin/SystemLog/init', params),
  files: (params?: any) => request.post('/api/admin/SystemLog/files', params),
  content: (params?: any) => request.post('/api/admin/SystemLog/content', params),
}
