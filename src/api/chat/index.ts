import { legacyRequest } from '@/lib/http'
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
  meta_json: Record<string, any> | null
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

// ============ API ============

const BASE = '/api/admin/Chat'

export const ChatRoomApi = {
  // 会话
  conversationList: (params?: any) => legacyRequest.post<{ list: ConversationItem[] }>(`${BASE}/conversationList`, params),
  createPrivate: (params: { user_id: number }) => legacyRequest.post<{ conversation: ConversationItem }>(`${BASE}/createPrivate`, params),
  createGroup: (params: { name: string; user_ids: number[] }) => legacyRequest.post<{ conversation: ConversationItem }>(`${BASE}/createGroup`, params),
  deleteConversation: (params: { conversation_id: number }) => legacyRequest.post(`${BASE}/deleteConversation`, params),
  togglePin: (params: { conversation_id: number }) => legacyRequest.post(`${BASE}/togglePin`, params),

  // 群聊管理
  groupInfo: (params: { conversation_id: number }) => legacyRequest.post(`${BASE}/groupInfo`, params),
  groupUpdate: (params: { conversation_id: number; name?: string; announcement?: string }) => legacyRequest.post(`${BASE}/groupUpdate`, params),
  groupInvite: (params: { conversation_id: number; user_ids: number[] }) => legacyRequest.post(`${BASE}/groupInvite`, params),
  groupKick: (params: { conversation_id: number; user_id: number }) => legacyRequest.post(`${BASE}/groupKick`, params),
  groupLeave: (params: { conversation_id: number }) => legacyRequest.post(`${BASE}/groupLeave`, params),
  groupTransfer: (params: { conversation_id: number; user_id: number }) => legacyRequest.post(`${BASE}/groupTransfer`, params),
  setAdmin: (params: { conversation_id: number; user_id: number; is_admin: boolean }) => legacyRequest.post(`${BASE}/setAdmin`, params),

  // 消息
  sendMessage: (params: { conversation_id: number; type: MessageType; content: string; meta_json?: Record<string, any> }) => legacyRequest.post<{ message: MessageItem }>(`${BASE}/sendMessage`, params),
  messageList: (params: { conversation_id: number; current_page: number; page_size?: number }) => legacyRequest.post<PaginatedResponse<MessageItem>>(`${BASE}/messageList`, params),
  markRead: (params: { conversation_id: number }) => legacyRequest.post(`${BASE}/markRead`, params),
  recallMessage: (params: { message_id: number }) => legacyRequest.post(`${BASE}/recallMessage`, params),

  // 联系人
  contactList: (params?: any) => legacyRequest.post<{ list: ContactItem[] }>(`${BASE}/contactList`, params),
  contactAdd: (params: { user_id: number }) => legacyRequest.post(`${BASE}/contactAdd`, params),
  contactConfirm: (params: { user_id: number }) => legacyRequest.post(`${BASE}/contactConfirm`, params),
  contactDelete: (params: { user_id: number }) => legacyRequest.post(`${BASE}/contactDelete`, params),

  // 实时
  typing: (params: { conversation_id: number }) => legacyRequest.post(`${BASE}/typing`, params),
  onlineStatus: (params: { user_ids: number[] }) => legacyRequest.post<{ online_status: Record<number, boolean> }>(`${BASE}/onlineStatus`, params),
}
