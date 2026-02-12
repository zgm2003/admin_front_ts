import request from '@/utils/request'

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

/** 游标分页响应 */
export interface CursorPageResponse<T> {
  list: T[]
  next_cursor: number | null
  has_more: boolean
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
  conversationList: (params?: any) => request.post<{ list: ConversationItem[] }>(`${BASE}/conversationList`, params),
  createPrivate: (params: { user_id: number }) => request.post<{ conversation: ConversationItem }>(`${BASE}/createPrivate`, params),
  createGroup: (params: { name: string; user_ids: number[] }) => request.post<{ conversation: ConversationItem }>(`${BASE}/createGroup`, params),
  deleteConversation: (params: { conversation_id: number }) => request.post(`${BASE}/deleteConversation`, params),

  // 群聊管理
  groupInfo: (params: { conversation_id: number }) => request.post(`${BASE}/groupInfo`, params),
  groupUpdate: (params: { conversation_id: number; name?: string; announcement?: string }) => request.post(`${BASE}/groupUpdate`, params),
  groupInvite: (params: { conversation_id: number; user_ids: number[] }) => request.post(`${BASE}/groupInvite`, params),
  groupKick: (params: { conversation_id: number; user_id: number }) => request.post(`${BASE}/groupKick`, params),
  groupLeave: (params: { conversation_id: number }) => request.post(`${BASE}/groupLeave`, params),
  groupTransfer: (params: { conversation_id: number; user_id: number }) => request.post(`${BASE}/groupTransfer`, params),

  // 消息
  sendMessage: (params: { conversation_id: number; type: MessageType; content: string; meta_json?: Record<string, any> }) => request.post<{ message: MessageItem }>(`${BASE}/sendMessage`, params),
  messageList: (params: { conversation_id: number; cursor?: number; page_size?: number }) => request.post<CursorPageResponse<MessageItem>>(`${BASE}/messageList`, params),
  markRead: (params: { conversation_id: number }) => request.post(`${BASE}/markRead`, params),

  // 联系人
  contactList: (params?: any) => request.post<{ list: ContactItem[] }>(`${BASE}/contactList`, params),
  contactAdd: (params: { user_id: number }) => request.post(`${BASE}/contactAdd`, params),
  contactConfirm: (params: { user_id: number }) => request.post(`${BASE}/contactConfirm`, params),
  contactDelete: (params: { user_id: number }) => request.post(`${BASE}/contactDelete`, params),

  // 实时
  typing: (params: { conversation_id: number }) => request.post(`${BASE}/typing`, params),
  onlineStatus: (params: { user_ids: number[] }) => request.post<{ list: { user_id: number; is_online: boolean }[] }>(`${BASE}/onlineStatus`, params),
}
