import { ref, shallowRef } from 'vue'
import type { Message, Conversation } from './types'

/** 单个智能体的独立会话快照 */
export interface ChatSession {
  agentId: number
  conversationId: number | null
  messages: Message[]
  conversations: Conversation[]
  conversationsLoaded: boolean
  // 流式状态
  isStreaming: boolean
  sending: boolean
  streamingContent: string
  currentRunId: number | null
  deltaBuffer: string
}

const MAX_SESSIONS = 5

export function useChatSessionManager() {
  /** 所有缓存的会话 Map<agentId, ChatSession> */
  const sessions = shallowRef(new Map<number, ChatSession>())
  /** 按访问顺序记录 agentId，用于 LRU 淘汰 */
  const accessOrder = ref<number[]>([])

  /** 创建空白 session */
  const createSession = (agentId: number): ChatSession => ({
    agentId,
    conversationId: null,
    messages: [],
    conversations: [],
    conversationsLoaded: false,
    isStreaming: false,
    sending: false,
    streamingContent: '',
    currentRunId: null,
    deltaBuffer: '',
  })

  /** 获取或创建 session */
  const getOrCreate = (agentId: number): ChatSession => {
    let session = sessions.value.get(agentId)
    if (!session) {
      session = createSession(agentId)
      sessions.value.set(agentId, session)
    }
    // 更新访问顺序
    accessOrder.value = [agentId, ...accessOrder.value.filter(id => id !== agentId)]
    // LRU 淘汰（只淘汰非流式的）
    evict()
    return session
  }

  /** LRU 淘汰超出上限的非活跃 session */
  const evict = () => {
    while (accessOrder.value.length > MAX_SESSIONS) {
      const oldest = accessOrder.value[accessOrder.value.length - 1]
      if (oldest === undefined) break
      const session = sessions.value.get(oldest)
      // 正在流式输出的不淘汰
      if (session?.isStreaming) break
      sessions.value.delete(oldest)
      accessOrder.value.pop()
    }
  }

  /** 将当前 UI 状态保存到 session（挂起） */
  const suspend = (
    agentId: number,
    state: {
      conversationId: number | null
      messages: Message[]
      conversations: Conversation[]
      conversationsLoaded: boolean
      isStreaming: boolean
      sending: boolean
      streamingContent: string
      currentRunId: number | null
      deltaBuffer: string
    }
  ) => {
    const session = getOrCreate(agentId)
    session.conversationId = state.conversationId
    // 深拷贝 messages 避免引用问题
    session.messages = state.messages.map(m => ({ ...m, meta_json: m.meta_json ? { ...m.meta_json } : undefined }))
    session.conversations = [...state.conversations]
    session.conversationsLoaded = state.conversationsLoaded
    session.isStreaming = state.isStreaming
    session.sending = state.sending
    session.streamingContent = state.streamingContent
    session.currentRunId = state.currentRunId
    session.deltaBuffer = state.deltaBuffer
  }

  /** 从 session 恢复状态（恢复） */
  const resume = (agentId: number): ChatSession | null => {
    const session = sessions.value.get(agentId)
    if (!session) return null
    // 更新访问顺序
    accessOrder.value = [agentId, ...accessOrder.value.filter(id => id !== agentId)]
    return session
  }

  /** 获取 session（不创建） */
  const get = (agentId: number): ChatSession | undefined => {
    return sessions.value.get(agentId)
  }

  /** 删除 session */
  const remove = (agentId: number) => {
    sessions.value.delete(agentId)
    accessOrder.value = accessOrder.value.filter(id => id !== agentId)
  }

  /** 检查某个 agent 是否有活跃的流式输出 */
  const hasActiveStream = (agentId: number): boolean => {
    return sessions.value.get(agentId)?.isStreaming ?? false
  }

  /** 清理所有 session */
  const clear = () => {
    sessions.value.clear()
    accessOrder.value = []
  }

  return {
    sessions,
    getOrCreate,
    suspend,
    resume,
    get,
    remove,
    hasActiveStream,
    clear,
  }
}
