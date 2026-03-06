import request from '@/utils/request'

export const TauriVersionApi = {
  init: () => request.post('/api/admin/TauriVersion/init'),
  list: (params: any) => request.post('/api/admin/TauriVersion/list', params),
  add: (params: any) => request.post('/api/admin/TauriVersion/add', params),
  edit: (params: any) => request.post('/api/admin/TauriVersion/edit', params),
  setLatest: (params: any) => request.post('/api/admin/TauriVersion/setLatest', params),
  del: (params: any) => request.post('/api/admin/TauriVersion/del', params),
  updateJson: (params: any) => request.post('/api/admin/TauriVersion/updateJson', params),
  forceUpdate: (params: any) => request.post('/api/admin/TauriVersion/forceUpdate', params),
  // 客户端初始化（公开接口）
  clientInit: (params: { version: string; platform?: string }) => request.post('/api/TauriVersion/clientInit', params),
}
