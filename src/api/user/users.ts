import request from '@/utils/request'
export const UsersApi = {
  register: (params: any) => request.post('/api/Users/register', params),
  init: (params?: any) => request.post('/api/Users/init', params),
  login: (params: any) => request.post('/api/Users/login', params),
  refresh: (params: any) => request.post('/api/Users/refresh', params),
  logout: (params: any) => request.post('/api/Users/logout', params),
  sendCode: (params: any) => request.post('/api/Users/sendCode', params),
  forgetPassword: (params: any) => request.post('/api/Users/forgetPassword', params),
  initPersonal: (params: any) => request.post('/api/Users/initPersonal', params),
  editPersonal: (params: any) => request.post('/api/Users/editPersonal', params),
  EditPassword: (params: any) => request.post('/api/Users/EditPassword', params),
}

export const UsersListApi = {
  init: (params?: any) => request.post('/api/admin/UsersList/init', params),
  del: (params: any) => request.post('/api/admin/UsersList/del', params),
  edit: (params: any) => request.post('/api/admin/UsersList/edit', params),
  batchEdit: (params: any) => request.post('/api/admin/UsersList/batchEdit', params),
  list: (params: any) => request.post('/api/admin/UsersList/list', params),
  export: (params: any) => request.post('/api/admin/UsersList/export', params),
}
