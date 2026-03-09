
import request from '@/utils/request'

export const ExportTaskApi = {
  statusCount: (params: any) => request.post('/api/admin/ExportTask/statusCount', params),
  list: (params: any) => request.post('/api/admin/ExportTask/list', params),
  del: (params: { id: number | number[] }) => request.post('/api/admin/ExportTask/del', params),
}
