import request from '@/utils/request'

export const NotificationTaskApi = {
  init: () => request.post('/api/admin/NotificationTask/init'),
  statusCount: (params: any) => request.post('/api/admin/NotificationTask/statusCount', params),
  list: (params: any) => request.post('/api/admin/NotificationTask/list', params),
  add: (params: any) => request.post('/api/admin/NotificationTask/add', params),
  del: (params: { id: number }) => request.post('/api/admin/NotificationTask/del', params),
  cancel: (params: { id: number }) => request.post('/api/admin/NotificationTask/cancel', params),
}
