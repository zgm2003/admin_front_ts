import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'
import { ChatRoomApi, type ConversationItem, type MessageItem, type ContactItem, MessageType } from '@/api/chat'
import { useUserStore } from '@/store/user'
import { onWsMessage, type WsMessage } from '@/hooks/useWebSocket'

interface ChatState {
  /** 会话列表 */
  conversations: ConversationItem[]
  /** 当前选中的会话 */
  currentConversation: ConversationItem | null
  /** 消息列表，按 conversationId 分组 */
  messagesMap: Map<number, MessageItem[]>
  /** 消息 ID 集合，用于 O(1) 去重 */
  messageIdSets: Map<number, Set<number>>
  /** 各会话游标，用于加载更多 */
  cursorMap: Map<number, number | null>
  /** 各会话是否还有更多消息 */
  hasMoreMap: Map<number, boolean>
  /** 联系人列表 */
  contacts: ContactItem[]
  /** 正在输入的用户 { conversationId -> Set<userId> } */
  typingUsers: Map<number, Set<number>>
  /** 在线用户集合 */
  onlineUsers: Set<number>
  /** 群信息更新版本号（用于触发面板刷新） */
  groupInfoVersion: number
  /** 会话列表加载中 */
  loading: boolean
  /** 消息发送中 */
  sending: boolean
  /** WebSocket 清理函数 */
  _wsCleanups: (() => void)[]
}

interface GroupUpdateData {
  conversation_id: number
  action?: 'kicked' | 'member_added' | 'member_removed' | 'info_updated'
}

// 输入状态自动清除定时器
const typingTimers = new Map<string, ReturnType<typeof setTimeout>>()

