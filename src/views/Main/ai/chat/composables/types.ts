import type { Ref } from 'vue'
import type { AiMessageMeta, MessageBlock as ApiMessageBlock } from '@/api/ai/messages'

// 从 API 层重新导出，统一类型来源
export type { StreamCallbacks, Attachment } from '@/api/ai/chat'

export type MessageBlock = ApiMessageBlock
export type ImageMessageBlock = Extract<MessageBlock, { type: 'image' }>

// 工具调用记录
export interface ToolCallRecord {
  call_id: string
  tool_name: string
  tool_inputs: Record<string, unknown>
  tool_result?: string
  status: 'calling' | 'done'
  _expanded?: boolean
}

// 会话类型
export interface Conversation {
  id: number
  title: string
  agent_id?: number
  agent_name?: string
  agent_avatar?: string
  last_message_at: string
  created_at: string
  updated_at?: string
  status?: number
  status_name?: string
}

// 消息类型
export interface Message {
  id: number
  role: number  // AiRoleEnum: 1=USER, 2=ASSISTANT
  content: string
  created_at: string
  isStreaming?: boolean
  tool_calls?: ToolCallRecord[]
  meta_json?: AiMessageMeta
}

// 智能体类型
export interface Agent {
  id: number
  name: string
  avatar?: string | null
  description?: string
}

// 流式聊天选项
export interface StreamChatOptions {
  messages: Ref<Message[]>
  conversations: Ref<Conversation[]>
  currentConversationId: Ref<number | null>
  selectedAgentId: Ref<number | null>
  selectedAgent: Ref<Agent | undefined>
  scrollToBottom: () => void
  loadMessages: () => Promise<void>
}
