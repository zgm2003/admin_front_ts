import request from '@/lib/http'
import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'
import type { Id, PaginatedResponse, RequestPayload } from '@/types/common'
import type { Attachment } from './chat'

export type MessageBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; url: string; alt?: string; meta?: Record<string, unknown> }
  | { type: 'tool'; name: string; status?: string; meta?: Record<string, unknown> }
  | { type: 'error'; message: string; meta?: Record<string, unknown> }

export interface AiMessageMeta {
  attachments?: Attachment[]
  blocks?: MessageBlock[]
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
  role?: number
}

interface AiMessageListQueryParams {
  current_page?: number
  page_size?: number
  role?: number
}

function positiveID(value: Id | number, label = 'AI message id'): number {
  const id = typeof value === 'number' ? value : Number(value)
  if (!Number.isInteger(id) || id <= 0) throw new Error(`${label} must be a positive integer`)
  return id
}

function normalizeListParams(params: AiMessageListParams): AiMessageListQueryParams {
  const query: AiMessageListQueryParams = {}
  if (typeof params.current_page === 'number') query.current_page = params.current_page
  if (typeof params.page_size === 'number') query.page_size = params.page_size
  if (typeof params.role === 'number') query.role = params.role
  return query
}

function normalizeIDs(id: Id | Id[]): number[] {
  const ids = Array.isArray(id) ? id : [id]
  return [...new Set(ids.map((item) => positiveID(item)))]
}

export const AiMessageApi = {
  list: (params: AiMessageListParams) => request.get<PaginatedResponse<AiMessageItem>>(`${ADMIN_API_PREFIX}/ai-conversations/${positiveID(params.conversation_id, 'conversation id')}/messages`, { params: normalizeListParams(params) }),
  del: (params: { id: Id | Id[] }) => {
    const ids = normalizeIDs(params.id)
    if (ids.length === 1) {
      return request.delete<void>(`${ADMIN_API_PREFIX}/ai-messages/${ids[0]}`)
    }
    return request.delete<void, { ids: number[] }>(`${ADMIN_API_PREFIX}/ai-messages`, { data: { ids } })
  },
  editContent: (params: { id: Id; content: string }) => request.patch<{ deleted_count: number }, { content: string }>(`${ADMIN_API_PREFIX}/ai-messages/${positiveID(params.id, 'message id')}/content`, { content: params.content }),
  feedback: (params: { id: Id; feedback?: number | null }) => request.patch<void, { feedback: number | null }>(`${ADMIN_API_PREFIX}/ai-messages/${positiveID(params.id, 'message id')}/feedback`, { feedback: params.feedback ?? null }),
}
