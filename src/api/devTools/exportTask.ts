import request from '@/utils/request'

export const ExportTaskApi = {
  statusCount: (params: any) => request.post('/api/admin/DevTools/ExportTask/statusCount', params),
  list: (params: any) => request.post('/api/admin/DevTools/ExportTask/list', params),
  del: (params: { id: number }) => request.post('/api/admin/DevTools/ExportTask/del', params),
  batchDel: (params: { ids: number[] }) => request.post('/api/admin/DevTools/ExportTask/batchDel', params),
}
