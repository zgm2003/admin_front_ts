import request from '@/utils/request'

export const GenApi = {
  tables: () => request.post('/api/admin/DevTools/Gen/tables'),
  columns: (params: { table: string }) => request.post('/api/admin/DevTools/Gen/columns', params),
  preview: (params: any) => request.post('/api/admin/DevTools/Gen/preview', params),
  generate: (params: any) => request.post('/api/admin/DevTools/Gen/generate', params),
}
