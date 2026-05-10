import type { AiMessageContentType, AiMessageMeta } from '@/api/ai/messages'

export interface Conversation {
  id: number
  agent_id: number
  agent_name: string
  title: string
  last_message_at: string
  created_at?: string
  updated_at: string
}

export interface Message {
  id: number
  role: number
  content_type: AiMessageContentType
  content: string
  created_at: string
  updated_at: string
  meta_json?: AiMessageMeta
  isStreaming?: boolean
  request_id?: string
}

export interface Agent {
  id: number
  name: string
  avatar?: string | null
  description?: string
}

export interface ConversationSession {
  conversationId: number
  messages: Message[]
  nextMessageId: number
  hasMoreMessages: boolean
  loadingMessages: boolean
  loadingMoreMessages: boolean
  sending: boolean
  isStreaming: boolean
  pendingRequestId: string
  streamingContent: string
  canceledRequestIds: string[]
  updatedAt: number
}
