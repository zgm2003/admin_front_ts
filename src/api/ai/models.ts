import request from '@/lib/http'
import type { DictOption, Id, PaginatedResponse, RequestPayload } from '@/types/common'

export interface AiModelInitResponse {
  dict: {
    ai_driver_arr: DictOption<string>[]
    common_status_arr: DictOption<number>[]
  }
}

export interface AiModelListParams extends RequestPayload {
  current_page?: number
  page_size?: number
  name?: string
  driver?: string
  status?: number | ''
}

export interface AiModelItem {
  id: number
  name: string
  driver: string
  driver_name: string
  model_code: string
  endpoint?: string | null
  api_key_hint?: string | null
  status: number
  status_name: string
  created_at: string
  updated_at: string
}

export interface AiModelMutationParams extends RequestPayload {
  id?: number
  name: string
  driver: string
  model_code: string
  endpoint?: string | null
  api_key?: string
  status?: number
}

export const AiModelApi = {
  init: (params?: RequestPayload) => request.post<AiModelInitResponse>('/api/admin/AiModels/init', params),
  add: (params: AiModelMutationParams) => request.post<void>('/api/admin/AiModels/add', params),
  edit: (params: AiModelMutationParams) => request.post<void>('/api/admin/AiModels/edit', params),
  del: (params: { id: Id | Id[] }) => request.post<{ affected: number }>('/api/admin/AiModels/del', params),
  list: (params: AiModelListParams) => request.post<PaginatedResponse<AiModelItem>>('/api/admin/AiModels/list', params),
  status: (params: { id: Id; status: number }) => request.post<{ affected: number }>('/api/admin/AiModels/status', params),
}
