import request from '@/lib/http'
import type { PaginatedResponse, RequestPayload } from '@/types/common'
import type { AiAgentModalities } from './agents'

export interface AiConversationListParams extends RequestPayload {
  current_page?: number
  page_size?: number
  status?: number
  agent_id?: number
  title?: string
}

export interface AiConversationItem {
  id: number
  user_id: number
  agent_id: number
  agent_name: string
  title: string
  last_message_at: string
  status: number
  status_name: string
  created_at: string
  updated_at: string
}

export interface AiConversationDetailResponse {
  id: number
  user_id: number
  agent_id: number
  agent_name: string
  modalities: AiAgentModalities | null
  title: string
  last_message_at: string
  status: number
  created_at: string
}

export const AiConversationApi = {
  list: (params: AiConversationListParams) => request.post<PaginatedResponse<AiConversationItem>>('/api/admin/AiConversations/list', params),
  detail: (params: { id: number }) => request.post<AiConversationDetailResponse>('/api/admin/AiConversations/detail', params),
  add: (params: { agent_id: number; title?: string }) => request.post<{ id: number }>('/api/admin/AiConversations/add', params),
  edit: (params: { id: number; title: string }) => request.post<void>('/api/admin/AiConversations/edit', params),
  del: (params: { id: number | number[] }) => request.post<void>('/api/admin/AiConversations/del', params),
  status: (params: { id: number | number[]; status: number }) => request.post<void>('/api/admin/AiConversations/status', params),
}
