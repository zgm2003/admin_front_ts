import { legacyRequest } from '@/lib/http'
import type { DictOption, Id, PaginatedResponse, RequestPayload } from '@/types/common'

export interface CineInitResponse {
  dict: {
    cine_status_arr: DictOption<number>[]
    cine_agent_list: DictOption<number>[]
  }
}

export interface CineStatusCountItem {
  label: string
  value: number | ''
  num: number
}

export interface CineListParams extends RequestPayload {
  current_page?: number
  page_size?: number
  title?: string
  status?: number | ''
  agent_id?: number
}

export interface CineStatusCountParams extends RequestPayload {
  title?: string
}

export interface CineAssetItem {
  id: number
  project_id: number
  asset_type: string
  shot_id: string
  prompt: string
  file_url?: string | null
  status: number
  status_name: string
  status_msg?: string | null
  sort: number
  meta_json?: Record<string, unknown> | null
}

export interface CineProjectItem {
  id: number
  user_id: number
  title: string
  source_text: string
  style: string
  duration_seconds: number
  aspect_ratio: string
  mode: 'draft' | 'visual'
  mode_name: string
  agent_id: number
  status: number
  status_name: string
  status_msg?: string | null
  deliverable_markdown?: string | null
  draft_json?: Record<string, unknown> | null
  shotlist_json?: Record<string, unknown>[] | null
  feed_pack_json?: Record<string, unknown>[] | null
  reference_images_json?: Record<string, unknown> | null
  tool_config_json?: Record<string, unknown> | null
  continuity_review?: Record<string, unknown> | null
  model_origin?: string | null
  assets?: CineAssetItem[]
  created_at: string
  updated_at: string
}

export interface CineMutationParams extends RequestPayload {
  id?: number
  title: string
  source_text: string
  style?: string
  duration_seconds?: number
  aspect_ratio?: string
  mode?: 'draft' | 'visual'
  agent_id?: number
  reference_images_json?: Record<string, unknown> | null
  tool_config_json?: Record<string, unknown> | null
  deliverable_markdown?: string | null
}

export interface CineGenerateParams extends RequestPayload {
  id: number
  agent_id?: number
}

export interface CineGenerateStoryboardParams extends RequestPayload {
  id: number
  asset_ids?: number[]
}

export const CineApi = {
  init: (params?: RequestPayload) => legacyRequest.post<CineInitResponse>('/api/admin/Cine/init', params),
  statusCount: (params?: CineStatusCountParams) => legacyRequest.post<CineStatusCountItem[]>('/api/admin/Cine/statusCount', params),
  list: (params: CineListParams) => legacyRequest.post<PaginatedResponse<CineProjectItem>>('/api/admin/Cine/list', params),
  detail: (params: { id: number }) => legacyRequest.post<CineProjectItem>('/api/admin/Cine/detail', params),
  add: (params: CineMutationParams) => legacyRequest.post<{ id: number }>('/api/admin/Cine/add', params),
  edit: (params: CineMutationParams & { id: number }) => legacyRequest.post<void>('/api/admin/Cine/edit', params),
  del: (params: { id: Id | Id[] }) => legacyRequest.post<{ affected: number }>('/api/admin/Cine/del', params),
  generate: (params: CineGenerateParams) => legacyRequest.post<{ msg: string }>('/api/admin/Cine/generate', params),
  generateStoryboard: (params: CineGenerateStoryboardParams) => legacyRequest.post<{ msg: string }>('/api/admin/Cine/generateKeyframes', params),
}
