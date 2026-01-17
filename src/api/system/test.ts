import request from '@/utils/request'

export const TestApi = {
  init: (params?: any) => request.post('/api/admin/System/Test/init', params),
  list: (params: any) => request.post('/api/admin/System/Test/list', params),
  add: (params: any) => request.post('/api/admin/System/Test/add', params),
  edit: (params: any) => request.post('/api/admin/System/Test/edit', params),
  del: (params: any) => request.post('/api/admin/System/Test/del', params)
}