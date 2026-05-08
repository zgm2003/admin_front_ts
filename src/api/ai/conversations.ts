import request from '@/lib/http'
import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'
import type { Id, PaginatedResponse, RequestPayload } from '@/types/common'

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
  title: string
  last_message_at: string
  status: number
  created_at: string
  updated_at: string
}

interface AiConversationListQueryParams {
  current_page?: number
  page_size?: number
  status?: number
  agent_id?: number
  title?: string
}

interface AiConversationCreateBody {
  agent_id: number
  title?: string
}

interface AiConversationTitleBody {
  title: string
}

function normalizeListParams(params: AiConversationListParams): AiConversationListQueryParams {
  const query: AiConversationListQueryParams = {}
  if (typeof params.current_page === 'number') query.current_page = params.current_page
  if (typeof params.page_size === 'number') query.page_size = params.page_size
  if (typeof params.status === 'number') query.status = params.status
  if (typeof params.agent_id === 'number') query.agent_id = params.agent_id
  if (params.title) query.title = params.title
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
  list: (params: AiConversationListParams) => request.get<PaginatedResponse<AiConversationItem>>(`${ADMIN_API_PREFIX}/ai-conversations`, { params: normalizeListParams(params) }),
  detail: (params: { id: Id }) => request.get<AiConversationDetailResponse>(`${ADMIN_API_PREFIX}/ai-conversations/${positiveID(params.id)}`),
  add: (params: { agent_id: number; title?: string }) => request.post<{ id: number }, AiConversationCreateBody>(`${ADMIN_API_PREFIX}/ai-conversations`, params),
  edit: (params: { id: Id; title: string }) => request.put<void, AiConversationTitleBody>(`${ADMIN_API_PREFIX}/ai-conversations/${positiveID(params.id)}`, { title: params.title }),
  del: async (params: { id: Id | Id[] }): Promise<void> => {
    const ids = Array.isArray(params.id) ? params.id : [params.id]
    await Promise.all(ids.map((item) => deleteConversation(positiveID(item))))
  },
  status: async (params: { id: Id | Id[]; status: number }): Promise<void> => {
    const ids = Array.isArray(params.id) ? params.id : [params.id]
    await Promise.all(ids.map((item) => request.patch<void, { status: number }>(`${ADMIN_API_PREFIX}/ai-conversations/${positiveID(item)}/status`, { status: params.status })))
  },
}
