import request from '@/utils/request'

export const UsersLoginLogApi = {
  init: (params?: any) => request.post('/api/admin/UsersLoginLog/init', params),
  list: (params: any) => request.post('/api/admin/UsersLoginLog/list', params),
}
