import request from '@/utils/request'

export const GoodsApi = {
  init: (params?: any) => request.post('/api/admin/Goods/init', params),
  statusCount: (params?: any) => request.post('/api/admin/Goods/statusCount', params),
  list: (params: any) => request.post('/api/admin/Goods/list', params),
  add: (params: any) => request.post('/api/admin/Goods/add', params),
  edit: (params: any) => request.post('/api/admin/Goods/edit', params),
  del: (params: any) => request.post('/api/admin/Goods/del', params),
  submit: (params: any) => request.post('/api/admin/Goods/submit', params),
  ocr: (params: any) => request.post('/api/admin/Goods/ocr', params),
  generate: (params: any) => request.post('/api/admin/Goods/generate', params),
  tts: (params: any) => request.post('/api/admin/Goods/tts', params),
}
