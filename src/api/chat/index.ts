import request from '@/utils/request'
export const ChatApi = {
  init: (params: any) => request.post('/api/chat/init', params),
  list: (params: any) => request.post('/api/chat/list', params),
  online: (params: any) => request.post('/api/chat/online', params),
  exit: (params: any) => request.post('/api/chat/exit', params),
}