export const useChatStore = defineStore('chat', {
  state: (): ChatState => ({
    conversations: [],
    currentConversation: null,
    messagesMap: new Map(),
    messageIdSets: new Map(),
    cursorMap: new Map(),
    hasMoreMap: new Map(),
    contacts: [],
    typingUsers: new Map(),
    onlineUsers: new Set(),
    groupInfoVersion: 0,
    loading: false,
    sending: false,
    _wsCleanups: [],
  }),

  getters: {
    /** 当前会话的消息列表 */
    currentMessages(state): MessageItem[] {
      if (!state.currentConversation) return []
      return state.messagesMap.get(state.currentConversation.id) || []
    },

    /** 当前会话是否还有更多历史消息 */
    currentHasMore(state): boolean {
      if (!state.currentConversation) return false
      return state.hasMoreMap.get(state.currentConversation.id) ?? true
    },

    /** 总未读数 */
    totalUnread(state): number {
      return state.conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0)
    },

    /** 当前会话正在输入的用户 ID 列表 */
    currentTypingUsers(state): number[] {
      if (!state.currentConversation) return []
      const set = state.typingUsers.get(state.currentConversation.id)
      return set ? Array.from(set) : []
    },
  },

  actions: {
    // ============ 会话 ============

    async loadConversations() {
      this.loading = true
      try {
        const data = await ChatRoomApi.conversationList()
        this.conversations = data.list || []
      } finally {
        this.loading = false
      }
    },

    async selectConversation(conversation: ConversationItem) {
      this.currentConversation = conversation

      // 首次选中时加载消息
      if (!this.messagesMap.has(conversation.id)) {
        await this.loadMessages(conversation.id)
      }

      // 标记已读
      if (conversation.unread_count > 0) {
        await this.markRead(conversation.id)
      }
    },

    async createPrivateChat(userId: number) {
      const data = await ChatRoomApi.createPrivate({ user_id: userId })
      const conv = data.conversation
      await this.loadConversations()
      return conv
    },

    async createGroupChat(name: string, userIds: number[]) {
      const data = await ChatRoomApi.createGroup({ name, user_ids: userIds })
      const conv = data.conversation
      await this.loadConversations()
      return conv
    },

    async deleteConversation(conversationId: number) {
      await ChatRoomApi.deleteConversation({ conversation_id: conversationId })
      this.conversations = this.conversations.filter(c => c.id !== conversationId)
      if (this.currentConversation?.id === conversationId) {
        this.currentConversation = null
      }
      this.messagesMap.delete(conversationId)
      this.messageIdSets.delete(conversationId)
      this.cursorMap.delete(conversationId)
      this.hasMoreMap.delete(conversationId)
    },

    async togglePin(conversationId: number) {
      await ChatRoomApi.togglePin({ conversation_id: conversationId })
      await this.loadConversations()
    },

    // ============ 消息 ============

    async loadMessages(conversationId: number, pageSize = 30, reload = false) {
      // reload 模式：清空缓存，重新加载最新消息
      if (reload) {
        this.messagesMap.delete(conversationId)
        this.messageIdSets.delete(conversationId)
        this.cursorMap.delete(conversationId)
        this.hasMoreMap.delete(conversationId)
      }

      const cursor = this.cursorMap.get(conversationId)
      const data = await ChatRoomApi.messageList({
        conversation_id: conversationId,
        cursor: cursor ?? undefined,
        page_size: pageSize,
      })

      const existing = this.messagesMap.get(conversationId) || []
      // 历史消息插入到前面（消息按 id DESC 返回，需要反转）
      const newMessages = (data.list || []).reverse()
      const merged = [...newMessages, ...existing]
      this.messagesMap.set(conversationId, merged)
      // 重建 ID 集合
      this.messageIdSets.set(conversationId, new Set(merged.map(m => m.id)))
      this.cursorMap.set(conversationId, data.next_cursor)
      this.hasMoreMap.set(conversationId, data.has_more)
    },

    async loadMoreMessages() {
      if (!this.currentConversation) return
      const id = this.currentConversation.id
      if (!this.hasMoreMap.get(id)) return
      await this.loadMessages(id)
    },

    async sendMessage(conversationId: number, type: MessageType, content: string, metaJson?: Record<string, unknown>) {
      this.sending = true
      try {
        const data = await ChatRoomApi.sendMessage({
          conversation_id: conversationId,
          type,
          content,
          meta_json: metaJson,
        })
        const msg = data.message
        // 补充当前用户的 sender 信息，避免本地显示"用户undefined"
        const userStore = useUserStore()
        if (!msg.sender) {
          msg.sender = {
            id: Number(userStore.user_id),
            username: userStore.username,
            avatar: userStore.avatar,
          }
        }
        // 追加到本地消息列表
        this._appendMessage(conversationId, msg)
        // 更新会话的最后消息
        this._updateConversationLastMessage(conversationId, msg)
        return msg
      } finally {
        this.sending = false
      }
    },

    async markRead(conversationId: number) {
      await ChatRoomApi.markRead({ conversation_id: conversationId })
      const conv = this.conversations.find(c => c.id === conversationId)
      if (conv) conv.unread_count = 0
    },

    // ============ 联系人 ============

    async loadContacts() {
      const data = await ChatRoomApi.contactList()
      this.contacts = data.list || []
    },

    // ============ WebSocket 消息处理 ============

    /** 处理收到的 WebSocket 消息（统一入口） */
    handleWsMessage(message: WsMessage) {
      switch (message.type) {
        case 'chat_message':
          this._handleChatMessage(message.data)
          break
        case 'chat_typing':
          this._handleChatTyping(message.data)
          break
        case 'chat_read':
          this._handleChatRead(message.data)
          break
        case 'chat_online':
          this._handleChatOnline(message.data)
          break
        case 'chat_message_recall':
          this._handleMessageRecall(message.data)
          break
        case 'chat_group_update':
          this._handleGroupUpdate(message.data)
          break
        case 'chat_contact_request':
          this._handleContactRequest(message.data)
          break
        case 'chat_contact_rejected':
          this._handleContactRejected(message.data)
          break
        case 'chat_contact_confirmed':
          this._handleContactConfirmed(message.data)
          break
        case 'chat_contact_deleted':
          this._handleContactDeleted(message.data)
          break
      }
    },

    _handleChatMessage(data: { conversation_id: number; message: MessageItem }) {
      const { conversation_id, message } = data
      this._appendMessage(conversation_id, message)
      this._updateConversationLastMessage(conversation_id, message)

      // 如果是新会话（不在列表中），刷新会话列表
      const convExists = this.conversations.some(c => c.id === conversation_id)
      if (!convExists) {
        this.loadConversations()
        return
      }

      // 非当前会话则增加未读
      if (this.currentConversation?.id !== conversation_id) {
        const conv = this.conversations.find(c => c.id === conversation_id)
        if (conv) conv.unread_count = (conv.unread_count || 0) + 1
      } else {
        // 当前会话自动标记已读
        ChatRoomApi.markRead({ conversation_id }).catch(() => {})
      }
    },

    _handleChatTyping(data: { conversation_id: number; user_id: number }) {
      const { conversation_id, user_id } = data
      if (!this.typingUsers.has(conversation_id)) {
        this.typingUsers.set(conversation_id, new Set())
      }
      this.typingUsers.get(conversation_id)!.add(user_id)

      // 3 秒后自动清除输入状态
      const key = `${conversation_id}_${user_id}`
      if (typingTimers.has(key)) clearTimeout(typingTimers.get(key)!)
      typingTimers.set(key, setTimeout(() => {
        this.typingUsers.get(conversation_id)?.delete(user_id)
        typingTimers.delete(key)
      }, 3000))
    },

    _handleChatRead(data: { conversation_id: number; user_id: number }) {
      // 对方已读，可用于显示已读状态（暂存数据，组件按需使用）
      void data
    },

    _handleChatOnline(data: { user_id: number; is_online: boolean }) {
      if (data.is_online) {
        this.onlineUsers.add(data.user_id)
      } else {
        this.onlineUsers.delete(data.user_id)
      }
    },

    _handleMessageRecall(data: { conversation_id: number; message_id: number }) {
      const { conversation_id, message_id } = data
      const messages = this.messagesMap.get(conversation_id)
      if (!messages) return

      // 找到被撤回的消息
      const msg = messages.find(m => m.id === message_id)
      if (!msg) return

      // 标记为已撤回（修改内容为撤回提示）
      const userStore = useUserStore()
      const isMyMessage = msg.sender_id === Number(userStore.user_id)
      msg.content = isMyMessage ? '你撤回了一条消息' : `${msg.sender?.username || '对方'}撤回了一条消息`
      msg.type = MessageType.System
      msg.meta_json = { recalled: true }
    },

    _handleGroupUpdate(data: GroupUpdateData) {
      const conversationId = data.conversation_id
      
      // 群信息更新，刷新会话列表 + 通知群信息面板刷新
      this.loadConversations().then(() => {
        // 检查当前会话是否还存在（可能被踢出群或退群）
        if (this.currentConversation?.id === conversationId) {
          const stillExists = this.conversations.find(c => c.id === conversationId)
          if (stillExists) {
            // 会话仍存在，同步更新
            this.currentConversation = stillExists
          } else {
            // 会话已消失（被踢出群或退群），清空当前会话
            this.currentConversation = null
            // 如果是被踢出，显示提示
            if (data.action === 'kicked') {
              ElMessage.warning('你已被移出该群聊')
            }
          }
        }
      })
      this.groupInfoVersion++
    },

    _handleContactRequest(_data: { from_user_id: number }) {
      // 收到好友请求，刷新联系人列表
      this.loadContacts()
    },

    _handleContactRejected(_data: { rejected_by: number }) {
      // 好友请求被拒绝，刷新联系人列表
      this.loadContacts()
    },

    _handleContactConfirmed(_data: { confirmed_by: number }) {
      // 好友请求被确认，刷新联系人列表
      this.loadContacts()
    },

    _handleContactDeleted(data: { deleted_by: number; conversation_id: number | null }) {
      // 被对方删除联系人，刷新联系人列表
      this.loadContacts()
      // 如果关联了私聊会话，从本地清理
      if (data.conversation_id) {
        this.conversations = this.conversations.filter(c => c.id !== data.conversation_id)
        if (this.currentConversation?.id === data.conversation_id) {
          this.currentConversation = null
        }
        this.messagesMap.delete(data.conversation_id)
        this.messageIdSets.delete(data.conversation_id)
        this.cursorMap.delete(data.conversation_id)
        this.hasMoreMap.delete(data.conversation_id)
      }
    },

    // ============ 内部工具 ============

    _appendMessage(conversationId: number, message: MessageItem) {
      if (!this.messagesMap.has(conversationId)) {
        this.messagesMap.set(conversationId, [])
        this.messageIdSets.set(conversationId, new Set())
      }
      const idSet = this.messageIdSets.get(conversationId)!
      if (!idSet.has(message.id)) {
        idSet.add(message.id)
        this.messagesMap.get(conversationId)!.push(message)
      }
    },

    _updateConversationLastMessage(conversationId: number, message: MessageItem) {
      const conv = this.conversations.find(c => c.id === conversationId)
      if (conv) {
        conv.last_message_id = message.id
        conv.last_message_at = message.created_at
        conv.last_message_preview = message.type === MessageType.Text
          ? message.content.slice(0, 50)
          : message.type === MessageType.Image ? '[图片]'
          : message.type === MessageType.File ? '[文件]'
          : message.content.slice(0, 50)
        // 将该会话移到列表顶部
        this.conversations = [conv, ...this.conversations.filter(c => c.id !== conversationId)]
      }
    },

    // ============ WebSocket 监听注册/注销 ============

    /** 注册 WebSocket 消息监听（在聊天页面挂载时调用） */
    registerWsListeners() {
      const types = ['chat_message', 'chat_typing', 'chat_read', 'chat_online', 'chat_message_recall', 'chat_group_update', 'chat_contact_request', 'chat_contact_rejected', 'chat_contact_confirmed', 'chat_contact_deleted']
      const handler = (msg: WsMessage) => this.handleWsMessage(msg)
      for (const type of types) {
        const cleanup = onWsMessage(type, handler)
        this._wsCleanups.push(cleanup)
      }
    },

    /** 注销 WebSocket 消息监听（在聊天页面卸载时调用） */
    unregisterWsListeners() {
      this._wsCleanups.forEach(fn => fn())
      this._wsCleanups = []
    },
  },
})
