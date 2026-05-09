import request from '@/lib/http'
import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'
import type { Id } from '@/types/common'

export interface AiConversationListParams {
  agent_id?: number | ''
  before_id?: number
  limit?: number
}

export interface AiConversationItem {
  id: number
  agent_id: number
  agent_name: string
  title: string
  last_message_at: string
  updated_at: string
}

export interface AiConversationDetailResponse {
  id: number
  agent_id: number
  agent_name: string
  title: string
  last_message_at: string
  created_at: string
  updated_at: string
}

export interface AiConversationListResponse {
  list: AiConversationItem[]
  next_id: number
  has_more: boolean
}

interface AiConversationListQueryParams {
  agent_id?: number
  before_id?: number
  limit?: number
}

interface AiConversationCreateBody {
  agent_id: number
  title?: string
}

function normalizeListParams(params: AiConversationListParams = {}): AiConversationListQueryParams {
  const query: AiConversationListQueryParams = {}
  if (typeof params.agent_id === 'number') query.agent_id = params.agent_id
  if (typeof params.before_id === 'number') query.before_id = params.before_id
  if (typeof params.limit === 'number') query.limit = params.limit
  return query
}

function positiveID(value: Id | number): number {
  const id = typeof value === 'number' ? value : Number(value)
  if (!Number.isInteger(id) || id <= 0) throw new Error('AI conversation id must be a positive integer')
  return id
}

function deleteConversation(id: number): Promise<void> {
  return request.delete<void>(`${ADMIN_API_PREFIX}/ai-conversations/${id}`)
}

export const AiConversationApi = {
  list: (params: AiConversationListParams = {}) => request.get<AiConversationListResponse>(`${ADMIN_API_PREFIX}/ai-conversations`, { params: normalizeListParams(params) }),
  detail: (params: { id: Id }) => request.get<AiConversationDetailResponse>(`${ADMIN_API_PREFIX}/ai-conversations/${positiveID(params.id)}`),
  add: (params: { agent_id: number; title?: string }) => request.post<{ id: number }, AiConversationCreateBody>(`${ADMIN_API_PREFIX}/ai-conversations`, params),
  del: async (params: { id: Id | Id[] }): Promise<void> => {
    const ids = Array.isArray(params.id) ? params.id : [params.id]
    await Promise.all(ids.map((item) => deleteConversation(positiveID(item))))
  },
}
