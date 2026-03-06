import request from '@/utils/request'

export const QueueMonitorApi = {
  list: () => request.post('/api/admin/QueueMonitor/list'),
  failedList: (params: any) => request.post('/api/admin/QueueMonitor/failedList', params),
  retry: (params: any) => request.post('/api/admin/QueueMonitor/retry', params),
  clear: (params: any) => request.post('/api/admin/QueueMonitor/clear', params),
  clearFailed: (params: any) => request.post('/api/admin/QueueMonitor/clearFailed', params),
}
