import type { AiMessageContentType, AiMessageContext, AiMessageMeta } from '@/api/ai/messages'
import type { AiAgentEffectiveCapabilities, AiAgentOfficialModelSummary } from '@/api/ai/agents'

export interface Conversation {
  id: number
  agent_id: number
  agent_name: string
  title: string
  last_message_at: string
  created_at?: string
  updated_at: string
  unread_count: number
}

export interface Message {
  id: number
  role: number
  content_type: AiMessageContentType
  content: string
  created_at: string
  updated_at: string
  meta_json?: AiMessageMeta
  context?: AiMessageContext | null
  paired_message_id: number | null
  run_id: number | null
  liked: boolean
  delivery_state: 'completed' | 'stopped' | null
  settlement_pending: boolean
  isStreaming?: boolean
  request_id?: string
}

export interface Agent {
  id: number
  name: string
  avatar?: string | null
  description?: string
  provider_model_id: number
  official_model: AiAgentOfficialModelSummary
  capabilities: AiAgentEffectiveCapabilities
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
  stopCommitPendingRequestId: string
  streamingContent: string
  lastContinuousDeliverySeq: number
  canceledRequestIds: string[]
  settlementPendingRequestIds: string[]
  updatedAt: number
}
