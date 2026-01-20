import request from '@/utils/request'

export const QueueMonitorApi = {
  list: () => request.post('/api/admin/DevTools/QueueMonitor/list'),
  failedList: (params: any) => request.post('/api/admin/DevTools/QueueMonitor/failedList', params),
  retry: (params: any) => request.post('/api/admin/DevTools/QueueMonitor/retry', params),
  clear: (params: any) => request.post('/api/admin/DevTools/QueueMonitor/clear', params),
  clearFailed: (params: any) => request.post('/api/admin/DevTools/QueueMonitor/clearFailed', params),
}
