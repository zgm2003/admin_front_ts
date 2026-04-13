import request from '@/lib/http'
import type { DictOption, Id, PaginatedResponse, RequestPayload } from '@/types/common'

export interface AiAgentModalities {
  image?: boolean
  audio?: boolean
  video?: boolean
  file?: boolean
}

export interface AiAgentListParams extends RequestPayload {
  current_page?: number
  page_size?: number
  name?: string
  model_id?: number | ''
  mode?: string | ''
  status?: number | ''
}

export interface AiAgentItem {
  id: number
  name: string
  model_id: number
  model_name: string
  model_deleted: boolean
  driver: string
  driver_name: string
  model_code: string
  modalities: AiAgentModalities | null
  avatar?: string | null
  system_prompt?: string | null
  mode: string
  mode_name: string
  scene?: string | null
  scene_name?: string | null
  status: number
  status_name: string
  created_at: string
  updated_at: string
}

export interface AiAgentInitResponse {
  dict: {
    ai_mode_arr: DictOption<string>[]
    ai_scene_arr: DictOption<string>[]
    common_status_arr: DictOption<number>[]
    model_list: DictOption<number>[]
  }
}

export interface AiAgentMutationParams extends RequestPayload {
  id?: number
  name: string
  model_id: number
  avatar?: string | null
  system_prompt?: string | null
  mode?: string
  scene?: string | null
  status?: number
  tool_ids?: number[]
}

export const AiAgentApi = {
  init: (params?: RequestPayload) => request.post<AiAgentInitResponse>('/api/admin/AiAgents/init', params),
  add: (params: AiAgentMutationParams) => request.post<{ id: number }>('/api/admin/AiAgents/add', params),
  edit: (params: AiAgentMutationParams) => request.post<void>('/api/admin/AiAgents/edit', params),
  del: (params: { id: Id | Id[] }) => request.post<{ affected: number }>('/api/admin/AiAgents/del', params),
  list: (params: AiAgentListParams) => request.post<PaginatedResponse<AiAgentItem>>('/api/admin/AiAgents/list', params),
  status: (params: { id: Id; status: number }) => request.post<{ affected: number }>('/api/admin/AiAgents/status', params),
}
