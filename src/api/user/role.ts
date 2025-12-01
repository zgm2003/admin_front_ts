import request from '@/utils/request'

export const addApi = (params: any) => request.post('/api/admin/Role/add', params)
export const initApi = (params?: any) => request.post('/api/admin/Role/init', params)
export const editApi = (params: any) => request.post('/api/admin/Role/edit', params)
export const delApi = (params: any) => request.post('/api/admin/Role/del', params)
export const listApi = (params: any) => request.post('/api/admin/Role/list', params)
