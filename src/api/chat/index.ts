import request from '@/lib/http'
import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'
import type { PaginatedResponse } from '@/types/common'

// ============ Types ============

/** 会话类型 */
export const ConversationType = { Private: 1, Group: 2 } as const
export type ConversationType = (typeof ConversationType)[keyof typeof ConversationType]

/** 消息类型 */
export const MessageType = { Text: 1, Image: 2, File: 3, System: 4 } as const
export type MessageType = (typeof MessageType)[keyof typeof MessageType]

/** 参与者角色 */
export const ParticipantRole = { Owner: 1, Admin: 2, Member: 3 } as const
export type ParticipantRole = (typeof ParticipantRole)[keyof typeof ParticipantRole]

/** 联系人状态 */
export const ContactStatus = { Pending: 1, Confirmed: 2 } as const
export type ContactStatus = (typeof ContactStatus)[keyof typeof ContactStatus]

/** 通用是否枚举 */
export const CommonYesNo = { Yes: 1, No: 2 } as const
export type CommonYesNo = (typeof CommonYesNo)[keyof typeof CommonYesNo]

export type ChatMessageMeta = Record<string, unknown>

/** 会话项 */
export interface ConversationItem {
  id: number
  type: ConversationType
  name: string
  avatar: string
  announcement: string
  owner_id: number
  last_message_id: number
  last_message_at: string
  last_message_preview: string
  member_count: number
  unread_count: number
  is_pinned: number
  created_at: string
}

/** 消息项 */
export interface MessageItem {
  id: number
  conversation_id: number
  sender_id: number
  type: MessageType
  content: string
  meta_json?: ChatMessageMeta | null
  created_at: string
  sender?: { id: number; username: string; avatar: string }
}

/** 参与者项 */
export interface ParticipantItem {
  id: number
  user_id: number
  role: ParticipantRole
  username: string
  avatar: string
  is_online: boolean
}

/** 联系人项 */
export interface ContactItem {
  id: number
  contact_user_id: number
  username: string
  avatar: string
  status: ContactStatus
  is_initiator: number
  is_online: boolean
  created_at: string
}

export interface ConversationListParams {
  current_page?: number
  page_size?: number
}

export interface CreatePrivateParams {
  user_id: number
}

export interface CreateGroupParams {
  name: string
  user_ids: number[]
}

export interface SendMessageParams {
  conversation_id: number
  type: MessageType
  content: string
  meta_json?: ChatMessageMeta
}

export interface MessageListParams {
  conversation_id: number
  current_page: number
  page_size?: number
}

export interface ConversationIDParams {
  conversation_id: number
}

export interface UserIDParams {
  user_id: number
}

export interface OnlineStatusResponse {
  online_status: Record<number, boolean>
}

export interface EmptyResponse {
  _empty?: never
}

// ============ API ============

const BASE = `${ADMIN_API_PREFIX}/chat`

export const ChatRoomApi = {
  // 会话
  conversationList: (params: ConversationListParams = {}) => request.get<{ list: ConversationItem[] }>(`${BASE}/conversations`, { params }),
  createPrivate: (params: CreatePrivateParams) => request.post<{ conversation: ConversationItem }, CreatePrivateParams>(`${BASE}/conversations/private`, params),
  createGroup: (params: CreateGroupParams): Promise<{ conversation: ConversationItem }> => {
    void params
    return Promise.reject(new Error('群聊创建迁移尚未开放'))
  },
  deleteConversation: (params: ConversationIDParams) => request.delete<void>(`${BASE}/conversations/${params.conversation_id}`),
  togglePin: (params: ConversationIDParams) => request.patch<void>(`${BASE}/conversations/${params.conversation_id}/pin`),

  // 群聊管理：后续切片迁移，当前不走旧 PHP 兜底。
  groupInfo: (params: ConversationIDParams): Promise<{ participants: ParticipantItem[] }> => {
    void params
    return Promise.reject(new Error('群聊详情迁移尚未开放'))
  },
  groupUpdate: (params: ConversationIDParams & { name?: string; announcement?: string }): Promise<void> => {
    void params
    return Promise.reject(new Error('群聊编辑迁移尚未开放'))
  },
  groupInvite: (params: ConversationIDParams & { user_ids: number[] }): Promise<void> => {
    void params
    return Promise.reject(new Error('群成员邀请迁移尚未开放'))
  },
  groupKick: (params: ConversationIDParams & UserIDParams): Promise<void> => {
    void params
    return Promise.reject(new Error('群成员移除迁移尚未开放'))
  },
  groupLeave: (params: ConversationIDParams): Promise<void> => {
    void params
    return Promise.reject(new Error('退群迁移尚未开放'))
  },
  groupTransfer: (params: ConversationIDParams & UserIDParams): Promise<void> => {
    void params
    return Promise.reject(new Error('群主转让迁移尚未开放'))
  },
  setAdmin: (params: ConversationIDParams & { user_id: number; is_admin: boolean }): Promise<void> => {
    void params
    return Promise.reject(new Error('群管理员迁移尚未开放'))
  },

  // 消息
  sendMessage: (params: SendMessageParams) => request.post<{ message: MessageItem }, Omit<SendMessageParams, 'conversation_id'>>(`${BASE}/conversations/${params.conversation_id}/messages`, {
    type: params.type,
    content: params.content,
    meta_json: params.meta_json,
  }),
  messageList: (params: MessageListParams) => request.get<PaginatedResponse<MessageItem>>(`${BASE}/conversations/${params.conversation_id}/messages`, {
    params: {
      current_page: params.current_page,
      page_size: params.page_size,
    },
  }),
  markRead: (params: ConversationIDParams) => request.patch<void>(`${BASE}/conversations/${params.conversation_id}/read`),
  recallMessage: (params: { message_id: number }): Promise<void> => {
    void params
    return Promise.reject(new Error('消息撤回迁移尚未开放'))
  },

  // 联系人
  contactList: () => request.get<{ list: ContactItem[] }>(`${BASE}/contacts`),
  contactAdd: (params: UserIDParams) => request.post<void, UserIDParams>(`${BASE}/contacts/${params.user_id}/requests`, params),
  contactConfirm: (params: UserIDParams) => request.patch<void>(`${BASE}/contacts/${params.user_id}/confirm`),
  contactDelete: (params: UserIDParams) => request.delete<void>(`${BASE}/contacts/${params.user_id}`),

  // 实时辅助：后续用 Go realtime typed event 迁移，不再打 legacy POST。
  typing: (params: ConversationIDParams): Promise<void> => {
    void params
    return Promise.resolve()
  },
  onlineStatus: (params: { user_ids: number[] }): Promise<OnlineStatusResponse> => {
    void params
    return Promise.resolve({ online_status: {} })
  },
}
