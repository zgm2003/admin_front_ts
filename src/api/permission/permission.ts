import request from '@/utils/request'

export const PermissionApi = {
  init: (params?: any) => request.post('/api/admin/Permission/init', params),
  list: (params: any) => request.post('/api/admin/Permission/list', params),
  add: (params: any) => request.post('/api/admin/Permission/add', params),
  edit: (params: any) => request.post('/api/admin/Permission/edit', params),
  del: (params: any) => request.post('/api/admin/Permission/del', params),
  batchEdit: (params: any) => request.post('/api/admin/Permission/batchEdit', params),
  status: (params: any) => request.post('/api/admin/Permission/status', params),
  // APP/H5/小程序 按钮权限
  appButtonList: (params: any) => request.post('/api/admin/Permission/appButtonList', params),
  appButtonAdd: (params: any) => request.post('/api/admin/Permission/appButtonAdd', params),
  appButtonEdit: (params: any) => request.post('/api/admin/Permission/appButtonEdit', params),
  appButtonStatus: (params: any) => request.post('/api/admin/Permission/appButtonStatus', params),
  appButtonDel: (params: any) => request.post('/api/admin/Permission/appButtonDel', params),
}
