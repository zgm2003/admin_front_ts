import request from '@/lib/http'
import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'
import type { Id } from '@/types/common'

export type AiMessageContentType = 'text'

export interface AiChatAttachment {
  type: 'image'
  url: string
  name: string
  size: number
}

export type MessageBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; url: string; alt?: string; meta?: Record<string, unknown> }
  | { type: 'tool'; name: string; status?: string; meta?: Record<string, unknown> }
  | { type: 'error'; message: string; meta?: Record<string, unknown> }

export interface AiMessageMeta {
  attachments?: AiChatAttachment[]
  blocks?: MessageBlock[]
  feedback?: number
  [key: string]: unknown
}

export interface AiMessageItem {
  id: number
  role: number
  content_type: AiMessageContentType
  content: string
  created_at: string
  updated_at: string
  meta_json?: AiMessageMeta
}

export interface AiMessageListParams {
  conversation_id: number
  before_id?: number
  limit?: number
}

export interface AiMessageListResponse {
  list: AiMessageItem[]
  next_id: number
  has_more: boolean
}

export interface AiMessageSendParams {
  conversation_id: number
  content: string
  request_id: string
  attachments?: AiChatAttachment[]
  runtime_params?: Record<string, number>
}

export interface AiMessageSendResponse {
  conversation_id: number
  user_message_id: number
  request_id: string
}

interface AiMessageListQueryParams {
  before_id?: number
  limit?: number
}

interface AiMessageSendBody {
  content: string
  request_id: string
  attachments?: AiChatAttachment[]
  runtime_params?: Record<string, number>
}

function positiveID(value: Id | number, label = 'AI message id'): number {
  const id = typeof value === 'number' ? value : Number(value)
  if (!Number.isInteger(id) || id <= 0) throw new Error(`${label} must be a positive integer`)
  return id
}

function normalizeListParams(params: AiMessageListParams): AiMessageListQueryParams {
  const query: AiMessageListQueryParams = {}
  if (typeof params.before_id === 'number') query.before_id = params.before_id
  if (typeof params.limit === 'number') query.limit = params.limit
  return query
}

export const AiMessageApi = {
  list: (params: AiMessageListParams) => request.get<AiMessageListResponse>(`${ADMIN_API_PREFIX}/ai-conversations/${positiveID(params.conversation_id, 'conversation id')}/messages`, { params: normalizeListParams(params) }),
  send: (params: AiMessageSendParams) => request.post<AiMessageSendResponse, AiMessageSendBody>(`${ADMIN_API_PREFIX}/ai-conversations/${positiveID(params.conversation_id, 'conversation id')}/messages`, {
    content: params.content,
    request_id: params.request_id,
    attachments: params.attachments,
    runtime_params: params.runtime_params,
  }),
}
