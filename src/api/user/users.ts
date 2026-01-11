import request from '@/utils/request'
export const UsersApi = {
  register: (params: any) => request.post('/api/Users/register', params),
  init: (params?: any) => request.post('/api/Users/init', params),
  getLoginConfig: () => request.post('/api/Users/getLoginConfig', {}),
  login: (params: any) => request.post('/api/Users/login', params),
  refresh: (params: any) => request.post('/api/Users/refresh', params),
  logout: (params: any) => request.post('/api/Users/logout', params),
  sendCode: (params: any) => request.post('/api/Users/sendCode', params),
  forgetPassword: (params: any) => request.post('/api/Users/forgetPassword', params),
  initPersonal: (params: any) => request.post('/api/Users/initPersonal', params),
  editPersonal: (params: any) => request.post('/api/Users/editPersonal', params),
  EditPassword: (params: any) => request.post('/api/Users/EditPassword', params),
  // 新增：账号与安全模块接口
  updatePhone: (params: any) => request.post('/api/Users/updatePhone', params),    // 绑定/更换手机号
  updateEmail: (params: any) => request.post('/api/Users/updateEmail', params),    // 绑定/更换邮箱
  updatePassword: (params: any) => request.post('/api/Users/updatePassword', params), // 设置/修改密码（需登录）
}

export const UsersListApi = {
  init: (params?: any) => request.post('/api/admin/UsersList/init', params),
  del: (params: any) => request.post('/api/admin/UsersList/del', params),
  edit: (params: any) => request.post('/api/admin/UsersList/edit', params),
  batchEdit: (params: any) => request.post('/api/admin/UsersList/batchEdit', params),
  list: (params: any) => request.post('/api/admin/UsersList/list', params),
  export: (params: any) => request.post('/api/admin/UsersList/export', params),
}

export const UserSessionApi = {
  list: (data: any) => request.post('/api/admin/UserSession/list', data),
  stats: () => request.post('/api/admin/UserSession/stats'),
  kick: (data: { id: number }) => request.post('/api/admin/UserSession/kick', data),
  batchKick: (data: { ids: number[] }) => request.post('/api/admin/UserSession/batchKick', data),
}
