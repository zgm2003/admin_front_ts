import request from '@/utils/request'

export const addApi = (params: any) => request.post('/api/admin/Permission/add', params)
export const initApi = (params?: any) => request.post('/api/admin/Permission/init', params)
export const editApi = (params: any) => request.post('/api/admin/Permission/edit', params)
export const delApi = (params: any) => request.post('/api/admin/Permission/del', params)
export const listApi = (params: any) => request.post('/api/admin/Permission/list', params)
export const batchEditApi = (params: any) => request.post('/api/admin/Permission/batchEdit', params)
export const statusApi = (params: any) => request.post('/api/admin/Permission/status', params)
