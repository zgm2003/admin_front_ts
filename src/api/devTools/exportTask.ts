import request from '@/utils/request'

export const ExportTaskApi = {
  init: () => request.post('/api/admin/DevTools/ExportTask/init'),
  list: (params: any) => request.post('/api/admin/DevTools/ExportTask/list', params),
  del: (params: { id: number }) => request.post('/api/admin/DevTools/ExportTask/del', params),
  batchDel: (params: { ids: number[] }) => request.post('/api/admin/DevTools/ExportTask/batchDel', params),
}
