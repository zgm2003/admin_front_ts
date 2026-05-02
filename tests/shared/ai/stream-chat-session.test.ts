import { nextTick, ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import type { Ref } from 'vue'
import type { ChatSession } from '../../../src/views/Main/ai/chat/composables/useChatSessionManager'
import type { Agent, Conversation, Message } from '../../../src/views/Main/ai/chat/composables/types'

const mocks = vi.hoisted(() => ({
  stream: vi.fn(),
  cancel: vi.fn(),
  del: vi.fn(),
  editContent: vi.fn(),
  notifyError: vi.fn(),
  notifyWarning: vi.fn(),
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('element-plus', () => ({
  ElNotification: {
    error: mocks.notifyError,
    warning: mocks.notifyWarning,
  },
}))

vi.mock('@/api/ai/chat', () => ({
  AiChatApi: {
    stream: mocks.stream,
    cancel: mocks.cancel,
  },
}))

vi.mock('@/api/ai/messages', () => ({
  AiMessageApi: {
    del: mocks.del,
    editContent: mocks.editContent,
  },
}))

function createDeferred() {
  let resolve!: () => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<void>((res, rej) => {
    resolve = res
    reject = rej
  })

  return { promise, resolve, reject }
}

function createSession(agentId: number): ChatSession {
  return {
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
  }
}

function createHarness() {
  const sessions = new Map<number, ChatSession>()
  const selectedAgentId = ref<number | null>(1)
  const selectedAgent = ref<Agent | undefined>({ id: 1, name: 'Agent A' })
  const messages = ref<Message[]>([])
  const conversations = ref<Conversation[]>([])
  const currentConversationId = ref<number | null>(null)
  const scrollToBottom = vi.fn()

  const getSession = (agentId: number): ChatSession => {
    let session = sessions.get(agentId)
    if (!session) {
      session = createSession(agentId)
      sessions.set(agentId, session)
    }
    return session
  }

  return {
    sessions,
    selectedAgentId,
    selectedAgent: selectedAgent as Ref<Agent | undefined>,
    messages,
    conversations,
    currentConversationId,
    scrollToBottom,
    getSession,
  }
}

describe('useStreamChat agent session isolation', () => {
  it('allows another agent to send while the previous agent stream is still pending', async () => {
    const { useStreamChat } = await import('../../../src/views/Main/ai/chat/composables/useStreamChat')
    const harness = createHarness()
    const firstStream = createDeferred()
    const secondStream = createDeferred()

    mocks.stream
      .mockImplementationOnce(() => firstStream.promise)
      .mockImplementationOnce(() => secondStream.promise)

    const chat = useStreamChat({
      messages: harness.messages,
      conversations: harness.conversations,
      currentConversationId: harness.currentConversationId,
      selectedAgentId: harness.selectedAgentId,
      selectedAgent: harness.selectedAgent,
      scrollToBottom: harness.scrollToBottom,
      loadMessages: vi.fn(),
      getActiveAgentId: () => harness.selectedAgentId.value,
      getSession: harness.getSession,
    })

    const firstSend = chat.send('message for A')
    await nextTick()

    expect(mocks.stream).toHaveBeenCalledTimes(1)
    expect(harness.sessions.get(1)?.sending).toBe(true)
    expect(chat.sending.value).toBe(true)

    harness.selectedAgentId.value = 2
    harness.selectedAgent.value = { id: 2, name: 'Agent B' }
    harness.messages.value = []
    harness.currentConversationId.value = null

    const secondSend = chat.send('message for B')
    await nextTick()

    expect(mocks.stream).toHaveBeenCalledTimes(2)
    expect(harness.sessions.get(2)?.sending).toBe(true)
    expect(chat.sending.value).toBe(true)

    firstStream.resolve()
    await firstSend

    expect(harness.sessions.get(1)?.sending).toBe(false)
    expect(harness.sessions.get(2)?.sending).toBe(true)
    expect(chat.sending.value).toBe(true)

    secondStream.resolve()
    await secondSend

    expect(harness.sessions.get(2)?.sending).toBe(false)
    expect(chat.sending.value).toBe(false)
  })
})
