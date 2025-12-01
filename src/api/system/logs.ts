import request from '@/utils/request'

export const initApi = (params?: any) => request.post('/api/admin/OperationLog/init', params)
export const delApi = (params: any) => request.post('/api/admin/OperationLog/del', params)
export const listApi = (params: any) => request.post('/api/admin/OperationLog/list', params)
