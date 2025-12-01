import request from '@/utils/request'
export const initApi = (params: any) => request.post('/api/chat/init', params)
export const listApi = (params: any) => request.post('/api/chat/list', params)
export const onlineApi = (params: any) => request.post('/api/chat/online', params)
export const exitApi = (params: any) => request.post('/api/chat/exit', params)
