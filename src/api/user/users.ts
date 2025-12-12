import request from '@/utils/request'
export const UsersApi = {
  register: (params: any) => request.post('/api/Users/register', params),
  init: (params?: any) => request.post('/api/Users/init', params),
  login: (params: any) => request.post('/api/Users/login', params),
  sendCode: (params: any) => request.post('/api/Users/sendCode', params),
  forgetPassword: (params: any) => request.post('/api/Users/forgetPassword', params),
  initPersonal: (params: any) => request.post('/api/Users/initPersonal', params),
  editPersonal: (params: any) => request.post('/api/Users/editPersonal', params),
  EditPassword: (params: any) => request.post('/api/Users/EditPassword', params),
  initList: (params?: any) => request.post('/api/admin/Users/initList', params),
  delList: (params: any) => request.post('/api/admin/Users/delList', params),
  editList: (params: any) => request.post('/api/admin/Users/editList', params),
  batchEditList: (params: any) => request.post('/api/admin/Users/batchEditList', params),
  listList: (params: any) => request.post('/api/admin/Users/listList', params),
  exportList: (params: any) => request.post('/api/admin/Users/exportList', params),
}
