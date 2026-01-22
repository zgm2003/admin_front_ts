import request from '@/utils/request'

export const UsersQuickEntryApi = {
  add: (params: { permission_id: number }) => request.post('/api/admin/UsersQuickEntry/add', params),
  del: (params: { id: number }) => request.post('/api/admin/UsersQuickEntry/del', params),
  sort: (params: { items: { id: number; sort: number }[] }) => request.post('/api/admin/UsersQuickEntry/sort', params),
}
