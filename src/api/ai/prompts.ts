import request from '@/lib/http'
import type { PaginatedResponse, RequestPayload } from '@/types/common'

export interface AiPromptListParams extends RequestPayload {
  current_page?: number
  page_size?: number
  title?: string
  category?: string
  is_favorite?: number | ''
}

export interface AiPromptItem {
  id: number
  title: string
  content: string
  category?: string | null
  tags: string[]
  variables: string[]
  is_favorite: number
  use_count: number
  sort: number
  created_at: string
}

export type AiPromptDetailResponse = Omit<AiPromptItem, 'created_at'>

export interface AiPromptMutationParams extends RequestPayload {
  id?: number
  title: string
  content: string
  category?: string | null
  tags?: string[]
  variables?: string[]
}

export const AiPromptApi = {
  list: (params?: AiPromptListParams) => request.post<PaginatedResponse<AiPromptItem>>('/api/admin/AiPrompts/list', params),
  detail: (params: { id: number }) => request.post<AiPromptDetailResponse>('/api/admin/AiPrompts/detail', params),
  add: (params: AiPromptMutationParams) => request.post<void>('/api/admin/AiPrompts/add', params),
  edit: (params: AiPromptMutationParams) => request.post<void>('/api/admin/AiPrompts/edit', params),
  del: (params: { id: number | number[] }) => request.post<void>('/api/admin/AiPrompts/del', params),
  toggleFavorite: (params: { id: number }) => request.post<{ is_favorite: number }>('/api/admin/AiPrompts/toggleFavorite', params),
  use: (params: { id: number }) => request.post<{ content: string }>('/api/admin/AiPrompts/use', params),
}
