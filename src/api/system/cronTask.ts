import request from '@/utils/request'

export const CronTaskApi = {
  init: () => request.post('/api/admin/CronTask/init'),
  list: (params?: any) => request.post('/api/admin/CronTask/list', params),
  add: (params: any) => request.post('/api/admin/CronTask/add', params),
  edit: (params: any) => request.post('/api/admin/CronTask/edit', params),
  del: (params: any) => request.post('/api/admin/CronTask/del', params),
  status: (params: any) => request.post('/api/admin/CronTask/status', params),
  logs: (params: any) => request.post('/api/admin/CronTask/logs', params),
}
