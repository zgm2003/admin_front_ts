import request from '@/utils/request'

export const OperationLogApi = {
  init: (params?: any) => request.post('/api/admin/DevTools/OperationLog/init', params),
  list: (params: any) => request.post('/api/admin/DevTools/OperationLog/list', params),
  listCursor: (params: any) => request.post('/api/admin/DevTools/OperationLog/listCursor', params),
  del: (params: any) => request.post('/api/admin/DevTools/OperationLog/del', params)
}
