import request from '@/utils/request'

export const CronTaskApi = {
  list: (params?: any) => request.post('/api/admin/DevTools/CronTask/list', params),
  add: (params: any) => request.post('/api/admin/DevTools/CronTask/add', params),
  edit: (params: any) => request.post('/api/admin/DevTools/CronTask/edit', params),
  del: (params: any) => request.post('/api/admin/DevTools/CronTask/del', params),
  status: (params: any) => request.post('/api/admin/DevTools/CronTask/status', params),
  logs: (params: any) => request.post('/api/admin/DevTools/CronTask/logs', params),
}
