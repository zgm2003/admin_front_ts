import request from '@/utils/request'

export const OperationLogApi = {
  init: (params?: any) => request.post('/api/admin/OperationLog/init', params),
  list: (params: any) => request.post('/api/admin/OperationLog/list', params),
  listCursor: (params: any) => request.post('/api/admin/OperationLog/listCursor', params),
  del: (params: any) => request.post('/api/admin/OperationLog/del', params)
}
