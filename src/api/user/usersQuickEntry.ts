import request from '@/utils/request'

export const UsersQuickEntryApi = {
  add: (params: { permission_id: number }) => request.post<{ id: number }>('/api/admin/UsersQuickEntry/add', params),
  del: (params: { id: number }) => request.post<void>('/api/admin/UsersQuickEntry/del', params),
  sort: (params: { items: { id: number; sort: number }[] }) => request.post<void>('/api/admin/UsersQuickEntry/sort', params),
}
