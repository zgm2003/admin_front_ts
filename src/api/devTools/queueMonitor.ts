import request from '@/utils/request'

export const QueueMonitorApi = {
  // 队列列表
  list: () => request.post('/api/admin/DevTools/QueueMonitor/list'),
  // 失败任务列表
  failedList: (data: { queue: string; page_size?: number; current_page?: number }) =>
    request.post('/api/admin/DevTools/QueueMonitor/failedList', data),
  // 重试任务
  retry: (data: { queue: string; index: number }) => request.post('/api/admin/DevTools/QueueMonitor/retry', data),
  // 清空等待队列
  clear: (data: { queue: string }) => request.post('/api/admin/DevTools/QueueMonitor/clear', data),
  // 清空失败队列
  clearFailed: (data: { queue: string }) => request.post('/api/admin/DevTools/QueueMonitor/clearFailed', data),
}
