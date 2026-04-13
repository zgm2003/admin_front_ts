import request from '@/lib/http'
import type { PaginatedResponse, RequestPayload } from '@/types/common'
import type { Attachment } from './chat'

export interface AiMessageMeta {
  attachments?: Attachment[]
  feedback?: number
  [key: string]: unknown
}

export interface AiMessageItem {
  id: number
  conversation_id: number
  role: number
  content: string
  meta_json?: AiMessageMeta
  created_at: string
}

export interface AiMessageListParams extends RequestPayload {
  conversation_id: number
  current_page: number
  page_size: number
}

export const AiMessageApi = {
  list: (params: AiMessageListParams) => request.post<PaginatedResponse<AiMessageItem>>('/api/admin/AiMessages/list', params),
  del: (params: { id: number | number[] }) => request.post<void>('/api/admin/AiMessages/del', params),
  editContent: (params: { id: number; content: string }) => request.post<{ deleted_count: number }>('/api/admin/AiMessages/editContent', params),
  feedback: (params: { id: number; feedback?: number }) => request.post<void>('/api/admin/AiMessages/feedback', params),
}
